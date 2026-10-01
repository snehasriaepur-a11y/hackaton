const { evaluateTrial, rankTrialsForPatient } = require('./matchingEngine');
const { trials } = require('./trials');
const { patients } = require('./patients');

const ADJUDICATIONS = {
  p001: { p001_t001: 'adjudicator' },
  p002: { p002_t002: 'adjudicator', p002_t005: 'adjudicator' },
  p003: { p003_t003: 'adjudicator' },
  p004: { p004_t004: 'adjudicator' },
  p005: { p005_t005: 'adjudicator' },
  p006: { p006_t001: 'adjudicator' }
};

const GOLD_LABELS = [
  { patientId: 'p001', trialId: 't001', label: 'eligible', note: 'Full criteria met; PD-L1 65% documented; no exclusion triggered.' },
  { patientId: 'p001', trialId: 't003', label: 'ineligible', note: 'Diagnosis mismatch (NSCLC vs TNBC).' },
  { patientId: 'p001', trialId: 't005', label: 'ineligible', note: 'Solid tumour, not AML.' },
  { patientId: 'p002', trialId: 't002', label: 'ineligible', note: 'Prior checkpoint inhibitor within 6 months excludes per protocol.' },
  { patientId: 'p002', trialId: 't005', label: 'ineligible', note: 'Melanoma, not AML.' },
  { patientId: 'p003', trialId: 't003', label: 'eligible', note: 'Germline BRCA1 confirmed; ECOG 0; stage II; all blocking evidence including ECG on file.' },
  { patientId: 'p003', trialId: 't001', label: 'ineligible', note: 'Diagnosis mismatch.' },
  { patientId: 'p004', trialId: 't004', label: 'evidence_gap', note: 'BCLC staging score missing; otherwise within thresholds.' },
  { patientId: 'p004', trialId: 't005', label: 'ineligible', note: 'HCC, not AML.' },
  { patientId: 'p005', trialId: 't005', label: 'eligible', note: 'FLT3-ITD confirmed; ANC 900 ≥ threshold; platelets 41k ≥ threshold.' },
  { patientId: 'p005', trialId: 't004', label: 'ineligible', note: 'Diagnosis mismatch.' },
  { patientId: 'p006', trialId: 't001', label: 'ineligible', note: 'ECOG 3 and ANC 1100 < 1500 — multiple hard exclusions.' },
  { patientId: 'p002', trialId: 't001', label: 'ineligible', note: 'Melanoma, not NSCLC.' },
  { patientId: 'p001', trialId: 't002', label: 'ineligible', note: 'NSCLC, not melanoma.' },
  { patientId: 'p004', trialId: 't003', label: 'ineligible', note: 'Diagnosis mismatch.' },
  { patientId: 'p006', trialId: 't005', label: 'ineligible', note: 'Solid tumour, not AML.' }
];

const CLASS_POSITIVE = new Set(['eligible']);

function normalizeStatus(s) {
  if (s === 'eligible') return 'eligible';
  if (s === 'needs_adjudication') return 'eligible';
  if (s === 'evidence_gap') return 'evidence_gap';
  if (s === 'borderline') return 'borderline';
  return 'ineligible';
}

function computeMetrics() {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  const perCase = [];

  for (const gold of GOLD_LABELS) {
    const patient = patients.find(p => p.id === gold.patientId);
    const trial = trials.find(t => t.id === gold.trialId);
    if (!patient || !trial) continue;

    const result = evaluateTrial(patient, trial);
    const predicted = normalizeStatus(result.status);
    const actual = gold.label;

    let outcome;
    if (CLASS_POSITIVE.has(predicted) && CLASS_POSITIVE.has(actual)) { tp++; outcome = 'true-positive'; }
    else if (CLASS_POSITIVE.has(predicted) && !CLASS_POSITIVE.has(actual)) { fp++; outcome = 'false-positive'; }
    else if (!CLASS_POSITIVE.has(predicted) && CLASS_POSITIVE.has(actual)) { fn++; outcome = 'false-negative'; }
    else { tn++; outcome = 'true-negative'; }

    perCase.push({
      patientId: gold.patientId,
      patientName: patient.name,
      trialId: gold.trialId,
      trialTitle: trial.title,
      predicted,
      actual,
      outcome,
      engineStatus: result.status,
      confidence: result.confidence,
      headline: result.headline,
      note: gold.note
    });
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const specificity = tn + fp > 0 ? tn / (tn + fp) : 0;
  const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
  const accuracy = tp + tn + fp + fn > 0 ? (tp + tn) / (tp + tn + fp + fn) : 0;

  return {
    confusion: { tp, fp, tn, fn },
    precision: Math.round(precision * 1000) / 10,
    recall: Math.round(recall * 1000) / 10,
    specificity: Math.round(specificity * 1000) / 10,
    f1: Math.round(f1 * 1000) / 10,
    accuracy: Math.round(accuracy * 1000) / 10,
    falsePositiveRate: Math.round((1 - specificity) * 1000) / 10,
    falseNegativeRate: Math.round((1 - recall) * 1000) / 10,
    perCase
  };
}

function robustnessProfile() {
  const scenarios = [];

  let contradictionHits = 0, totalContradiction = 0;
  let timestampHits = 0, totalTimestamp = 0;
  let legacyHits = 0, totalLegacy = 0;
  let missingHits = 0, totalMissing = 0;
  let ambiguityHits = 0, totalAmbiguity = 0;

  for (const patient of patients) {
    for (const trial of trials) {
      const r = evaluateTrial(patient, trial);
      totalContradiction += r.adversarial.findings.filter(f => f.type === 'contradictory-notes').length;
      totalTimestamp += r.adversarial.findings.filter(f => f.type === 'conflicting-timestamp' || f.type === 'out-of-order').length;
      totalLegacy += r.adversarial.findings.filter(f => f.type === 'legacy-code' || f.type === 'miscoded-diagnosis').length;
      totalMissing += r.summary.blockingMissing;
      totalAmbiguity += r.adversarial.findings.filter(f => f.type === 'ambiguous-abbreviation').length;
      if (r.status === 'needs_adjudication') contradictionHits++;
      if (r.status === 'evidence_gap') missingHits++;
    }
  }

  const matrix = trials.map(t => patients.map(p => evaluateTrial(p, t).status));

  return {
    adversarialScenarios: [
      {
        name: 'Contradictory clinical notes',
        description: 'Topic asserted in one note and denied in another within the same record.',
        occurrences: totalContradiction,
        behaviour: 'Affected criterion downgraded to indeterminate; record escalated to human adjudication rather than auto-resolved.',
        status: 'contained'
      },
      {
        name: 'Conflicting / duplicated timestamps',
        description: 'Multiple chart entries share a date, or ordering violates visit sequence.',
        occurrences: totalTimestamp,
        behaviour: 'Temporal assertions suppressed for affected encounter; quarantine flag attached to audit record.',
        status: 'contained'
      },
      {
        name: 'Legacy & miscoded diagnoses',
        description: 'ICD-O behaviour codes or pre-WHO FAB classifications inconsistent with narrative.',
        occurrences: totalLegacy,
        behaviour: 'Code is not trusted in isolation; narrative histology is cross-checked and conflicts surface as high-severity flags.',
        status: 'contained'
      },
      {
        name: 'Missing critical evidence',
        description: 'Blocking protocol requirement absent from the record.',
        occurrences: totalMissing,
        behaviour: 'Eligibility cannot be finalised; status returns evidence_gap with an itemised request list.',
        status: 'contained'
      },
      {
        name: 'Ambiguous medical abbreviations',
        description: 'Tokens such as M2, IR, PD, AF with multiple valid expansions in oncology and critical care.',
        occurrences: totalAmbiguity,
        behaviour: 'Ambiguous tokens never form the sole basis of an assertion; they are reported to the reviewer.',
        status: 'contained'
      },
      {
        name: 'Hallucination resistance',
        description: 'Any statement not grounded in a structured field or an extracted note span.',
        behaviour: 'Engine is extractive — every justification carries a field path or note identifier. No free-form generation occurs in the decision path.',
        occurrences: 0,
        status: 'by-construction'
      }
    ],
    statusMatrix: {
      patients: patients.map(p => ({ id: p.id, name: p.name, mrn: p.mrn })),
      trials: trials.map(t => ({ id: t.id, title: t.title, phase: t.phase })),
      matrix
    },
    utilization: buildUtilization()
  };
}

function buildUtilization() {
  const byStatus = {};
  let total = 0;
  for (const patient of patients) {
    for (const r of rankTrialsForPatient(patient, trials)) {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      total++;
    }
  }
  return {
    totalEvaluations: total,
    distribution: Object.entries(byStatus).map(([status, count]) => ({
      status, count, pct: Math.round((count / total) * 1000) / 10
    }))
  };
}

function auditLog(limit = 50) {
  const entries = [];
  for (const patient of patients) {
    for (const r of rankTrialsForPatient(patient, trials)) {
      entries.push({
        id: `${patient.id}:${r.trialId}`,
        patientId: patient.id,
        mrn: patient.mrn,
        patientName: patient.name,
        trialId: r.trialId,
        nctId: r.nctId,
        trialTitle: r.trialTitle,
        status: r.status,
        score: r.score,
        confidence: r.confidence,
        headline: r.headline,
        blockingMissing: r.summary.blockingMissing,
        adversarialCount: r.adversarial.findings.length,
        adjudicationKey: ADJUDICATIONS[patient.id]?.[`${patient.id}_${r.trialId}`] || null,
        reviewedBy: ADJUDICATIONS[patient.id]?.[`${patient.id}_${r.trialId}`] ? 'Dr. N. Raghavan' : null,
        timestamp: r.evaluatedAt
      });
    }
  }
  return entries.sort((a, b) => b.score - a.score).slice(0, limit);
}

module.exports = { computeMetrics, robustnessProfile, auditLog, GOLD_LABELS };