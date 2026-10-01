const { patients } = require('./src/data/patients');
const { trials } = require('./src/data/trials');
const { evaluateTrial, rankTrialsForPatient } = require('./src/engine/matchingEngine');
const { computeMetrics } = require('./src/engine/evaluation');

const pad = (s, n) => String(s).padEnd(n);
console.log('=== KEY EVALUATIONS ===');
for (const [p, t] of [['p001','t001'],['p002','t002'],['p003','t003'],['p004','t004'],['p005','t005'],['p006','t001']]) {
  const r = evaluateTrial(patients.find(x=>x.id===p), trials.find(x=>x.id===t));
  console.log(`${pad(p+'/'+t,10)} ${pad(r.status,18)} score=${pad(r.score,4)} conf=${pad(r.confidence,9)} ${r.headline.slice(0,80)}`);
}

console.log('\n=== FULL MATRIX ===');
console.log('patient    ' + trials.map(t => pad(t.id, 18)).join(''));
for (const p of patients) {
  console.log(pad(p.id, 11) + trials.map(t => pad(evaluateTrial(p, t).status, 18)).join(''));
}

console.log('\n=== p001/t001 INCLUSION ===');
const a = evaluateTrial(patients[0], trials[0]);
a.inclusion.forEach(c => console.log(`  ${pad(c.id,4)} ${pad(c.status,15)} ${pad(c.fieldLabel,42)} ${c.evidence||''}`));
console.log('  exclusions:');
a.exclusion.forEach(c => console.log(`  ${pad(c.id,4)} ${pad(c.status,15)} ${pad(c.fieldLabel,42)} ${c.evidence||''}`));

console.log('\n=== METRICS ===');
const m = computeMetrics();
console.log(`precision=${m.precision}% recall=${m.recall}% f1=${m.f1} fpr=${m.falsePositiveRate}% acc=${m.accuracy}%`);
console.log(`TP=${m.confusion.tp} FP=${m.confusion.fp} TN=${m.confusion.tn} FN=${m.confusion.fn}`);
m.perCase.filter(c => c.outcome !== 'true-negative').forEach(c =>
  console.log(`  ${pad(c.patientId+'/'+c.trialId,10)} pred=${pad(c.predicted,14)} actual=${pad(c.actual,14)} ${c.outcome}`));
console.log('\nOK');