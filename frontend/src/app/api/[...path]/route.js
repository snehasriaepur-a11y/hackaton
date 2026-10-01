import { randomUUID } from 'crypto';
import engine from '../../../lib/ctem';

const {
  patients,
  trials,
  evaluateTrial,
  rankTrialsForPatient,
  parsePatientRecord,
  computeMetrics,
  robustnessProfile,
  auditLog,
  LAB_LABELS,
  FIELD_LABELS
} = engine;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });

const fail = (message, status = 400) => json({ error: message }, status);

const findPatient = (id) => patients.find((p) => p.id === id || p.mrn === id);
const findTrial = (id) => trials.find((t) => t.id === id || t.nctId === id);

function seedPatient(body) {
  const id = randomUUID();
  return {
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
}

function buildRecord(patient) {
  const parsed = parsePatientRecord(patient);
  return {
    ...patient,
    parse: {
      noteCount: parsed.noteCount,
      ambiguities: parsed.ambiguities,
      temporalAnomalies: parsed.temporalAnomalies,
      contradictions: parsed.contradictions,
      labDiscrepancies: parsed.labDiscrepancies
    }
  };
}

function handleGet(segments, url) {
  const [head, a, b, c] = segments;

  if (head === 'health') {
    return json({
      status: 'ok',
      service: 'ctem-matching-engine',
      version: '1.0.0',
      runtime: 'next-route-handler',
      uptime: Math.round(process.uptime()),
      patients: patients.length,
      trials: trials.length
    });
  }

  if (head === 'vocabulary') return json({ labs: LAB_LABELS, fields: FIELD_LABELS });

  if (head === 'patients') {
    if (!a) return json({ count: patients.length, data: patients });
    const p = findPatient(a);
    if (!p) return fail(`Patient ${a} not found`, 404);
    return json(buildRecord(p));
  }

  if (head === 'trials') {
    if (!a) {
      const indication = url.searchParams.get('indication');
      const phase = url.searchParams.get('phase');
      let data = trials;
      if (indication) data = data.filter((t) => t.indication.toLowerCase().includes(indication.toLowerCase()));
      if (phase) data = data.filter((t) => t.phase.toLowerCase() === phase.toLowerCase());
      return json({ count: data.length, data });
    }
    const t = findTrial(a);
    if (!t) return fail(`Trial ${a} not found`, 404);
    if (b === 'patients') {
      const ranked = patients.map((p) => evaluateTrial(p, t)).sort((x, y) => y.score - x.score);
      return json({ trialId: t.id, nctId: t.nctId, count: ranked.length, data: ranked });
    }
    return json(t);
  }

  if (head === 'evidence' && a && b) {
    const p = findPatient(a);
    const t = findTrial(b);
    if (!p) return fail('Patient not found', 404);
    if (!t) return fail('Trial not found', 404);
    const r = evaluateTrial(p, t);
    return json({
      patientId: p.id,
      trialId: t.id,
      required: r.evidence.filter((e) => e.status === 'missing'),
      stale: r.evidence.filter((e) => e.status === 'stale'),
      satisfied: r.evidence.filter((e) => e.status === 'present'),
      total: r.evidence.length
    });
  }

  if (head === 'evaluation') {
    if (a === 'metrics') return json(computeMetrics());
    if (a === 'robustness') return json(robustnessProfile());
    if (a === 'audit') {
      const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
      const data = auditLog(limit);
      return json({ count: data.length, data });
    }
  }

  if (head === 'overview') {
    const all = [];
    for (const p of patients) all.push(...rankTrialsForPatient(p, trials));
    const byStatus = {};
    for (const r of all) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    return json({
      patients: patients.length,
      trials: trials.length,
      evaluations: all.length,
      byStatus,
      adversarialFindings: all.reduce((s, r) => s + r.adversarial.findings.length, 0),
      evidenceGaps: all.reduce((s, r) => s + r.summary.blockingMissing, 0),
      indeterminateCriteria: all.reduce((s, r) => s + r.summary.inclusionIndeterminate, 0)
    });
  }

  if (!head) {
    return json({
      service: 'ctem-matching-engine',
      routes: [
        'GET /api/health', 'GET /api/vocabulary', 'GET /api/patients', 'GET /api/patients/:id',
        'POST /api/patients', 'GET /api/trials', 'GET /api/trials/:id', 'GET /api/trials/:id/patients',
        'POST /api/match', 'POST /api/match/rank', 'POST /api/criteria/:criterionId/explain',
        'GET /api/evidence/:patientId/:trialId', 'GET /api/overview',
        'GET /api/evaluation/metrics', 'GET /api/evaluation/robustness', 'GET /api/evaluation/audit',
        'POST /api/evaluation/adjudicate'
      ]
    });
  }

  return fail(`No route for GET /api/${segments.join('/')}`, 404);
}

async function handlePost(segments, req) {
  const body = await req.json().catch(() => ({}));
  const [head, a, b] = segments;

  if (head === 'patients') {
    if (!body.diagnosis) return fail('diagnosis is required');
    const record = seedPatient(body);
    patients.push(record);
    return json(record, 201);
  }

  if (head === 'match') {
    if (a === 'rank') {
      const p = findPatient(body.patientId);
      if (!p) return fail(`Patient ${body.patientId} not found`, 404);
      const data = rankTrialsForPatient(p, trials);
      return json({ patientId: p.id, mrn: p.mrn, patientName: p.name, count: data.length, data });
    }
    const { patientId, trialId } = body;
    if (!patientId || !trialId) return fail('patientId and trialId are both required');
    const p = findPatient(patientId);
    const t = findTrial(trialId);
    if (!p) return fail(`Patient ${patientId} not found`, 404);
    if (!t) return fail(`Trial ${trialId} not found`, 404);
    return json(evaluateTrial(p, t));
  }

  if (head === 'criteria' && a === 'explain') {
    const p = findPatient(body.patientId);
    const t = findTrial(body.trialId);
    if (!p) return fail(`Patient ${body.patientId} not found`, 404);
    if (!t) return fail(`Trial ${body.trialId} not found`, 404);
    const result = evaluateTrial(p, t);
    const target = [...result.inclusion, ...result.exclusion].find((x) => x.id === b);
    if (!target) return fail(`Criterion ${b} not part of trial ${t.id}`, 404);
    return json({
      criterion: target,
      provenance: {
        patientField: target.field,
        trialField: target.field,
        trialId: t.id,
        nctId: t.nctId,
        protocolText: target.text,
        recordValue: target.actual,
        extractionMethod: target.field.startsWith('labs.')
          ? 'Structured lab component'
          : 'Structured demographic / history field',
        traceable: true
      }
    });
  }

  if (head === 'evaluation' && a === 'adjudicate') {
    const { patientId, trialId, decision, reviewer, rationale } = body;
    if (!patientId || !trialId || !decision) return fail('patientId, trialId and decision are required');
    const p = findPatient(patientId);
    const t = findTrial(trialId);
    if (!p) return fail('Patient not found', 404);
    if (!t) return fail('Trial not found', 404);
    return json(
      {
        auditId: `${p.id}:${t.id}:${Date.now()}`,
        patientId: p.id,
        trialId: t.id,
        engineStatus: evaluateTrial(p, t).status,
        humanDecision: decision,
        reviewer: reviewer || 'unassigned',
        rationale: rationale || '',
        signedAt: new Date().toISOString(),
        immutable: true
      },
      201
    );
  }

  return fail(`No route for POST /api/${segments.join('/')}`, 404);
}

export async function GET(_req, { params }) {
  return handleGet(params.path || [], new URL(_req.url));
}

export async function POST(req, { params }) {
  return handlePost(params.path || [], req);
}
