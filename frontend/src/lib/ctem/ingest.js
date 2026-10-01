import { rankTrialsForPatient, evaluateTrial, computeMetrics } from './matchingEngine';
const { patients } = require('./patients');
const { trials } = require('./trials');

function toCsvValue(v) {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.join('; ');
  if (typeof v === 'object') return JSON.stringify(v);
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function patientsToCsv() {
  const cols = ['id', 'mrn', 'name', 'age', 'sex', 'diagnosis', 'histology', 'stage', 'ecogPerformance', 'lastVisit'];
  const lines = [cols.join(',')];
  for (const p of patients) lines.push(cols.map(c => toCsvValue(p[c])).join(','));
  return lines.join('\n');
}

function parseCsv(text) {
  const rows = [];
  let cur = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      row.push(cur);
      cur = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
    } else cur += ch;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  const clean = rows.filter(r => r.some(c => c.trim() !== ''));
  if (!clean.length) return [];
  const header = clean[0].map(h => h.trim());
  return clean.slice(1).map(r => {
    const obj = {};
    header.forEach((h, i) => {
      obj[h] = r[i] === undefined ? '' : r[i].trim();
    });
    return obj;
  });
}

function coercePatient(obj, idx) {
  const num = (v) => (v === '' || v === undefined || v === null ? null : Number(v));
  const list = (v) => (v ? String(v).split(/[;|]/).map(s => s.trim()).filter(Boolean) : []);
  return {
    id: obj.id || obj.subjectId || `u${idx}`,
    mrn: obj.mrn || `DEID-U${idx}`,
    name: obj.name || `Subject ${idx}`,
    age: num(obj.age),
    sex: obj.sex || 'U',
    diagnosis: obj.diagnosis || 'Unspecified',
    histology: obj.histology || null,
    stage: obj.stage || null,
    ecogPerformance: num(obj.ecogPerformance ?? obj.ecog),
    dateOfDiagnosis: obj.dateOfDiagnosis || null,
    lastVisit: obj.lastVisit || new Date().toISOString().slice(0, 10),
    labs: {
      hemoglobine: num(obj.hemoglobine ?? obj.hgb ?? obj.hemoglobin),
      platelets: num(obj.platelets ?? obj.plt),
      creatinine: num(obj.creatinine),
      alt: num(obj.alt),
      ast: num(obj.ast),
      bilirubin: num(obj.bilirubin),
      neutrophils: num(obj.neutrophils ?? obj.anc),
      ldh: num(obj.ldh),
      afp: num(obj.afp)
    },
    comorbidities: list(obj.comorbidities),
    medications: list(obj.medications),
    smokingHistory: obj.smokingHistory || '',
    priorTherapies: {
      pd1: list(obj.priorPd1),
      checkpoint: list(obj.priorCheckpoint),
      parp: list(obj.priorParp),
      sorafenib: list(obj.priorSorafenib),
      stemCell: list(obj.priorStemCell),
      other: list(obj.priorOther)
    },
    history: { malignancy: list(obj.malignancyHistory) },
    evidence: {},
    notes: obj.note ? [{ id: `u${idx}-n1`, date: new Date().toISOString().slice(0, 10), author: 'uploaded', type: 'note', text: String(obj.note) }] : [],
    adversarialFlags: []
  };
}

module.exports = { patientsToCsv, parseCsv, coercePatient };
