export const STATUS_META = {
  eligible: { label: 'Eligible', chip: 'chip-eligible', cell: 'sc-eligible' },
  ineligible: { label: 'Ineligible', chip: 'chip-ineligible', cell: 'sc-ineligible' },
  evidence_gap: { label: 'Evidence Gap', chip: 'chip-evidence_gap', cell: 'sc-evidence_gap' },
  borderline: { label: 'Borderline', chip: 'chip-borderline', cell: 'sc-borderline' },
  needs_adjudication: { label: 'Adjudication', chip: 'chip-needs_adjudication', cell: 'sc-needs_adjudication' }
};

export const CRITERION_ICON = {
  passed: 'M4 9.5l3.2 3.2L14 6',
  failed: 'M5.5 5.5l7 7M12.5 5.5l-7 7',
  excluded: 'M5.5 5.5l7 7M12.5 5.5l-7 7',
  indeterminate: 'M9 5v5M9 12.4v.1'
};

export const STATUS_ORDER = ['eligible', 'needs_adjudication', 'evidence_gap', 'borderline', 'ineligible'];

export const SEVERITY_CHIP = {
  high: 'chip-ineligible',
  medium: 'chip-evidence_gap',
  low: 'chip-neutral'
};

export const CRITERION_COLOR = {
  passed: 'var(--ok)',
  failed: 'var(--crimson)',
  excluded: 'var(--crimson)',
  indeterminate: 'var(--warn)'
};

export function statusMeta(s) {
  return STATUS_META[s] || { label: s, chip: 'chip-neutral', cell: 'sc-ineligible' };
}

export function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toISOString().slice(0, 10);
}

export function fmtTimestamp(iso) {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
}

export function sexLabel(s) {
  return { M: 'Male', F: 'Female', U: 'Unspecified' }[s] || s || 'Unspecified';
}