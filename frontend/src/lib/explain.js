export function toPlain(term) {
  const map = {
    'inclusion': 'Requirements the patient must meet',
    'exclusion': 'Reasons that would disqualify the patient',
    'eligible': 'Meets all required criteria',
    'ineligible': 'Does not meet eligibility requirements',
    'evidence_gap': 'Missing required documentation',
    'borderline': 'Partially meets requirements — review needed',
    'needs_adjudication': 'Record needs manual review for accuracy',
    'indeterminate': 'Not enough information to decide',
    'passed': 'Met',
    'failed': 'Not met',
    'excluded': 'Triggered (disqualifies)',
    'evidence': 'Supporting documents or test results',
    'blocking': 'Must be provided before deciding eligibility',
    'stale': 'Outdated — older than the allowed time window',
    'missing': 'Not present in the record',
    'present': 'On file',
    'weighted inclusion': 'Overall match score (how many required points met)',
    'record-integrity finding': 'Possible data quality issue',
    'provenance': 'Why this decision was made',
    'criterion-level trace': 'Step-by-step explanation for each rule',
    'adversarial': 'Data quality or consistency checks',
    'ECOG': 'General level of daily activity',
    'ULN': 'Upper limit of normal (lab reference range)',
    'ANC': 'Absolute neutrophil count (infection-fighting cells)',
    'WBC': 'White blood cell count',
    'AST/ALT': 'Liver enzyme tests',
    'Bilirubin': 'Liver waste product',
    'Creatinine': 'Kidney function marker',
    'LDH': 'Cell damage marker',
    'PD-L1': 'Protein test that helps predict treatment response',
    'TPS': 'PD-L1 test score (0–100%)',
    'EGFR/ALK/ROS1': 'Cancer gene mutations',
    'BRAF': 'Cancer gene mutation',
    'LI-RADS': 'Standard way to describe liver scans',
    'BCLC': 'Liver cancer staging system',
    'Child-Pugh': 'Liver function score',
    'RECIST': 'Standard way to measure tumor change on scans'
  };
  const t = String(term || '').replace(/-/g, ' ');
  return map[t] || map[t.toLowerCase()] || t;
}

export function explainVerdict(r) {
  if (!r) return '';
  if (r.status === 'eligible') return 'This patient meets all required criteria for this trial.';
  if (r.status === 'ineligible') return 'This patient does not meet the trial requirements.';
  if (r.status === 'evidence_gap') return 'Some required documents are missing, so eligibility cannot be decided yet.';
  if (r.status === 'borderline') return 'Most requirements are met, but a few need review.';
  if (r.status === 'needs_adjudication') return 'Data looks eligible, but there are consistency issues that a human should verify.';
  return 'Eligibility is not clear from the current information.';
}

export function humanizeList(items) {
  if (!items?.length) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}
