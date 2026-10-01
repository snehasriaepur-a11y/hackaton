const { patients, trials } = require('./patients');
const { trials: trialDefs } = require('./trials');

const STOP = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'for', 'to', 'of', 'in', 'on', 'at', 'and', 'or',
  'i', 'you', 'me', 'my', 'we', 'it', 'this', 'that', 'what', 'why', 'how', 'when', 'which', 'who', 'can', 'do',
  'does', 'did', 'tell', 'about', 'please', 'there', 'here', 'has', 'have', 'had', 'with', 'from', 'any', 'some'
]);

function tokenize(q) {
  return String(q || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && w.length > 1 && !STOP.has(w));
}

function findPatients(q, limit = 6) {
  const hay = (p) =>
    [p.id, p.mrn, p.name, p.diagnosis, p.histology, p.stage, p.comorbidities?.join(' '), p.notes?.map((n) => n.text).join(' ')]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  const tokens = tokenize(q);
  if (!tokens.length) return [];
  const scored = patients
    .map((p) => {
      const h = hay(p);
      let s = 0;
      for (const t of tokens) {
        if (h.includes(t)) s += 1;
        if (String(p.id).toLowerCase() === t) s += 10;
        if (String(p.mrn || '').toLowerCase().includes(t)) s += 8;
      }
      return { p, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map((x) => x.p);
}

function findTrials(q, limit = 4) {
  const tokens = tokenize(q);
  if (!tokens.length) return [];
  const scored = trialDefs
    .map((t) => {
      const h = [t.id, t.nctId, t.title, t.acronym, t.indication, t.phase, t.sponsor].filter(Boolean).join(' ').toLowerCase();
      let s = 0;
      for (const tk of tokens) {
        if (h.includes(tk)) s += 1;
        if (t.nctId.toLowerCase() === tk) s += 10;
        if (t.id.toLowerCase() === tk) s += 8;
      }
      return { t, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map((x) => x.t);
}

module.exports = { findPatients, findTrials, tokenize };
