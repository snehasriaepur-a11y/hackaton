const patients = [
  {
    id: 'p001',
    mrn: 'DEID-4471-A',
    name: 'Subject A-4471',
    initials: 'SA',
    age: 54,
    sex: 'F',
    race: 'White',
    diagnosis: 'Non-Small Cell Lung Cancer',
    histology: 'Adenocarcinoma',
    stage: 'Stage IIIB',
    ecogPerformance: 1,
    dateOfDiagnosis: '2024-03-18',
    lastVisit: '2026-09-12',
    labs: {
      hemoglobine: 11.2,
      wbc: 6.8,
      platelets: 184000,
      neutrophils: 4200,
      creatinine: 0.9,
      alt: 28,
      ast: 32,
      bilirubin: 0.7,
      ldh: 240,
      afp: 3
    },
    comorbidities: ['Hypertension', 'Type 2 Diabetes'],
    medications: ['Metformin 1000mg BID', 'Lisinopril 10mg QD', 'Atorvastatin 20mg QD'],
    smokingHistory: 'Former smoker, 20 pack-years, quit 5 years ago',
    priorTherapies: {
      pd1: [],
      checkpoint: ['Pembrolizumab 200mg q3w (2021-06 to 2022-01)'],
      parp: [],
      sorafenib: [],
      stemCell: [],
      other: ['Carboplatin + Pemetrexed x4 cycles', 'Concurrent chemoradiation 60Gy']
    },
    history: {
      malignancy: []
    },
    evidence: {
      'imaging.cts': { present: true, date: '2026-08-30' },
      'imaging.mriBrain': { present: true, date: '2026-08-30' },
      'labs.cbc': { present: true, date: '2026-09-10' },
      'labs.cmp': { present: true, date: '2026-09-10' },
      'molecular.pdL1': { present: true, date: '2026-07-22', result: 'TPS 65%' },
      'molecular.egfrAlk': { present: true, date: '2026-07-22', result: 'Negative' },
      'pathology.report': { present: true, date: '2024-03-18' }
    },
    notes: [
      { id: 'n1', date: '2026-09-10', author: 'Dr. A. Whitfield', type: 'progress', text: 'Patient reports improved exertional dyspnea. ECOG confirmed 1 on exam. No new neurological complaints. Restaging CT scheduled 2026-10-05.' },
      { id: 'n2', date: '2026-08-30', author: 'Radiology', type: 'imaging', text: 'CT chest/abd/pelvis with contrast: stable mediastinal mass with slight interval reduction (RECIST -12%). No intracranial disease on MRI. Liver metastases not seen.' },
      { id: 'n3', date: '2026-07-22', author: 'Lab', type: 'result', text: 'PD-L1 TPS 65%. EGFR exon 19/21, ALK, ROS1 all negative. Liquid biopsy NGS pending.' }
    ],
    adversarialFlags: []
  },
  {
    id: 'p002',
    mrn: 'DEID-8823-B',
    name: 'Subject B-8823',
    initials: 'JR',
    age: 67,
    sex: 'M',
    race: 'Black',
    diagnosis: 'Metastatic Melanoma',
    histology: 'Epithelioid',
    stage: 'Stage IV',
    ecogPerformance: 2,
    dateOfDiagnosis: '2023-09-04',
    lastVisit: '2026-09-05',
    labs: {
      hemoglobine: 9.8,
      wbc: 4.2,
      platelets: 122000,
      neutrophils: 2100,
      creatinine: 1.3,
      alt: 45,
      ast: 52,
      bilirubin: 1.1,
      ldh: 410,
      afp: 4
    },
    comorbidities: ['Chronic Kidney Disease Stage 3', 'Hypertension'],
    medications: ['Erythropoietin 40000 units weekly', 'Amlodipine 5mg QD'],
    smokingHistory: 'Never smoker',
    priorTherapies: {
      pd1: ['Pembrolizumab', 'Nivolumab'],
      checkpoint: ['Pembrolizumab (2023-11 to 2024-03)', 'Ipilimumab (2024-01, single dose)'],
      parp: [],
      sorafenib: [],
      stemCell: [],
      other: ['Dabrafenib + Trametinib x8 months', 'Stereotactic radiosurgery x3 to brain mets']
    },
    history: {
      malignancy: []
    },
    evidence: {
      'imaging.ctWhole': { present: true, date: '2026-08-25' },
      'imaging.mriBrain': { present: true, date: '2026-08-25' },
      'labs.cbc': { present: true, date: '2026-09-03' },
      'labs.ldh': { present: true, date: '2026-09-03', result: '410 U/L (elevated)' },
      'molecular.braf': { present: true, date: '2023-09-10', result: 'BRAF V600E positive' },
      'pathology.report': { present: true, date: '2023-09-04' }
    },
    notes: [
      { id: 'n1', date: '2026-09-03', author: 'Dr. M. Okonkwo', type: 'progress', text: 'ECOG 2 — limited ambulation, requires assistance with ADLs. LDH 410, rising from 340. Consider restaging.' },
      { id: 'n2', date: '2026-06-11', author: 'Dr. M. Okonkwo', type: 'progress', text: 'Prior checkpoint inhibitor exposure documented. Not a candidate for re-challenge per protocol.' },
      { id: 'n3', date: '2026-01-20', author: 'Nursing', type: 'triage', text: 'Pt called re: "worsening fatigue." Denies chest pain. Advised to contact MD office.' }
    ],
    adversarialFlags: ['ambiguous-abbreviation']
  },
  {
    id: 'p003',
    mrn: 'DEID-1290-C',
    name: 'Subject C-1290',
    initials: 'EC',
    age: 42,
    sex: 'F',
    race: 'Asian',
    diagnosis: 'Triple-Negative Breast Cancer',
    histology: 'Invasive ductal carcinoma',
    stage: 'Stage II',
    ecogPerformance: 0,
    dateOfDiagnosis: '2025-11-22',
    lastVisit: '2026-09-14',
    labs: {
      hemoglobine: 13.5,
      wbc: 7.1,
      platelets: 288000,
      neutrophils: 4600,
      creatinine: 0.7,
      alt: 22,
      ast: 19,
      bilirubin: 0.5,
      ldh: 190,
      afp: 2
    },
    comorbidities: [],
    medications: ['Tamoxifen 20mg QD', 'Ondansetron PRN'],
    smokingHistory: 'Never smoker',
    priorTherapies: {
      pd1: [],
      checkpoint: [],
      parp: [],
      sorafenib: [],
      stemCell: [],
      other: ['Lumpectomy with sentinel node biopsy 2025-12-10', 'AC-T chemotherapy x4 cycles completed 2026-04-18']
    },
    history: {
      malignancy: []
    },
    evidence: {
      'molecular.brcaGermline': { present: true, date: '2026-05-02', result: 'Pathogenic BRCA1 c.5266dupC (p.Gln1756Profs*74), heterozygous' },
      'imaging.mriBreast': { present: true, date: '2026-08-14' },
      'imaging.mammo': { present: true, date: '2026-08-14' },
      'pathology.report': { present: true, date: '2026-09-08', result: 'Re-reviewed 2026-09-08. Invasive ductal carcinoma, grade 2. ER 0%, PR 0%, HER2 0% (IHC 1+), Ki-67 72%.' },
      'receptor.erprher2': { present: true, date: '2026-09-08', result: 'Triple negative reconfirmed on re-review' },
      'labs.cbc': { present: true, date: '2026-09-12' },
      'ecg': { present: true, date: '2026-09-10', result: 'Normal sinus rhythm, PR 148ms, QRS 92ms. No ST-T changes.' }
    },
    notes: [
      { id: 'n1', date: '2026-09-12', author: 'Dr. L. Pham', type: 'progress', text: 'ECOG 0, fully active. Germline BRCA1 pathogenic variant confirmed. Excellent candidate for PARP maintenance per BRIGHT-2.' },
      { id: 'n2', date: '2026-08-14', author: 'Radiology', type: 'imaging', text: 'Bilateral mammogram and breast MRI: no residual enhancing lesion in left breast. Right breast benign fibroadenoma. No suspicious nodes.' },
      { id: 'n3', date: '2026-05-02', author: 'Genetics', type: 'result', text: 'Germline testing: BRCA1 pathogenic variant identified. Cascade testing recommended for first-degree relatives. Genetic counselor referral placed.' }
    ],
    adversarialFlags: []
  },
  {
    id: 'p004',
    mrn: 'DEID-6654-D',
    name: 'Subject D-6654',
    initials: 'RT',
    age: 71,
    sex: 'M',
    race: 'White',
    diagnosis: 'Hepatocellular Carcinoma',
    histology: 'Hepatocellular carcinoma, moderately differentiated',
    stage: 'Stage B',
    ecogPerformance: 1,
    dateOfDiagnosis: '2025-12-08',
    lastVisit: '2026-08-28',
    labs: {
      hemoglobine: 10.5,
      wbc: 5.5,
      platelets: 78000,
      neutrophils: 2800,
      creatinine: 1.1,
      alt: 65,
      ast: 78,
      bilirubin: 2.3,
      ldh: 320,
      afp: 1840
    },
    comorbidities: ['Cirrhosis', 'Portal Hypertension', 'Type 2 Diabetes'],
    medications: ['Lactulose 30mL TID', 'Rifaximin 550mg BID', 'Spironolactone 100mg QD', 'Furosemide 40mg QD'],
    smokingHistory: 'Former smoker, 35 pack-years, quit 10 years ago',
    priorTherapies: {
      pd1: [],
      checkpoint: [],
      parp: [],
      sorafenib: ['Sorafenib 400mg BID (2026-01 to 2026-05)'],
      stemCell: [],
      other: ['TACE x2 (2026-02, 2026-04)']
    },
    history: {
      malignancy: []
    },
    evidence: {
      'imaging.ctAbdomen': { present: true, date: '2026-08-22' },
      'pathology.report': { present: true, date: '2025-12-08' },
      'labs.afp': { present: true, date: '2026-08-26', result: '1840 ng/mL' },
      'scoring.childPugh': { present: true, date: '2026-08-26', result: 'Child-Pugh B (7 points)' },
      'scoring.bclc': { present: false, date: null },
      'endoscopy': { present: true, date: '2026-06-11', result: 'Grade 2 esophageal varices, banded' },
      'labs.cbc': { present: true, date: '2026-08-26' }
    },
    notes: [
      { id: 'n1', date: '2026-08-26', author: 'Dr. S. Banerjee', type: 'progress', text: 'Child-Pugh B7. Ascites controlled on diuretics. No encephalopathy since lactulose titration. Sorafenib discontinued 2026-05 for grade 3 hand-foot syndrome.' },
      { id: 'n2', date: '2026-06-11', author: 'Endoscopy', type: 'procedure', text: 'EGD with banding: grade 2 varices, three bands placed. Prophylactic beta-blocker re-initiated.' },
      { id: 'n3', date: '2026-04-02', author: 'MDT', type: 'consult', text: 'Multidisciplinary tumor board: not a surgical candidate given portal hypertension and BCLC B with impaired liver function. TACE recommended.' },
      { id: 'n4', date: '2026-05-18', author: 'MDT', type: 'consult', text: 'Note filed with date 2026-08-14 but pertaining to visit of 2026-05-18 — data entry discrepancy flagged by audit.' }
    ],
    adversarialFlags: ['conflicting-timestamp', 'legacy-code']
  },
  {
    id: 'p005',
    mrn: 'DEID-3390-E',
    name: 'Subject E-3390',
    initials: 'MG',
    age: 38,
    sex: 'F',
    race: 'Hispanic',
    diagnosis: 'Acute Myeloid Leukemia',
    histology: 'FAB M2, myelomonocytic',
    stage: 'Relapsed',
    ecogPerformance: 1,
    dateOfDiagnosis: '2023-06-14',
    lastVisit: '2026-09-16',
    labs: {
      hemoglobine: 7.8,
      wbc: 15.2,
      platelets: 41000,
      neutrophils: 900,
      creatinine: 0.8,
      alt: 35,
      ast: 40,
      bilirubin: 0.9,
      ldh: 680,
      afp: 3
    },
    comorbidities: ['Iron Overload', 'Transfusion Dependence'],
    medications: ['Deferoxamine 1000mg nightly', 'Filgrastim PRN', 'Allopurinol 100mg QD'],
    smokingHistory: 'Never smoker',
    priorTherapies: {
      pd1: [],
      checkpoint: [],
      parp: [],
      sorafenib: [],
      stemCell: [],
      other: ['Induction cytarabine + idarubicin (2019)', 'Consolidation (2019)', 'Salvage azacitidine + venetoclax x6 cycles (2025-2026)']
    },
    history: {
      malignancy: []
    },
    evidence: {
      'pathology.boneMarrow': { present: true, date: '2026-07-30', result: 'Blasts 42% marrow, consistent with active relapsed disease' },
      'pathology.cytogenetics': { present: true, date: '2026-08-02', result: 'Normal karyotype 46,XX' },
      'molecular.flt3': { present: true, date: '2026-08-02', result: 'FLT3-ITD positive, VAF 34%, allelic ratio 0.41' },
      'labs.ldh': { present: true, date: '2026-09-14', result: '680 U/L' },
      'labs.cbc': { present: true, date: '2026-09-14' },
      'scoring.eligibility': { present: false, date: null }
    },
    notes: [
      { id: 'n1', date: '2026-09-14', author: 'Dr. P. Iyer', type: 'progress', text: 'Transfusion dependent. ANC 900 — meets minimum threshold. LDH elevated at 680, consistent with high disease burden.' },
      { id: 'n2', date: '2026-08-02', author: 'Lab', type: 'result', text: 'FLT3-ITD detected, allelic ratio 0.41. FLT3-TKD negative. NPM1, CEBPA, RUNX1 wild-type.' },
      { id: 'n3', date: '2026-07-30', author: 'Pathology', type: 'pathology', text: 'Marrow aspirate: 42% myeloblasts. Morphology consistent with persistent AML. Prior dx noted as "M2" per FAB 1985 classification (legacy code, not mapped to current WHO).' },
      { id: 'n4', date: '2026-09-01', author: 'Nursing', type: 'triage', text: 'Pt reports "feeling fine." Denies fever, denies bleeding. Note: per protocol, pt advised to report any temperatures ≥ 38.0°C.' }
    ],
    adversarialFlags: ['legacy-code', 'ambiguous-abbreviation']
  },
  {
    id: 'p006',
    mrn: 'DEID-7712-F',
    name: 'Subject F-7712',
    initials: 'DK',
    age: 45,
    sex: 'M',
    race: 'White',
    diagnosis: 'Non-Small Cell Lung Cancer',
    histology: 'Squamous cell carcinoma',
    stage: 'Stage IV',
    ecogPerformance: 3,
    dateOfDiagnosis: '2026-06-02',
    lastVisit: '2026-09-09',
    labs: {
      hemoglobine: 8.1,
      wbc: 11.4,
      platelets: 96000,
      neutrophils: 1100,
      creatinine: 1.6,
      alt: 74,
      ast: 96,
      bilirubin: 1.9,
      ldh: 890,
      afp: 5
    },
    comorbidities: ['Pulmonary Embolism', 'Hypertension', 'Obesity'],
    medications: ['Apixaban 5mg BID', 'Lisinopril 20mg QD', 'Metformin 1000mg BID', 'Oxygen 2L NC'],
    smokingHistory: 'Current smoker, 45 pack-years',
    priorTherapies: {
      pd1: [],
      checkpoint: [],
      parp: [],
      sorafenib: [],
      stemCell: [],
      other: ['Carboplatin + etoposide x2 cycles (incomplete)']
    },
    history: {
      malignancy: []
    },
    evidence: {
      'imaging.cts': { present: true, date: '2026-09-01' },
      'imaging.mriBrain': { present: true, date: '2026-09-01' },
      'labs.cbc': { present: true, date: '2026-09-08' },
      'labs.cmp': { present: true, date: '2026-09-08' },
      'molecular.pdL1': { present: false, date: null },
      'molecular.egfrAlk': { present: false, date: null },
      'pathology.report': { present: true, date: '2026-09-01', result: 'Squamous cell carcinoma, moderately differentiated. Re-reviewed 2026-09-01 for protocol eligibility.' }
    },
    notes: [
      { id: 'n1', date: '2026-09-08', author: 'Dr. K. Lindqvist', type: 'progress', text: 'ECOG 3 — confined to bed or chair >50% of waking hours. Progressive hypoxemia on 2L NC. Neutropenic sepsis risk given ANC 1100.' },
      { id: 'n2', date: '2026-09-01', author: 'Radiology', type: 'imaging', text: 'CT: primary left upper lobe mass 7.2cm with mediastinal and hilar adenopathy. Numerous hepatic metastases. No brain metastases.' },
      { id: 'n3', date: '2026-08-22', author: 'MDT', type: 'consult', text: 'Tumor board: performance status and hepatic function preclude standard immunotherapy. Recommend supportive care or clinical trial with relaxed criteria.' },
      { id: 'n4', date: '2026-08-30', author: 'Billing', type: 'admin', text: 'Coding discrepancy: primary dx listed as 8140/3 (unspecified behavior) vs narrative 8070/3 (squamous cell). PD-L1 and EGFR/ALK ordered, pending.' }
    ],
    adversarialFlags: ['miscoded-diagnosis', 'conflicting-timestamp']
  }
];

module.exports = { patients };