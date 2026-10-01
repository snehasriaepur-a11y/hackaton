const { parsePatientRecord } = require('./nlp');

const LAB_LABELS = {
  hemoglobine: 'Hemoglobin (g/dL)',
  wbc: 'WBC (K/µL)',
  platelets: 'Platelets (/mm³)',
  neutrophils: 'ANC (/mm³)',
  creatinine: 'Creatinine (mg/dL)',
  alt: 'ALT (U/L)',
  ast: 'AST (U/L)',
  bilirubin: 'Total Bilirubin (mg/dL)',
  ldh: 'LDH (U/L)',
  afp: 'AFP (ng/mL)'
};

const FIELD_LABELS = {
  diagnosis: 'Primary Diagnosis',
  stage: 'Disease Stage',
  ecogPerformance: 'ECOG Performance Status',
  age: 'Age',
  comorbidities: 'Comorbidities',
  medications: 'Medications',
  smokingHistory: 'Smoking History',
  dateOfDiagnosis: 'Date of Diagnosis',
  'priorTherapies.pd1': 'Prior Anti-PD-1/PD-L1/CTLA-4 Therapy',
  'priorTherapies.checkpoint': 'Prior Checkpoint Inhibitor Exposure',
  'priorTherapies.parp': 'Prior PARP Inhibitor Therapy',
  'priorTherapies.sorafenib': 'Prior Sorafenib / TKI Exposure',
  'priorTherapies.stemCell': 'Prior Stem Cell Transplant',
  'history.malignancy': 'Other Malignancy History',
  'labs.astUl': 'AST (× upper limit of normal)',
  'labs.altUl': 'ALT (× upper limit of normal)',
  'labs.bilirubinUl': 'Bilirubin (× upper limit of normal)',
  'molecular.brca': 'Germline BRCA1/2 Result',
  'molecular.brcaGermline': 'Germline BRCA1/2 Result',
  'molecular.flt3': 'FLT3 Mutation Status',
  'molecular.braf': 'BRAF Mutation Status',
  'molecular.pdL1': 'PD-L1 Expression',
  'molecular.egfrAlk': 'EGFR / ALK Genotyping',
  'molecular.nrf2': 'NRF2 Genotyping'
};

function getFieldLabel(field) {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  if (LAB_LABELS[field]) return LAB_LABELS[field];
  if (field.startsWith('labs.')) return LAB_LABELS[field.replace('labs.', '')] || field;
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
}

const ULN_REFERENCE = { ast: 40, alt: 40, bilirubin: 1.2 };

function withDerivedLabs(patient) {
  if (!patient.labs) return patient;
  const derived = { ...patient.labs };
  for (const [key, uln] of Object.entries(ULN_REFERENCE)) {
    const raw = patient.labs[key];
    if (raw !== undefined && raw !== null && !isNaN(raw)) {
      derived[`${key}Ul`] = Math.round((raw / uln) * 100) / 100;
    }
  }
  return { ...patient, labs: derived };
}

function resolveField(patient, field) {
  if (field.startsWith('labs.')) {
    const key = field.replace('labs.', '');
    const val = patient.labs?.[key];
    return val === undefined || val === null ? undefined : val;
  }
  if (field.startsWith('priorTherapies.')) {
    const key = field.replace('priorTherapies.', '');
    return expandTherapyClasses(patient.priorTherapies?.[key] || []);
  }
  if (field.startsWith('history.')) {
    const key = field.replace('history.', '');
    return patient.history?.[key] || [];
  }
  if (field.startsWith('molecular.')) {
    const key = field.replace('molecular.', '');
    const resolvedKey = EVIDENCE_KEY_ALIASES[field] || `molecular.${key}`;
    const record = patient.evidence?.[resolvedKey];
    if (!record || !record.present) return undefined;
    return [record.result || 'documented'];
  }
  return patient[field];
}

function toArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function compareNumeric(actual, operator, expected) {
  const a = parseFloat(actual);
  const e = parseFloat(expected);
  if (isNaN(a) || isNaN(e)) return null;

  let passed, comparison;
  switch (operator) {
    case '>=': passed = a >= e; comparison = `${a} ≥ ${e}`; break;
    case '<=': passed = a <= e; comparison = `${a} ≤ ${e}`; break;
    case '>': passed = a > e; comparison = `${a} > ${e}`; break;
    case '<': passed = a < e; comparison = `${a} < ${e}`; break;
    case '==': passed = a === e; comparison = `${a} = ${e}`; break;
    case '!=': passed = a !== e; comparison = `${a} ≠ ${e}`; break;
    case 'between': {
      const [lo, hi] = expected;
      passed = a >= parseFloat(lo) && a <= parseFloat(hi);
      comparison = `${a} within [${lo}, ${hi}]`;
      break;
    }
    default:
      return null;
  }
  return { passed, comparison };
}

const NEGATION_PREFIXES = ['non-', 'non ', 'no ', 'un-', 'absence of ', 'absence of ', 'without ', 'not ', 'never '];

function phraseMatch(haystack, needle) {
  const h = String(haystack).toLowerCase();
  const n = String(needle).toLowerCase().trim();
  if (!n) return false;

  let idx = h.indexOf(n);
  while (idx !== -1) {
    const before = idx > 0 ? h.slice(Math.max(0, idx - 12), idx) : '';
    const negated = NEGATION_PREFIXES.some(p => before.trimEnd().endsWith(p.replace(/\s+$/, '')) || before.endsWith(p.trim()));
    if (!negated) return true;
    idx = h.indexOf(n, idx + 1);
  }
  return false;
}

function compareSet(actual, operator, expected) {
  const actualArr = toArray(actual).map(v => String(v).toLowerCase());
  const expectedArr = toArray(expected);

  if (operator === 'includes') {
    const hit = expectedArr.some(e => actualArr.some(a => phraseMatch(a, e)));
    return { passed: hit, detail: hit ? `documented: ${expectedArr.join(', ')}` : `not documented: ${expectedArr.join(', ')}` };
  }
  if (operator === 'not includes' || operator === 'notIncludes') {
    const hit = expectedArr.some(e => actualArr.some(a => phraseMatch(a, e)));
    return { passed: !hit, detail: hit ? `documented (excludes): ${expectedArr.join(', ')}` : `not documented (excludes)` };
  }
  if (operator === 'includesAny') {
    const hits = expectedArr.filter(e => actualArr.some(a => phraseMatch(a, e)));
    return { passed: hits.length > 0, detail: hits.length ? `matched: ${hits.join(', ')}` : `none of [${expectedArr.join(', ')}]` };
  }
  if (operator === 'in') {
    const expectedLower = expectedArr.map(e => String(e).toLowerCase());
    const hit = actualArr.some(a => expectedLower.some(e => phraseMatch(a, e) || phraseMatch(e, a)));
    return { passed: hit, detail: hit ? `matched allowed set [${expectedArr.join(', ')}]` : `"${actualArr.join(', ')}" not in [${expectedArr.join(', ')}]` };
  }
  if (operator === 'notBlank') {
    const hasContent = actualArr.length > 0 && actualArr.some(a => a && a.trim() && a !== 'null' && a !== 'undefined');
    return { passed: hasContent, detail: hasContent ? 'result documented' : 'result absent from record' };
  }
  return null;
}

const EVIDENCE_KEY_ALIASES = {
  'molecular.brca': 'molecular.brcaGermline',
  'molecular.brcaGermline': 'molecular.brcaGermline',
  'molecular.flt3': 'molecular.flt3',
  'molecular.braf': 'molecular.braf',
  'molecular.pdL1': 'molecular.pdL1',
  'molecular.nrf2': 'molecular.nrf2',
  'molecular.egfrAlk': 'molecular.egfrAlk'
};

const THERAPY_CLASSES = {
  pembrolizumab: 'Checkpoint Inhibitor', 'pembrolizumab': 'Checkpoint Inhibitor',
  nivolumab: 'Checkpoint Inhibitor', ipilimumab: 'Checkpoint Inhibitor',
  atezolizumab: 'Checkpoint Inhibitor', durvalumab: 'Checkpoint Inhibitor',
  'cemiplimab': 'Checkpoint Inhibitor',
  olaparib: 'PARP Inhibitor', rucaparib: 'PARP Inhibitor',
  talazoparib: 'PARP Inhibitor', niraparib: 'PARP Inhibitor',
  sorafenib: 'Tyrosine Kinase Inhibitor', lenvatinib: 'Tyrosine Kinase Inhibitor',
  regorafenib: 'Tyrosine Kinase Inhibitor',
  'stem cell transplant': 'Stem Cell Transplant',
  'allogeneic transplant': 'Stem Cell Transplant',
  'allogeneic hsct': 'Stem Cell Transplant',
  'anti-pd-1': 'Anti-PD-1/PD-L1/CTLA-4 Therapy',
  'anti-pd-l1': 'Anti-PD-1/PD-L1/CTLA-4 Therapy'
};

function expandTherapyClasses(entries) {
  const out = [];
  for (const entry of toArray(entries)) {
    const text = String(entry);
    out.push(text);
    for (const [drug, cls] of Object.entries(THERAPY_CLASSES)) {
      if (text.toLowerCase().includes(drug)) out.push(cls);
    }
  }
  return [...new Set(out)];
}

function fieldPresentInRecord(patient, field) {
  if (field.startsWith('labs.')) return patient.labs?.[field.replace('labs.', '')] !== undefined;
  if (field.startsWith('priorTherapies.')) return Array.isArray(patient.priorTherapies?.[field.replace('priorTherapies.', '')]);
  if (field.startsWith('history.')) return Array.isArray(patient.history?.[field.replace('history.', '')]);
  if (field.startsWith('molecular.')) {
    const key = field.replace('molecular.', '');
    const resolvedKey = EVIDENCE_KEY_ALIASES[field] || `molecular.${key}`;
    return patient.evidence?.[resolvedKey]?.present === true;
  }
  return patient[field] !== undefined && patient[field] !== null;
}

function evaluateCriterion(patient, criterion, kind) {
  const actual = resolveField(patient, criterion.field);
  const isNumericField = criterion.field.startsWith('labs.') || ['age', 'ecogPerformance', 'dateOfDiagnosis'].includes(criterion.field);

  let outcome = null;
  if (isNumericField && !Array.isArray(criterion.value) && criterion.value !== null) {
    outcome = compareNumeric(actual, criterion.operator, criterion.value);
  } else if (Array.isArray(criterion.value) && criterion.operator === 'between') {
    outcome = compareNumeric(actual, 'between', criterion.value);
  } else {
    outcome = compareSet(actual, criterion.operator, criterion.value);
  }

  const present = fieldPresentInRecord(patient, criterion.field);
  const isEmptyList = Array.isArray(actual) && actual.length === 0;

  if (!present) {
    return {
      id: criterion.id,
      kind,
      field: criterion.field,
      fieldLabel: getFieldLabel(criterion.field),
      operator: criterion.operator,
      expected: criterion.value,
      actual: null,
      status: 'indeterminate',
      weight: criterion.weight,
      text: criterion.text,
      evidence: 'Field not present in the de-identified record — cannot be asserted either way.'
    };
  }

  if (!outcome) {
    return {
      id: criterion.id, kind, field: criterion.field, fieldLabel: getFieldLabel(criterion.field),
      operator: criterion.operator, expected: criterion.value, actual,
      status: 'indeterminate', weight: criterion.weight, text: criterion.text,
      evidence: 'Operator could not be evaluated for this field type.'
    };
  }

  if (kind === 'exclusion') {
    const triggered = outcome.passed;
    return {
      id: criterion.id, kind, field: criterion.field, fieldLabel: getFieldLabel(criterion.field),
      operator: criterion.operator, expected: criterion.value, actual,
      status: triggered ? 'excluded' : 'passed',
      triggered,
      weight: criterion.weight, text: criterion.text,
      evidence: triggered ? `Exclusion triggered — ${outcome.detail ?? outcome.comparison}` : `Exclusion not met — ${outcome.detail ?? outcome.comparison}`,
      comparison: outcome.comparison || outcome.detail
    };
  }

  const status = isEmptyList && ['includes', 'includesAny', 'in'].includes(criterion.operator) ? 'passed' : (outcome.passed ? 'passed' : 'failed');
  const evidence = isEmptyList && ['includes', 'includesAny', 'in'].includes(criterion.operator)
    ? 'documented as explicitly absent'
    : (outcome.comparison || outcome.detail);

  return {
    id: criterion.id, kind, field: criterion.field, fieldLabel: getFieldLabel(criterion.field),
    operator: criterion.operator, expected: criterion.value, actual,
    status, weight: criterion.weight, text: criterion.text,
    evidence,
    comparison: outcome.comparison
  };
}

function evaluateEvidence(patient, trial) {
  const results = [];
  const windowDays = trial.evidenceWindowDays || 90;
  const lastVisit = patient.lastVisit ? new Date(patient.lastVisit) : new Date();

  for (const item of trial.requiredEvidence) {
    const record = patient.evidence?.[item.key];
    if (!record || !record.present) {
      results.push({
        key: item.key, label: item.label, category: item.category, blocking: item.blocking,
        status: 'missing',
        message: `${item.label} is required by protocol and is absent from the record.`
      });
    } else {
      const obsDate = record.date ? new Date(record.date) : null;
      const ageDays = obsDate ? Math.round((lastVisit - obsDate) / 86400000) : null;
      const stale = ageDays !== null && ageDays > windowDays;
      results.push({
        key: item.key, label: item.label, category: item.category, blocking: item.blocking,
        status: stale ? 'stale' : 'present',
        observedAt: record.date,
        ageDays,
        windowDays,
        result: record.result || null,
        message: stale
          ? `${item.label} is ${ageDays} days old — outside the ${windowDays}-day protocol window.`
          : `${item.label} present${record.result ? `: ${record.result}` : '.'}`
      });
    }
  }
  return results;
}

function assessAdversarial(patient, parsed) {
  const findings = [];

  for (const amb of parsed.ambiguities) {
    findings.push({
      type: 'ambiguous-abbreviation',
      severity: amb.severity,
      subject: amb.abbreviation,
      detail: amb.ambiguousMeaning,
      mitigation: 'Ambiguous tokens are excluded from automated assertion and surfaced for manual review.'
    });
  }

  for (const anom of parsed.temporalAnomalies) {
    findings.push({
      type: anom.type, severity: anom.severity, subject: anom.date || anom.noteIds.join(' vs '),
      detail: anom.message,
      mitigation: 'Records failing temporal integrity checks are quarantined from temporal assertions.'
    });
  }

  for (const con of parsed.contradictions) {
    findings.push({
      type: 'contradictory-notes', severity: con.severity, subject: con.topic,
      detail: con.message,
      mitigation: 'Conflicting assertions downgrade the affected criterion to indeterminate rather than guessing.'
    });
  }

  for (const disc of parsed.labDiscrepancies) {
    findings.push({
      type: 'source-discrepancy', severity: disc.severity, subject: disc.field,
      detail: disc.message,
      mitigation: 'Structured EHR values take precedence; divergent free-text values are retained for audit.'
    });
  }

  for (const flag of patient.adversarialFlags || []) {
    if (!findings.some(f => f.type === flag)) {
      const descriptions = {
        'miscoded-diagnosis': { severity: 'high', detail: 'Diagnosis code disagrees with narrative histology (ICD-O behavior code mismatch).' },
        'legacy-code': { severity: 'medium', detail: 'Record uses a legacy classification scheme not mapped to current WHO/ICC codes.' },
        'conflicting-timestamp': { severity: 'high', detail: 'Chart entries contain conflicting or duplicate dates for a single encounter.' }
      };
      const d = descriptions[flag] || { severity: 'medium', detail: 'Record flagged during upstream de-identification QA.' };
      findings.push({ type: flag, severity: d.severity, subject: 'patient record', detail: d.detail, mitigation: 'Affected criteria degrade to indeterminate pending coordinator adjudication.' });
    }
  }

  const hasBlocking = findings.some(f => f.severity === 'high');
  return { findings, requiresAdjudication: hasBlocking };
}

function evaluateTrial(patient, trial) {
  const enriched = withDerivedLabs(patient);
  const parsed = parsePatientRecord(enriched);
  const adversarial = assessAdversarial(enriched, parsed);

  const inclusion = trial.inclusionCriteria.map(c => evaluateCriterion(enriched, c, 'inclusion'));
  const exclusion = trial.exclusionCriteria.map(c => evaluateCriterion(enriched, c, 'exclusion'));
  const evidence = evaluateEvidence(enriched, trial);

  const inclusionPassed = inclusion.filter(c => c.status === 'passed');
  const inclusionFailed = inclusion.filter(c => c.status === 'failed');
  const inclusionIndeterminate = inclusion.filter(c => c.status === 'indeterminate');
  const exclusionTriggered = exclusion.filter(c => c.status === 'excluded');

  const totalInclusionWeight = inclusion.reduce((s, c) => s + (c.weight || 1), 0);
  const earnedInclusionWeight = inclusionPassed.reduce((s, c) => s + (c.weight || 1), 0);
  const weightedInclusionRate = totalInclusionWeight > 0 ? earnedInclusionWeight / totalInclusionWeight : 0;

  const missingEvidence = evidence.filter(e => e.status === 'missing');
  const staleEvidence = evidence.filter(e => e.status === 'stale');
  const missingBlocking = missingEvidence.filter(e => e.blocking);

  const excluded = exclusionTriggered.length > 0;
  const hardFailures = inclusionFailed.filter(c => (c.weight || 1) >= 0.9);
  const sufficientInclusion = weightedInclusionRate >= 0.85;
  const allInclusionResolved = inclusionIndeterminate.length === 0;

  let status, headline, confidence;

  if (excluded) {
    status = 'ineligible';
    headline = `Disqualified by ${exclusionTriggered.length} exclusion criteri${exclusionTriggered.length === 1 ? 'a' : 'a'}: ${exclusionTriggered.map(e => e.fieldLabel).join(', ')}.`;
    confidence = 'high';
  } else if (hardFailures.length > 0) {
    status = 'ineligible';
    headline = `Fails protocol-defining criteri${hardFailures.length === 1 ? 'a' : 'a'} (${hardFailures.map(e => e.fieldLabel).join(', ')}). No further workup is indicated.`;
    confidence = 'high';
  } else if (missingBlocking.length > 0) {
    status = 'evidence_gap';
    headline = `Provisional — ${missingBlocking.length} blocking requirement${missingBlocking.length === 1 ? '' : 's'} outstanding. Eligibility cannot be finalized until resolved.`;
    confidence = 'low';
  } else if (sufficientInclusion && allInclusionResolved) {
    status = 'eligible';
    headline = `All ${inclusion.length} inclusion criteria satisfied with no exclusion triggered and every blocking requirement on file.`;
    confidence = 'high';
  } else if (weightedInclusionRate >= 0.5) {
    status = 'borderline';
    headline = `Meets ${earnedInclusionWeight.toFixed(1)} of ${totalInclusionWeight.toFixed(1)} weighted inclusion points. ${inclusionIndeterminate.length} criteri${inclusionIndeterminate.length === 1 ? 'a' : 'a'} unresolved — coordinator review advised.`;
    confidence = 'moderate';
  } else {
    status = 'ineligible';
    headline = `Falls short of inclusion threshold (${Math.round(weightedInclusionRate * 100)}% weighted, 85% required).`;
    confidence = 'high';
  }

  const adjudicationFlags = adversarial.findings.filter(f => ['contradictory-notes', 'source-discrepancy', 'miscoded-diagnosis', 'conflicting-timestamp'].includes(f.type));

  if (adjudicationFlags.length && status === 'eligible') {
    status = 'needs_adjudication';
    headline += ` ${adjudicationFlags.length} record-integrity flag${adjudicationFlags.length === 1 ? '' : 's'} require human sign-off before enrollment.`;
    confidence = 'moderate';
  }

  const score = Math.round(weightedInclusionRate * 100);

  return {
    patientId: patient.id,
    mrn: patient.mrn,
    patientName: patient.name,
    trialId: trial.id,
    nctId: trial.nctId,
    trialTitle: trial.title,
    trialPhase: trial.phase,
    status,
    headline,
    confidence,
    score,
    weightedInclusionRate: Math.round(weightedInclusionRate * 1000) / 1000,
    summary: {
      inclusionTotal: inclusion.length,
      inclusionPassed: inclusionPassed.length,
      inclusionFailed: inclusionFailed.length,
      inclusionIndeterminate: inclusionIndeterminate.length,
      exclusionTotal: exclusion.length,
      exclusionTriggered: exclusionTriggered.length,
      evidenceTotal: evidence.length,
      evidencePresent: evidence.filter(e => e.status === 'present').length,
      evidenceMissing: missingEvidence.length,
      evidenceStale: staleEvidence.length,
      blockingMissing: missingBlocking.length
    },
    inclusion,
    exclusion,
    evidence,
    adversarial,
    parsedRecord: {
      noteCount: parsed.noteCount,
      noteOnlyLabs: Object.keys(parsed.noteOnlyLabs),
      labDiscrepancies: parsed.labDiscrepancies.length
    },
    evaluatedAt: new Date().toISOString()
  };
}

function rankTrialsForPatient(patient, trials) {
  return trials
    .map(t => evaluateTrial(patient, t))
    .sort((a, b) => {
      const order = { eligible: 5, needs_adjudication: 4, evidence_gap: 3, borderline: 2, ineligible: 1 };
      const diff = order[b.status] - order[a.status];
      return diff !== 0 ? diff : b.score - a.score;
    });
}

module.exports = { evaluateTrial, rankTrialsForPatient, evaluateCriterion, resolveField, getFieldLabel, LAB_LABELS, FIELD_LABELS };