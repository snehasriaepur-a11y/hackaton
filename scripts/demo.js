const { patients } = require('../backend/src/data/patients');
const { trials } = require('../backend/src/data/trials');
const { evaluateTrial, rankTrialsForPatient } = require('../backend/src/engine/matchingEngine');

console.log('=== RANKING p001 ===');
for (const r of rankTrialsForPatient(patients[0], trials)) {
  console.log(' ', r.trialId, r.status.padEnd(18), 'score=' + String(r.score).padStart(3), r.nctId);
}

console.log('\n=== NEGATION GUARD (NSCLC vs Small Cell exclusion) ===');
const r1 = evaluateTrial(patients[0], trials[0]);
const e1 = r1.exclusion.find(c => c.id === 'e1');
console.log('  diag:', patients[0].diagnosis);
console.log('  e1:', e1.status, '->', e1.evidence);

console.log('\n=== EMPTY ARRAY (prior pd1) ===');
const i9 = r1.inclusion.find(c => c.id === 'i9');
console.log('  pd1=', JSON.stringify(patients[0].priorTherapies.pd1));
console.log('  i9:', i9.status, '->', i9.evidence);

console.log('\n=== VERDICT DISTRIBUTION (6 x 5 = 30 pairs) ===');
const counts = {};
for (const p of patients) for (const r of rankTrialsForPatient(p, trials)) counts[r.status] = (counts[r.status] || 0) + 1;
for (const [k, v] of Object.entries(counts)) console.log(' ', k.padEnd(20), v);
