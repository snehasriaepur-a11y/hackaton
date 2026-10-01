const trials = [
  {
    id: 't001',
    nctId: 'NCT04128337',
    title: 'Pembrolizumab plus Platinum Chemotherapy in Previously Treated NSCLC',
    acronym: 'KEYNOTE-671',
    phase: 'Phase III',
    indication: 'Non-Small Cell Lung Cancer',
    sponsor: 'Meridian Oncology Research Consortium',
    status: 'Recruiting',
    sites: 34,
    targetEnrollment: 520,
    lastReviewed: '2026-08-14',
    inclusionCriteria: [
      { id: 'i1', field: 'diagnosis', operator: 'includes', value: 'Non-Small Cell Lung Cancer', weight: 1.0, text: 'Histologically or cytologically confirmed NSCLC (squamous or non-squamous).' },
      { id: 'i2', field: 'stage', operator: 'in', value: ['Stage IIIA', 'Stage IIIB', 'Stage IIIC'], weight: 1.0, text: 'Stage IIIA–IIIC disease per AJCC 8th edition, unresectable.' },
      { id: 'i3', field: 'ecogPerformance', operator: '<=', value: 1, weight: 0.9, text: 'ECOG performance status 0 or 1.' },
      { id: 'i4', field: 'age', operator: 'between', value: [18, 80], weight: 0.6, text: 'Age 18 years or older and under 81 at screening.' },
      { id: 'i5', field: 'labs.hemoglobine', operator: '>=', value: 9.0, weight: 0.7, text: 'Hemoglobin ≥ 9.0 g/dL.' },
      { id: 'i6', field: 'labs.platelets', operator: '>=', value: 100000, weight: 0.7, text: 'Platelets ≥ 100,000/mm³.' },
      { id: 'i7', field: 'labs.creatinine', operator: '<=', value: 1.5, weight: 0.8, text: 'Creatinine ≤ 1.5 mg/dL or CrCl ≥ 45 mL/min.' },
      { id: 'i8', field: 'labs.bilirubin', operator: '<=', value: 1.5, weight: 0.7, text: 'Total bilirubin ≤ 1.5 × ULN.' },
      { id: 'i9', field: 'priorTherapies.pd1', operator: 'not includes', value: 'Pembrolizumab', weight: 1.0, text: 'No prior therapy with anti-PD-1, anti-PD-L1 or anti-CTLA-4.' }
    ],
    exclusionCriteria: [
      { id: 'e1', field: 'diagnosis', operator: 'includes', value: 'Small Cell', weight: 1.0, text: 'Small cell or neuroendocrine histology.' },
      { id: 'e2', field: 'labs.neutrophils', operator: '<', value: 1500, weight: 0.9, text: 'ANC < 1,500/mm³.' },
      { id: 'e3', field: 'comorbidities', operator: 'includesAny', value: ['Autoimmune Disease', 'Interstitial Lung Disease', 'Active Infection'], weight: 1.0, text: 'Active autoimmune disease, ILD, or active infection requiring therapy.' },
      { id: 'e4', field: 'labs.astUl', operator: '>', value: 3, weight: 0.8, text: 'AST or ALT > 3 × upper limit of normal.' },
      { id: 'e5', field: 'history.malignancy', operator: 'includes', value: 'Malignancy within 5 years', weight: 0.8, text: 'Other malignancy within 5 years, except adequately treated non-melanoma skin cancer or cervical carcinoma in situ.' }
    ],
    requiredEvidence: [
      { key: 'imaging.cts', label: 'CT Chest / Abdomen / Pelvis', category: 'Imaging', blocking: true },
      { key: 'imaging.mriBrain', label: 'MRI Brain (contrast)', category: 'Imaging', blocking: true },
      { key: 'labs.cbc', label: 'Complete Blood Count', category: 'Laboratory', blocking: true },
      { key: 'labs.cmp', label: 'Comprehensive Metabolic Panel', category: 'Laboratory', blocking: true },
      { key: 'molecular.pdL1', label: 'PD-L1 Expression (TPS ≥ 1%)', category: 'Molecular', blocking: true },
      { key: 'molecular.egfrAlk', label: 'EGFR / ALK / ROS1 Genotyping', category: 'Molecular', blocking: true },
      { key: 'pathology.report', label: 'Pathology Confirmation Report', category: 'Pathology', blocking: true }
    ],
    evidenceWindowDays: 90
  },
  {
    id: 't002',
    nctId: 'NCT03855276',
    title: 'Dual Checkpoint Blockade in Metastatic Melanoma with Brain Metastases',
    acronym: 'TRIPLE-ARM',
    phase: 'Phase II',
    indication: 'Metastatic Melanoma',
    sponsor: 'Nordic Melanoma Consortium',
    status: 'Recruiting',
    sites: 21,
    targetEnrollment: 180,
    lastReviewed: '2026-07-29',
    inclusionCriteria: [
      { id: 'i1', field: 'diagnosis', operator: 'includes', value: 'Melanoma', weight: 1.0, text: 'Confirmed metastatic melanoma, stage IV.' },
      { id: 'i2', field: 'stage', operator: 'includes', value: 'Stage IV', weight: 1.0, text: 'AJCC Stage IV disease.' },
      { id: 'i3', field: 'ecogPerformance', operator: '<=', value: 2, weight: 0.9, text: 'ECOG performance status ≤ 2.' },
      { id: 'i4', field: 'age', operator: 'between', value: [18, 85], weight: 0.6, text: 'Age 18–85 years.' },
      { id: 'i5', field: 'labs.hemoglobine', operator: '>=', value: 8.5, weight: 0.7, text: 'Hemoglobin ≥ 8.5 g/dL.' },
      { id: 'i6', field: 'labs.platelets', operator: '>=', value: 75000, weight: 0.7, text: 'Platelets ≥ 75,000/mm³.' },
      { id: 'i7', field: 'molecular.braf', operator: 'notBlank', value: null, weight: 0.9, text: 'Documentable BRAF V600 mutation status (result may be wild-type).' }
    ],
    exclusionCriteria: [
      { id: 'e1', field: 'comorbidities', operator: 'includesAny', value: ['Autoimmune Disease', 'Transplant'], weight: 1.0, text: 'Known autoimmune disease or solid organ transplant on immunosuppression.' },
      { id: 'e2', field: 'priorTherapies.checkpoint', operator: 'includes', value: 'Checkpoint Inhibitor', weight: 1.0, text: 'Prior checkpoint inhibitor monotherapy within 6 months.' },
      { id: 'e3', field: 'labs.creatinine', operator: '>', value: 2.5, weight: 0.8, text: 'Creatinine > 2.5 mg/dL.' },
      { id: 'e4', field: 'ecogPerformance', operator: '>', value: 3, weight: 0.9, text: 'ECOG performance status > 3.' }
    ],
    requiredEvidence: [
      { key: 'imaging.ctWhole', label: 'CT Chest / Abdomen / Pelvis', category: 'Imaging', blocking: true },
      { key: 'imaging.mriBrain', label: 'MRI Brain (contrast)', category: 'Imaging', blocking: true },
      { key: 'labs.cbc', label: 'Complete Blood Count', category: 'Laboratory', blocking: true },
      { key: 'labs.ldh', label: 'Serum LDH', category: 'Laboratory', blocking: true },
      { key: 'molecular.braf', label: 'BRAF V600 Mutation Status', category: 'Molecular', blocking: true },
      { key: 'molecular.nrf2', label: 'NRF2 Genotyping', category: 'Molecular', blocking: false },
      { key: 'pathology.report', label: 'Pathology Confirmation Report', category: 'Pathology', blocking: true }
    ],
    evidenceWindowDays: 60
  },
  {
    id: 't003',
    nctId: 'NCT04472233',
    title: 'PARP Inhibitor Maintenance in Germline BRCA1/2 Mutant Breast Cancer',
    acronym: 'BRIGHT-2',
    phase: 'Phase II/III',
    indication: 'Triple-Negative Breast Cancer',
    sponsor: 'Aurora Breast Cancer Group',
    status: 'Active, not recruiting',
    sites: 47,
    targetEnrollment: 410,
    lastReviewed: '2026-09-02',
    inclusionCriteria: [
      { id: 'i1', field: 'diagnosis', operator: 'includes', value: 'Triple-Negative Breast Cancer', weight: 1.0, text: 'Confirmed triple-negative invasive breast carcinoma (ER/PR/HER2 negative).' },
      { id: 'i2', field: 'stage', operator: 'in', value: ['Stage I', 'Stage II', 'Stage III'], weight: 1.0, text: 'Stage I–III operable or locally advanced disease.' },
      { id: 'i3', field: 'ecogPerformance', operator: '<=', value: 1, weight: 0.9, text: 'ECOG performance status 0–1.' },
      { id: 'i4', field: 'age', operator: 'between', value: [18, 75], weight: 0.6, text: 'Age 18–75 years.' },
      { id: 'i5', field: 'molecular.brca', operator: 'includesAny', value: ['BRCA1', 'BRCA2'], weight: 1.0, text: 'Germline pathogenic BRCA1 or BRCA2 variant confirmed.' },
      { id: 'i6', field: 'labs.hemoglobine', operator: '>=', value: 10.0, weight: 0.7, text: 'Hemoglobin ≥ 10.0 g/dL.' }
    ],
    exclusionCriteria: [
      { id: 'e1', field: 'priorTherapies.parp', operator: 'includes', value: 'PARP Inhibitor', weight: 1.0, text: 'Prior PARP inhibitor therapy.' },
      { id: 'e2', field: 'comorbidities', operator: 'includesAny', value: ['Cardiac Disease', 'Hepatic Disease'], weight: 0.9, text: 'Clinically significant cardiac or hepatic disease.' },
      { id: 'e3', field: 'ecogPerformance', operator: '>', value: 2, weight: 0.8, text: 'ECOG performance status > 2.' },
      { id: 'e4', field: 'labs.astUl', operator: '>', value: 2.5, weight: 0.7, text: 'AST or ALT > 2.5 × upper limit of normal.' }
    ],
    requiredEvidence: [
      { key: 'molecular.brcaGermline', label: 'Germline BRCA1/2 Test Report', category: 'Molecular', blocking: true },
      { key: 'imaging.mriBreast', label: 'Breast MRI', category: 'Imaging', blocking: true },
      { key: 'imaging.mammo', label: 'Mammogram (within 12 months)', category: 'Imaging', blocking: true },
      { key: 'pathology.report', label: 'Core Biopsy Pathology Report', category: 'Pathology', blocking: true },
      { key: 'receptor.erprher2', label: 'ER / PR / HER2 Receptor Status', category: 'Pathology', blocking: true },
      { key: 'labs.cbc', label: 'Complete Blood Count', category: 'Laboratory', blocking: true },
      { key: 'ecg', label: '12-Lead ECG', category: 'Cardiac', blocking: true }
    ],
    evidenceWindowDays: 120
  },
  {
    id: 't004',
    nctId: 'NCT03720958',
    title: 'Second-Line Systemic Therapy in Advanced Hepatocellular Carcinoma',
    acronym: 'ORIENT-HCC',
    phase: 'Phase III',
    indication: 'Hepatocellular Carcinoma',
    sponsor: 'Pacific Liver Trials Collaborative',
    status: 'Recruiting',
    sites: 62,
    targetEnrollment: 780,
    lastReviewed: '2026-06-18',
    inclusionCriteria: [
      { id: 'i1', field: 'diagnosis', operator: 'includes', value: 'Hepatocellular Carcinoma', weight: 1.0, text: 'Confirmed advanced HCC, BCLC stage B or C.' },
      { id: 'i2', field: 'stage', operator: 'in', value: ['Stage A', 'Stage B', 'Stage C'], weight: 1.0, text: 'BCLC stage B or C, Child-Pugh A or B.' },
      { id: 'i3', field: 'ecogPerformance', operator: '<=', value: 2, weight: 0.9, text: 'ECOG performance status 0–2.' },
      { id: 'i4', field: 'labs.hemoglobine', operator: '>=', value: 8.0, weight: 0.7, text: 'Hemoglobin ≥ 8.0 g/dL.' },
      { id: 'i5', field: 'labs.platelets', operator: '>=', value: 50000, weight: 0.7, text: 'Platelets ≥ 50,000/mm³.' },
      { id: 'i6', field: 'labs.bilirubin', operator: '<=', value: 3.0, weight: 0.8, text: 'Total bilirubin ≤ 3.0 mg/dL (Child-Pugh B permitted).' },
      { id: 'i7', field: 'age', operator: 'between', value: [18, 80], weight: 0.6, text: 'Age 18–80 years.' }
    ],
    exclusionCriteria: [
      { id: 'e1', field: 'comorbidities', operator: 'includesAny', value: ['Child-Pugh C', 'Variceal Bleeding', 'Hepatic Encephalopathy'], weight: 1.0, text: 'Child-Pugh C, active variceal bleeding, or active hepatic encephalopathy.' },
      { id: 'e2', field: 'priorTherapies.sorafenib', operator: 'not includes', value: 'Sorafenib', weight: 0.9, text: 'No prior sorafenib or other tyrosine kinase inhibitor.' },
      { id: 'e3', field: 'ecogPerformance', operator: '>', value: 3, weight: 0.8, text: 'ECOG performance status > 3.' },
      { id: 'e4', field: 'labs.creatinine', operator: '>', value: 1.5, weight: 0.8, text: 'Creatinine > 1.5 mg/dL.' }
    ],
    requiredEvidence: [
      { key: 'imaging.ctAbdomen', label: 'CT or MRI Abdomen (arterial phase)', category: 'Imaging', blocking: true },
      { key: 'pathology.report', label: 'Histologic Confirmation or LI-RADS 5 Criteria', category: 'Pathology', blocking: true },
      { key: 'labs.afp', label: 'Serum Alpha-Fetoprotein', category: 'Laboratory', blocking: true },
      { key: 'scoring.childPugh', label: 'Child-Pugh Score Assessment', category: 'Clinical Score', blocking: true },
      { key: 'scoring.bclc', label: 'BCLC Staging Assessment', category: 'Clinical Score', blocking: true },
      { key: 'endoscopy', label: 'Upper GI Endoscopy Report', category: 'Procedure', blocking: false },
      { key: 'labs.cbc', label: 'Complete Blood Count', category: 'Laboratory', blocking: true }
    ],
    evidenceWindowDays: 90
  },
  {
    id: 't005',
    nctId: 'NCT04015493',
    title: 'FLT3-Targeted Therapy in Relapsed/Refractory Acute Myeloid Leukemia',
    acronym: 'FLARES',
    phase: 'Phase I/II',
    indication: 'Acute Myeloid Leukemia',
    sponsor: 'Hematologic Malignancies Institute',
    status: 'Recruiting',
    sites: 18,
    targetEnrollment: 96,
    lastReviewed: '2026-08-30',
    inclusionCriteria: [
      { id: 'i1', field: 'diagnosis', operator: 'includes', value: 'Acute Myeloid Leukemia', weight: 1.0, text: 'Confirmed relapsed or refractory AML.' },
      { id: 'i2', field: 'ecogPerformance', operator: '<=', value: 2, weight: 0.9, text: 'ECOG performance status 0–2.' },
      { id: 'i3', field: 'age', operator: 'between', value: [18, 75], weight: 0.6, text: 'Age 18–75 years.' },
      { id: 'i4', field: 'labs.hemoglobine', operator: '>=', value: 7.0, weight: 0.6, text: 'Hemoglobin ≥ 7.0 g/dL without transfusion support.' },
      { id: 'i5', field: 'labs.platelets', operator: '>=', value: 30000, weight: 0.6, text: 'Platelets ≥ 30,000/mm³.' },
      { id: 'i6', field: 'molecular.flt3', operator: 'includesAny', value: ['FLT3-ITD', 'FLT3-TKD'], weight: 1.0, text: 'Documented FLT3-ITD or FLT3-TKD mutation.' },
      { id: 'i7', field: 'diagnosis', operator: 'not includes', value: 'Acute Promyelocytic', weight: 1.0, text: 'Non-APL morphology.' }
    ],
    exclusionCriteria: [
      { id: 'e1', field: 'priorTherapies.stemCell', operator: 'includes', value: 'Stem Cell Transplant', weight: 1.0, text: 'Prior allogeneic stem cell transplant.' },
      { id: 'e2', field: 'comorbidities', operator: 'includesAny', value: ['Hepatic Disease', 'Renal Disease'], weight: 0.9, text: 'Severe hepatic or renal impairment.' },
      { id: 'e3', field: 'labs.astUl', operator: '>', value: 3, weight: 0.8, text: 'AST or ALT > 3 × upper limit of normal.' },
      { id: 'e4', field: 'diagnosis', operator: 'includes', value: 'APML', weight: 0.9, text: 'Acute promyelocytic leukemia (APL).' }
    ],
    requiredEvidence: [
      { key: 'pathology.boneMarrow', label: 'Bone Marrow Aspiration / Biopsy Report', category: 'Pathology', blocking: true },
      { key: 'pathology.cytogenetics', label: 'Cytogenetic & Molecular Karyotype', category: 'Pathology', blocking: true },
      { key: 'molecular.flt3', label: 'FLT3-ITD / FLT3-TKD Report', category: 'Molecular', blocking: true },
      { key: 'labs.ldh', label: 'Serum LDH', category: 'Laboratory', blocking: true },
      { key: 'labs.cbc', label: 'Complete Blood Count', category: 'Laboratory', blocking: true },
      { key: 'scoring.eligibility', label: 'IWG ELN Risk Stratification', category: 'Clinical Score', blocking: false }
    ],
    evidenceWindowDays: 45
  }
];

module.exports = { trials };