const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const { patients } = require('./data/patients');
const { trials } = require('./data/trials');
const { evaluateTrial, rankTrialsForPatient, getFieldLabel, LAB_LABELS, FIELD_LABELS } = require('./engine/matchingEngine');
const { parsePatientRecord } = require('./engine/nlp');
const { computeMetrics, robustnessProfile, auditLog } = require('./engine/evaluation');

const app = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    if (process.env.LOG_REQUESTS !== 'false') {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`);
    }
  });
  next();
});

const notFound = (req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });

function findPatient(id) { return patients.find(p => p.id === id || p.mrn === id); }
function findTrial(id) { return trials.find(t => t.id === id || t.nctId === id); }

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ctem-matching-engine', version: '1.0.0', uptime: process.uptime(), patients: patients.length, trials: trials.length });
});

app.get('/api/vocabulary', (req, res) => {
  res.json({ labs: LAB_LABELS, fields: FIELD_LABELS });
});

app.get('/api/patients', (req, res) => {
  const { diagnosis, status } = req.query;
  let data = patients;
  if (diagnosis) data = data.filter(p => p.diagnosis.toLowerCase().includes(String(diagnosis).toLowerCase()));
  res.json({ count: data.length, data });
});

app.get('/api/patients/:id', (req, res) => {
  const p = findPatient(req.params.id);
  if (!p) return res.status(404).json({ error: `Patient ${req.params.id} not found` });
  const parsed = parsePatientRecord(p);
  res.json({ ...p, parse: { noteCount: parsed.noteCount, ambiguities: parsed.ambiguities, temporalAnomalies: parsed.temporalAnomalies, contradictions: parsed.contradictions, labDiscrepancies: parsed.labDiscrepancies } });
});

app.post('/api/patients', (req, res) => {
  const body = req.body || {};
  if (!body.diagnosis) return res.status(400).json({ error: 'diagnosis is required' });
  const id = uuidv4();
  const record = {
    id,
    mrn: body.mrn || `DEID-${id.slice(0, 4).toUpperCase()}`,
    name: body.name || `Subject ${id.slice(0, 4).toUpperCase()}`,
    age: Number(body.age) || null,
    sex: body.sex || 'U',
    diagnosis: body.diagnosis,
    stage: body.stage || null,
    ecogPerformance: body.ecogPerformance ?? null,
    dateOfDiagnosis: body.dateOfDiagnosis || null,
    lastVisit: new Date().toISOString().slice(0, 10),
    labs: body.labs || {},
    comorbidities: body.comorbidities || [],
    medications: body.medications || [],
    smokingHistory: body.smokingHistory || '',
    priorTherapies: body.priorTherapies || { pd1: [], checkpoint: [], parp: [], sorafenib: [], stemCell: [], other: [] },
    history: { malignancy: [] },
    evidence: body.evidence || {},
    notes: body.notes || [],
    adversarialFlags: [],
    createdAt: new Date().toISOString()
  };
  patients.push(record);
  res.status(201).json(record);
});

app.get('/api/trials', (req, res) => {
  const { indication, phase, status } = req.query;
  let data = trials;
  if (indication) data = data.filter(t => t.indication.toLowerCase().includes(String(indication).toLowerCase()));
  if (phase) data = data.filter(t => t.phase.toLowerCase() === String(phase).toLowerCase());
  if (status) data = data.filter(t => t.status.toLowerCase().includes(String(status).toLowerCase()));
  res.json({ count: data.length, data });
});

app.get('/api/trials/:id', (req, res) => {
  const t = findTrial(req.params.id);
  if (!t) return res.status(404).json({ error: `Trial ${req.params.id} not found` });
  res.json(t);
});

app.get('/api/trials/:id/patients', (req, res) => {
  const t = findTrial(req.params.id);
  if (!t) return res.status(404).json({ error: `Trial ${req.params.id} not found` });
  const ranked = patients
    .map(p => evaluateTrial(p, t))
    .sort((a, b) => b.score - a.score);
  res.json({ trialId: t.id, nctId: t.nctId, count: ranked.length, data: ranked });
});

app.post('/api/match', (req, res) => {
  const { patientId, trialId } = req.body || {};
  if (!patientId || !trialId) return res.status(400).json({ error: 'patientId and trialId are both required' });
  const p = findPatient(patientId), t = findTrial(trialId);
  if (!p) return res.status(404).json({ error: `Patient ${patientId} not found` });
  if (!t) return res.status(404).json({ error: `Trial ${trialId} not found` });
  res.json(evaluateTrial(p, t));
});

app.post('/api/match/rank', (req, res) => {
  const { patientId } = req.body || {};
  const p = findPatient(patientId);
  if (!p) return res.status(404).json({ error: `Patient ${patientId} not found` });
  const ranked = rankTrialsForPatient(p, trials);
  res.json({ patientId: p.id, mrn: p.mrn, patientName: p.name, count: ranked.length, data: ranked });
});

app.post('/api/criteria/:criterionId/explain', (req, res) => {
  const { patientId, trialId } = req.body || {};
  const p = findPatient(patientId), t = findTrial(trialId);
  if (!p) return res.status(404).json({ error: `Patient ${patientId} not found` });
  if (!t) return res.status(404).json({ error: `Trial ${trialId} not found` });
  const result = evaluateTrial(p, t);
  const target = [...result.inclusion, ...result.exclusion].find(c => c.id === req.params.criterionId);
  if (!target) return res.status(404).json({ error: `Criterion ${req.params.criterionId} not part of trial ${t.id}` });
  res.json({
    criterion: target,
    provenance: {
      patientField: target.field,
      trialField: target.field,
      trialId: t.id,
      nctId: t.nctId,
      protocolText: target.text,
      recordValue: target.actual,
      extractionMethod: target.field.startsWith('labs.') ? 'Structured lab component' : 'Structured demographic / history field',
      traceable: true
    }
  });
});

app.get('/api/evidence/:patientId/:trialId', (req, res) => {
  const p = findPatient(req.params.patientId), t = findTrial(req.params.trialId);
  if (!p) return res.status(404).json({ error: 'Patient not found' });
  if (!t) return res.status(404).json({ error: 'Trial not found' });
  const r = evaluateTrial(p, t);
  res.json({
    patientId: p.id, trialId: t.id,
    required: r.evidence.filter(e => e.status === 'missing'),
    stale: r.evidence.filter(e => e.status === 'stale'),
    satisfied: r.evidence.filter(e => e.status === 'present'),
    total: r.evidence.length
  });
});

app.get('/api/evaluation/metrics', (req, res) => res.json(computeMetrics()));
app.get('/api/evaluation/robustness', (req, res) => res.json(robustnessProfile()));
app.get('/api/evaluation/audit', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const entries = auditLog(limit);
  res.json({ count: entries.length, data: entries });
});

app.post('/api/evaluation/adjudicate', (req, res) => {
  const { patientId, trialId, decision, reviewer, rationale } = req.body || {};
  if (!patientId || !trialId || !decision) return res.status(400).json({ error: 'patientId, trialId and decision are required' });
  const p = findPatient(patientId), t = findTrial(trialId);
  if (!p) return res.status(404).json({ error: 'Patient not found' });
  if (!t) return res.status(404).json({ error: 'Trial not found' });
  res.status(201).json({
    auditId: `${p.id}:${t.id}:${Date.now()}`,
    patientId: p.id, trialId: t.id,
    engineStatus: evaluateTrial(p, t).status,
    humanDecision: decision,
    reviewer: reviewer || 'unassigned',
    rationale: rationale || '',
    signedAt: new Date().toISOString(),
    immutable: true
  });
});

app.get('/api/overview', (req, res) => {
  const all = [];
  for (const p of patients) for (const r of rankTrialsForPatient(p, trials)) all.push(r);
  const byStatus = {};
  for (const r of all) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  const flags = all.reduce((s, r) => s + r.adversarial.findings.length, 0);
  res.json({
    patients: patients.length,
    trials: trials.length,
    evaluations: all.length,
    byStatus,
    adversarialFindings: flags,
    evidenceGaps: all.reduce((s, r) => s + r.summary.blockingMissing, 0),
    indeterminateCriteria: all.reduce((s, r) => s + r.summary.inclusionIndeterminate, 0)
  });
});

app.use(notFound);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const BASE_PORT = Number(process.env.PORT) || 5000;

function listen(port, attemptsLeft = 8) {
  const server = app.listen(port, () => {
    console.log(`CTEM matching engine listening on :${port}`);
    console.log(`  health   http://localhost:${port}/api/health`);
    console.log(`  patients http://localhost:${port}/api/patients`);
    console.log(`  trials   http://localhost:${port}/api/trials`);
    console.log(`  metrics  http://localhost:${port}/api/evaluation/metrics`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      const next = port + 1;
      console.warn(`Port ${port} is busy — falling back to ${next}.`);
      listen(next, attemptsLeft - 1);
    } else {
      console.error(err);
      process.exit(1);
    }
  });

  const shutdown = () => {
    console.log('\nshutting down');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) {
  listen(BASE_PORT);
}

module.exports = app;
module.exports.listen = listen;