const ABBREVIATIONS = {
  wbc: 'White Blood Cell count',
  anc: 'Absolute Neutrophil Count',
  hgb: 'Hemoglobin',
  hct: 'Hematocrit',
  plt: 'Platelets',
  egfr: 'Estimated Glomerular Filtration Rate',
  alk: 'Anaplastic Lymphoma Kinase',
  'pd-l1': 'Programmed Death Ligand 1',
  tps: 'Tumor Proportion Score',
  mri: 'Magnetic Resonance Imaging',
  ct: 'Computed Tomography',
  eeg: 'Electroencephalogram',
  ecog: 'ECOG Performance Status',
  afp: 'Alpha-Fetoprotein',
  ldh: 'Lactate Dehydrogenase',
  bmi: 'Body Mass Index',
  cbc: 'Complete Blood Count',
  cmp: 'Comprehensive Metabolic Panel',
  ecg: 'Electrocardiogram',
  ekg: 'Electrocardiogram',
  'pet/ct': 'Positron Emission Tomography / CT',
  tace: 'Transarterial Chemoembolization',
  egd: 'Esophagogastroduodenoscopy'
};

const NEGATION_CUES = [
  'no', 'not', 'none', 'never', 'denies', 'deny', 'denied',
  'without', 'absent', 'negative for', 'ruled out', 'free of',
  'absence of', 'unremarkable for', 'resolved', 'denying'
];

const AMBIGUOUS_TERMS = {
  'm2': 'M2 — could refer to FAB subtype M2 (myelomonocytic leukemia) or WHO/ICC morphologic code. Requires context.',
  'ir': 'IR — could mean "irregular rhythm" (cardiac) or "increased risk". Requires context.',
  'ms': 'MS — could mean "multiple sclerosis" or "milliseconds". Requires context.',
  's/p': 'S/P — could mean "status post" or "surgery pending". Requires context.',
  'sd': 'SD — could mean "standard deviation" or "single dose". Requires context.',
  'af': 'AF — could mean "atrial fibrillation" or "amniotic fluid". Requires context.',
  'ap': 'AP — could mean "anteroposterior" or "acute pancreatitis". Requires context.',
  'pd': 'PD — could mean "Parkinson disease", "peritoneal dialysis", or progression of disease. Requires context.',
  'ca': 'CA — could mean "calcium", "carcinoma", or "cerebral artery". Requires context.'
};

function tokenize(text) {
  return text.toLowerCase().replace(/[^\w\s./+-]/g, ' ').split(/\s+/).filter(Boolean);
}

function detectNegation(tokens, index, windowSize = 6) {
  const start = Math.max(0, index - windowSize);
  const context = tokens.slice(start, index);
  for (const token of context) {
    if (NEGATION_CUES.some(cue => token.includes(cue))) {
      return { negated: true, cue: token };
    }
  }
  return { negated: false };
}

function parseLabsFromNote(text) {
  const labValues = {};
  const patterns = [
    { key: 'hemoglobine', patterns: [/(?:hgb|hemoglobin|hb)\s*(?:of|is|=|:)?\s*(\d+(?:\.\d+)?)/gi], unit: 'g/dL' },
    { key: 'platelets', patterns: [/(?:plt|platelets?)\s*(?:of|is|=|:)?\s*(\d[\d,]*)/gi], unit: '/mm³' },
    { key: 'ldh', patterns: [/(?:ldh|lactate dehydrogenase)\s*(?:of|is|=|:)?\s*(\d+)/gi], unit: 'U/L' },
    { key: 'afp', patterns: [/(?:afp|alpha-fetoprotein)\s*(?:of|is|=|:)?\s*(\d[\d,]*)/gi], unit: 'ng/mL' },
    { key: 'wbc', patterns: [/(?:wbc|white blood cell(?: count)?)\s*(?:of|is|=|:)?\s*(\d+(?:\.\d+)?)/gi], unit: 'K/µL' },
    { key: 'creatinine', patterns: [/(?:creatinine|scr)\s*(?:of|is|=|:)?\s*(\d+(?:\.\d+)?)/gi], unit: 'mg/dL' },
    { key: 'bilirubin', patterns: [/(?:total bilirubin|bili|tbil)\s*(?:of|is|=|:)?\s*(\d+(?:\.\d+)?)/gi], unit: 'mg/dL' },
    { key: 'neutrophils', patterns: [/(?:anc|neutrophils?)\s*(?:of|is|=|:|abs)?\s*([\d,]+)/gi], unit: '/mm³' },
    { key: 'alt', patterns: [/(?:alt|sgpt)\s*(?:of|is|=|:)?\s*(\d+)/gi], unit: 'U/L' },
    { key: 'ast', patterns: [/(?:ast|sgot)\s*(?:of|is|=|:)?\s*(\d+)/gi], unit: 'U/L' }
  ];
  for (const p of patterns) {
    for (const pattern of p.patterns) {
      const match = pattern.exec(text);
      if (match) {
        const parsed = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(parsed)) {
          labValues[p.key] = { value: parsed, unit: p.unit, extractedFrom: 'note', confidence: 0.75 };
        }
        pattern.lastIndex = 0;
      }
    }
  }
  return labValues;
}

function findAbbreviationUsage(text) {
  const tokens = tokenize(text);
  const findings = [];
  const seen = new Set();
  for (const token of tokens) {
    const clean = token.replace(/[.,;:]/g, '');
    if (seen.has(clean)) continue;
    if (AMBIGUOUS_TERMS[clean]) {
      seen.add(clean);
      findings.push({ abbreviation: clean.toUpperCase(), ...{ ambiguousMeaning: AMBIGUOUS_TERMS[clean] }, severity: 'medium' });
    } else if (ABBREVIATIONS[clean]) {
      seen.add(clean);
    }
  }
  return findings;
}

function detectTemporalAnomalies(notes) {
  const anomalies = [];
  const seenDates = {};
  for (const note of notes) {
    seenDates[note.date] = seenDates[note.date] || [];
    seenDates[note.date].push(note.id);
  }
  for (const [date, ids] of Object.entries(seenDates)) {
    if (ids.length > 1) {
      anomalies.push({ type: 'conflicting-timestamp', date, noteIds: ids, severity: 'high', message: `Multiple notes share the same date ${date} with potentially conflicting content.` });
    }
  }
  const sorted = [...notes].sort((a, b) => new Date(a.date) - new Date(b.date));
  for (let i = 1; i < sorted.length; i++) {
    const delta = (new Date(sorted[i].date) - new Date(sorted[i - 1].date)) / 86400000;
    if (delta < 0) {
      anomalies.push({ type: 'out-of-order', noteIds: [sorted[i - 1].id, sorted[i].id], severity: 'medium', message: `Note ${sorted[i].id} precedes ${sorted[i - 1].id} despite later chart date.` });
    }
  }
  return anomalies;
}

function detectContradictions(notes) {
  const contradictions = [];
  const denialNotes = notes.filter(n => {
    const t = n.text.toLowerCase();
    return /\bdenies\b|\bno evidence of\b|\bnegative for\b|\bfree of\b/.test(t);
  });
  const positiveNotes = notes.filter(n => {
    const t = n.text.toLowerCase();
    return /\bmetastases\b|\bmetastatic disease\b|\bpositive for\b|\bconfirmed\b/.test(t) && !/\bno\b|\bnot\b|\bwithout\b|\bresolved\b/.test(t);
  });
  const denialTopics = ['metastases', 'infection', 'thrombus', 'hemorrhage'];
  for (const topic of denialTopics) {
    const denies = denialNotes.filter(n => n.text.toLowerCase().includes(topic));
    const asserts = positiveNotes.filter(n => n.text.toLowerCase().includes(topic));
    if (denies.length && asserts.length) {
      contradictions.push({ topic, deniedIn: denies.map(n => n.id), assertedIn: asserts.map(n => n.id), severity: 'high', message: `Topic "${topic}" is both denied and asserted across notes. Recommend manual adjudication.` });
    }
  }
  return contradictions;
}

function parsePatientRecord(patient) {
  const allNotes = patient.notes || [];
  const noteLabs = {};
  for (const note of allNotes) {
    Object.assign(noteLabs, parseLabsFromNote(note.text));
  }

  const structuredLabs = {};
  for (const [key, value] of Object.entries(patient.labs || {})) {
    structuredLabs[key] = { value, source: 'structured_ehr', confidence: 1.0 };
  }
  const noteOnlyLabs = {};
  for (const [key, entry] of Object.entries(noteLabs)) {
    if (!structuredLabs[key]) {
      noteOnlyLabs[key] = entry;
      structuredLabs[key] = entry;
    } else {
      const delta = Math.abs(structuredLabs[key].value - entry.value);
      const scale = Math.max(Math.abs(structuredLabs[key].value), Math.abs(entry.value), 1);
      structuredLabs[key].discrepancy = delta / scale > 0.15;
      if (structuredLabs[key].discrepancy) {
        structuredLabs[key].noteValue = entry.value;
      }
    }
  }

  const labDiscrepancies = Object.entries(structuredLabs)
    .filter(([, v]) => v.discrepancy)
    .map(([k, v]) => ({ field: k, structured: v.value, noteValue: v.noteValue, severity: 'medium', message: `Discrepancy between structured lab and free-text note for ${k}.` }));

  return {
    labs: structuredLabs,
    noteOnlyLabs,
    labDiscrepancies,
    ambiguities: findAbbreviationUsage(allNotes.map(n => n.text).join(' ')),
    temporalAnomalies: detectTemporalAnomalies(allNotes),
    contradictions: detectContradictions(allNotes),
    noteCount: allNotes.length
  };
}

module.exports = { parsePatientRecord, parseLabsFromNote, findAbbreviationUsage, detectTemporalAnomalies, detectContradictions, ABBREVIATIONS, AMBIGUOUS_TERMS };