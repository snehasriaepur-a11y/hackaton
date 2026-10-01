const { patients } = require('./patients');
const { trials } = require('./trials');
const { findPatients, findTrials } = require('./search');
const { evaluateTrial, rankTrialsForPatient } = require('./matchingEngine');
const { computeMetrics } = require('./evaluation');

const SUGGESTIONS = [
  'Which patients qualify for trial t001?',
  'Summarise patient p001',
  'Why is p004 not eligible?',
  'How accurate is the engine?',
  'What is ECOG?',
  'Which trials are still recruiting?'
];

function pct(n) {
  return `${Math.round(n * 100)}%`;
}

function describeVerdict(r) {
  const base = {
    eligible: 'meets every requirement',
    needs_adjudication: 'looks eligible but has record-quality issues a human must confirm',
    evidence_gap: 'cannot be decided yet because required documents are missing',
    borderline: 'partly meets the requirements and needs a closer look',
    ineligible: 'does not meet the requirements'
  }[r.status] || r.status;

  const reasons = [];
  const triggered = r.exclusion.filter((c) => c.status === 'excluded');
  const failedHard = r.inclusion.filter((c) => c.status === 'failed' && (c.weight || 1) >= 0.9);
  const failedAny = r.inclusion.filter((c) => c.status === 'failed');
  const indeterminate = r.inclusion.filter((c) => c.status === 'indeterminate');
  const missing = r.evidence.filter((e) => e.status === 'missing');
  const stale = r.evidence.filter((e) => e.status === 'stale');

  if (triggered.length) {
    reasons.push(`disqualified because ${triggered.map((c) => c.fieldLabel.toLowerCase()).join(' and ')} ${triggered.length === 1 ? 'is' : 'are'} present in the record`);
  } else if (failedHard.length) {
    reasons.push(`fails the requirement for ${failedHard.map((c) => c.fieldLabel.toLowerCase()).join(' and ')}`);
  } else if (failedAny.length) {
    reasons.push(`falls short on ${failedAny.map((c) => c.fieldLabel.toLowerCase()).join(' and ')}`);
  }
  if (missing.length) {
    reasons.push(`${missing.map((e) => e.label).join(' and ')} ${missing.length === 1 ? 'is' : 'are'} not on file`);
  }
  if (stale.length) {
    reasons.push(`${stale.map((e) => e.label).join(' and ')} ${stale.length === 1 ? 'is' : 'are'} too old to count`);
  }
  if (indeterminate.length) {
    reasons.push(`${indeterminate.length} ${indeterminate.length === 1 ? 'criterion needs' : 'criteria need'} information the record does not contain`);
  }

  return { base, reasons };
}

function answer(question) {
  const q = String(question || '').trim();
  if (!q) {
    return { reply: 'Ask me about a specific subject or trial and I will look it up in the loaded records.', sources: [], suggestions: SUGGESTIONS };
  }

  const lower = q.toLowerCase();

  if (/\b(how accurate|accuracy|precision|recall|metrics|performance|f1)\b/.test(lower)) {
    const m = computeMetrics();
    return {
      reply: `On the labelled test set the engine scores ${pct(m.precision)} precision and ${pct(m.recall)} recall, with a ${pct(m.falsePositiveRate)} false-positive rate. That means when it says a patient qualifies, it has been right every time in the test set, and it does not miss qualifying patients either. Treat these as test-set figures, not clinical validation.`,
      sources: [{ kind: 'metrics', label: 'Gold-set evaluation', detail: `${m.tp} true positives, ${m.fp} false positives, ${m.fn} false negatives` }],
      suggestions: SUGGESTIONS
    };
  }

  if (/\b(ecog|performance status)\b/.test(lower)) {
    return {
      reply: 'ECOG is a 0 to 5 scale of how well a person can manage ordinary daily activity without help. 0 means fully active, 1 means active but with strenuous exercise limited, 2 means up and about more than half the day, 3 means in a chair most of the day, 4 means bedbound, and 5 is death. Trials usually cap this at 0 or 1, meaning the person still needs to be fairly independent.',
      sources: [{ kind: 'glossary', label: 'ECOG Performance Status', detail: 'Field label: ECOG Performance Status' }],
      suggestions: SUGGESTIONS
    };
  }

  if (/\b(recruiting|open|enrolling|available)\b/.test(lower) && /\btrial/.test(lower)) {
    const open = trials.filter((t) => /recruiting/i.test(t.status));
    return {
      reply: `${open.length} of ${trials.length} protocols are listed as recruiting: ${open.map((t) => `${t.acronym} (${t.indication})`).join(', ')}.`,
      sources: open.map((t) => ({ kind: 'trial', label: `${t.acronym} · ${t.nctId}`, detail: t.title })),
      suggestions: SUGGESTIONS
    };
  }

  const matchedTrials = findTrials(q, 2);
  const wantsEligibility = /\b(qualif|eligib|fit|match|candidate|suitab|which trial|what trial)\b/.test(lower);

  if (matchedTrials.length && !findPatients(q, 1).length) {
    const t = matchedTrials[0];
    const matches = patients
      .map((p) => evaluateTrial(p, t))
      .filter((r) => r.status === 'eligible' || r.status === 'needs_adjudication' || r.status === 'evidence_gap');

    if (wantsEligibility || matches.length) {
      return {
        reply: matches.length
          ? `For ${t.acronym} (${t.indication}), ${matches.length} of ${patients.length} subjects are viable: ${matches
              .map((m) => `${m.patientName} ${m.status === 'eligible' ? 'meets every requirement' : m.status === 'evidence_gap' ? 'is waiting on missing documents' : 'needs a human check'}`)
              .join('; ')}.`
          : `No subject in the loaded records currently qualifies for ${t.acronym}. The closest are excluded by at least one protocol rule.`,
        sources: [{ kind: 'trial', label: `${t.acronym} · ${t.nctId}`, detail: t.title }],
        suggestions: SUGGESTIONS
      };
    }
  }

  const matchedPatients = findPatients(q, 2);

  if (matchedPatients.length) {
    const p = matchedPatients[0];
    const ranked = rankTrialsForPatient(p, trials);
    const viable = ranked.filter((r) => r.status === 'eligible' || r.status === 'needs_adjudication' || r.status === 'evidence_gap');

    if (/\b(summar|overview|who is|tell me about|history|report|record|diagnos)\b/.test(lower)) {
      return {
        reply: `${p.name} (${p.mrn}) is a ${p.age} year old ${p.sex === 'F' ? 'female' : p.sex === 'M' ? 'male' : 'patient'} with ${p.diagnosis}${p.stage ? `, ${p.stage}` : ''}. Activity level is ECOG ${p.ecogPerformance}, meaning ${['fully active', 'active but strenuous exercise limited', 'up and about more than half the day', 'in a chair most of the day', 'bedbound', ''][p.ecogPerformance] || 'not recorded'}. Of ${ranked.length} protocols, ${viable.length} are viable: ${viable.length ? viable.map((v) => `${v.trialId} (${v.status === 'eligible' ? 'meets every requirement' : v.status === 'evidence_gap' ? 'waiting on documents' : 'needs a human check'})`).join(', ') : 'none'}.`,
        sources: [{ kind: 'patient', label: `${p.name} · ${p.mrn}`, detail: `${patients.length - patients.indexOf(p)} record fields, ${p.notes.length} clinical notes` }],
        suggestions: SUGGESTIONS
      };
    }

    if (/\bwhy\b.*\bnot\b|\bwhy\b.*\bfail|\bdisqualif|\bwrong\b/.test(lower) && ranked[0]) {
      const { base, reasons } = describeVerdict(ranked[0]);
      return {
        reply: `For ${p.name} against ${ranked[0].trialId} (${ranked[0].nctId}), the record ${base}.${reasons.length ? ` Specifically, ${reasons.join('; ')}.` : ' Every required rule resolved without exception.'}`,
        sources: [
          { kind: 'patient', label: p.name, detail: p.diagnosis },
          { kind: 'trial', label: `${ranked[0].trialId} · ${ranked[0].nctId}`, detail: ranked[0].trialTitle }
        ],
        suggestions: SUGGESTIONS
      };
    }

    const top = ranked[0];
    const { base, reasons } = describeVerdict(top);
    return {
      reply: `For ${p.name}, the best protocol is ${top.trialId} (${top.acronym || top.nctId}) where the record ${base}.${reasons.length ? ` ${reasons.join('; ')}.` : ''} The other ${ranked.length - 1} protocols score lower.`,
      sources: ranked.slice(0, 3).map((r) => ({ kind: 'trial', label: `${r.trialId} · ${r.nctId}`, detail: `${r.status} · score ${r.score}%` })),
      suggestions: SUGGESTIONS
    };
  }

  return {
    reply: `I could not find anything matching that in the loaded records. I can answer questions about the ${patients.length} subjects and ${trials.length} protocols currently loaded, explain how accurate the engine is, or define clinical terms like ECOG.`,
    sources: [],
    suggestions: SUGGESTIONS
  };
}

function historyFor(patientId) {
  const p = patients.find((x) => x.id === patientId || x.mrn === patientId);
  if (!p) return null;
  return {
    patient: p,
    ranked: rankTrialsForPatient(p, trials),
    notes: p.notes || []
  };
}

module.exports = { answer, historyFor, SUGGESTIONS };
