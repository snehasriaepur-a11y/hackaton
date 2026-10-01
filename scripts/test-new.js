const b = { patients: [] };

const rows = [
  'id,mrn,name,age,sex,diagnosis,histology,stage,ecogPerformance,lastVisit,hemoglobine,platelets,creatinine,alt,ast,bilirubin,neutrophils,comorbidities,priorCheckpoint',
  'u01,DEID-9001,Subject A-9001,61,F,Non-Small Cell Lung Cancer,Adenocarcinoma,Stage IIIB,1,2026-09-01,10.8,165000,1.0,30,35,0.8,3800,Hypertension,',
  'u02,DEID-9002,Subject B-9002,48,F,Metastatic Melanoma,Epithelioid,Stage IV,1,2026-09-03,9.4,142000,0.9,26,29,0.6,2900,None,Pembrolizumab 200mg q3w (2026-01 to 2026-04)',
  'u03,DEID-9003,Subject C-9003,73,M,Hepatocellular Carcinoma,Hepatocellular,Stage B,2,2026-08-28,11.9,88000,1.4,58,66,2.4,1500,Cirrhosis;Type 2 Diabetes,Sorafenib 400mg BID (2026-02 to 2026-06)'
];

const csv = rows.join('\n');

(async () => {
  const r1 = await fetch('http://localhost:3000/api/ingest/template');
  console.log('template:', r1.status, (await r1.text()).split('\n')[0]);

  const r2 = await fetch('http://localhost:3000/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csv })
  });
  const j2 = await r2.json();
  console.log('ingest csv:', r2.status, 'added =', j2.added, 'rejected =', j2.rejected?.length);

  if (j2.data?.length) {
    const m = await fetch('http://localhost:3000/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: j2.data[0].id, trialId: 't001' })
    });
    const jm = await m.json();
    console.log('match uploaded', jm.patientId, '->', jm.status, 'score', jm.score);
  }

  const r3 = await fetch('http://localhost:3000/api/glossary');
  const j3 = await r3.json();
  console.log('glossary terms:', Object.keys(j3.terms).length);

  const r4 = await fetch('http://localhost:3000/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Why is p004 not eligible?', patientId: 'p004' })
  });
  const j4 = await r4.json();
  console.log('\nassistant reply:\n ', j4.reply);
  console.log('  sources:', j4.sources.map((s) => s.label).join(' | '));

  const r5 = await fetch('http://localhost:3000/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'what is ECOG' })
  });
  console.log('\nassistant reply:\n ', (await r5.json()).reply);
})();
