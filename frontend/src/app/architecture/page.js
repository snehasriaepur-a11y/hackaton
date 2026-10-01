import AppShell, { PageHead, PageFoot } from '../../components/AppShell';

const SRS = [
  ['FR-1', 'Ingest structured EHR components and free-text notes into a unified de-identified schema', 'Must', 'nlp.js / patients.js'],
  ['FR-2', 'Parse free text for laboratory values, negation cues and temporal markers', 'Must', 'nlp.js'],
  ['FR-3', 'Evaluate every protocol clause deterministically against a named record field', 'Must', 'matchingEngine.js'],
  ['FR-4', 'Return a traceable justification for each clause — field path, comparison, outcome', 'Must', '/criteria/:id/explain'],
  ['FR-5', 'Reconcile blocking evidence requirements against an evidence ledger with validity windows', 'Must', 'matchingEngine.js'],
  ['FR-6', 'Produce an itemised evidence request rather than failing silently', 'Must', 'evaluateEvidence()'],
  ['FR-7', 'Escalate contradictory or integrity-flagged records to human adjudication', 'Must', 'assessAdversarial()'],
  ['FR-8', 'Rank all protocols for a subject in a single pass', 'Should', 'rankTrialsForPatient()'],
  ['FR-9', 'Score the engine against a labelled gold set and track false positive rate', 'Must', 'evaluation.js'],
  ['FR-10', 'Record every decision with reviewer sign-off in an immutable log', 'Should', '/evaluation/audit']
];

const NFR = [
  ['NFR-1', 'Safety', 'No generated text in the decision path. Justifications are extractive and quote source fields.'],
  ['NFR-2', 'Traceability', 'Any verdict resolves to a protocol clause, a record field and a literal comparison.'],
  ['NFR-3', 'Privacy', 'Synthetic de-identified records only. PHI never enters this environment.'],
  ['NFR-4', 'Determinism', 'Same inputs produce the same verdict. No sampling, no external model call, no drift.'],
  ['NFR-5', 'Explainability of uncertainty', 'Unresolvable criteria return indeterminate rather than a guessed value.'],
  ['NFR-6', 'Latency', 'Full 30-cell cohort matrix evaluates synchronously in under 50 ms.']
];

const STACK = [
  ['Frontend', 'Next.js 14 App Router, React 18, Tailwind, raw WebGL (three.js) with graceful fallback'],
  ['Backend', 'Node.js + Express 4, helmet, CORS, request logging middleware'],
  ['Engine', 'Deterministic criterion evaluator, negation-aware matcher, ULN derivation, evidence ledger'],
  ['Evaluation', 'Labelled gold set, confusion matrix, FPR/F1 tracking, robustness profile'],
  ['Deployment', 'Vercel (frontend, static) + any Node host (API); Docker and Compose for containerised deploy']
];

export default function Architecture() {
  return (
    <AppShell>
      <PageHead
        eyebrow="Level 1 · Specification"
        title="Software requirements and system design"
        lede="The requirements below map directly to the five feature areas in the problem statement. Each row names the module that satisfies it, so the specification and the running code stay in step."
      />

      <div className="wrap" style={{ paddingBottom: 70 }}>
        <div className="stack" style={{ gap: 22 }}>
          <Section title="Architecture and data flow">
            <FlowDiagram />
          </Section>

          <Section title="Functional requirements">
            <Table head={['ID', 'Requirement', 'Priority', 'Satisfied by']} rows={SRS} />
          </Section>

          <Section title="Non-functional requirements">
            <Table head={['ID', 'Class', 'Statement']} rows={NFR} />
          </Section>

          <Section title="Technology stack">
            <Table head={['Layer', 'Selection']} rows={STACK} wide />
          </Section>

          <Section title="Clinical decision logic">
            <DecisionLogic />
          </Section>

          <Section title="Roadmap">
            <Roadmap />
          </Section>
        </div>
      </div>
      <PageFoot />
    </AppShell>
  );
}

function Section({ title, children }) {
  return (
    <section className="panel">
      <header className="panel-head">
        <h3>{title}</h3>
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}

function Table({ head, rows, wide }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="grid" style={{ minWidth: wide ? 0 : 560 }}>
        <thead>
          <tr>{head.map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              <td className="mono" style={{ fontSize: 11.5, color: 'var(--crimson)', fontWeight: 600, whiteSpace: 'nowrap' }}>{r[0]}</td>
              {r.slice(1).map((c, i) => (
                <td key={i} style={{ fontSize: 13, color: i === 0 && r.length === 4 ? 'var(--ink)' : 'var(--ink-2)' }}>
                  {r.length === 3 ? (
                    <span>
                      <strong style={{ fontWeight: 600, color: 'var(--ink)' }}>{c.split('.')[0]}.</strong>
                      {c.slice(c.indexOf('.') + 1)}
                    </span>
                  ) : r.length === 2 ? (
                    <span>
                      <strong style={{ fontWeight: 600, color: 'var(--ink)' }}>{c.split('.')[0]}.</strong>
                      {c.slice(c.indexOf('.') + 1)}
                    </span>
                  ) : (
                    c
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FlowDiagram() {
  const stages = [
    { t: 'Source systems', d: 'FHIR/HL7 components · consultation notes · imaging reports · lab feeds', tone: 'var(--ink-3)' },
    { t: 'De-identification', d: 'Token substitution · date shifting · subject keys replace identity', tone: 'var(--ink-2)' },
    { t: 'Ingest & parse', d: 'Schema normalisation · lab extraction · negation detection · temporal scan', tone: 'var(--crimson)' },
    { t: 'Integrity gate', d: 'Abbreviation ambiguity · duplicate dates · code/narrative conflicts', tone: 'var(--warn)' },
    { t: 'Criterion evaluation', d: 'Negation-aware matching · ULN derivation · therapy class expansion', tone: 'var(--crimson)' },
    { t: 'Evidence ledger', d: 'Presence · currency against window · blocking vs advisory', tone: 'var(--warn)' },
    { t: 'Verdict', d: 'eligible · evidence_gap · borderline · needs_adjudication · ineligible', tone: 'var(--ok)' },
    { t: 'Audit + adjudication', d: 'Immutable log · reviewer sign-off · re-evaluation on new evidence', tone: 'var(--ink-2)' }
  ];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(178px, 1fr))', gap: 1, background: 'var(--line-2)', border: '1px solid var(--line)', borderRadius: 9, overflow: 'hidden' }}>
        {stages.map((s, i) => (
          <div key={s.t} style={{ background: 'var(--surface)', padding: '16px 15px' }}>
            <div className="mono" style={{ fontSize: 10, color: s.tone, fontWeight: 650, letterSpacing: '0.1em' }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <h4 style={{ margin: '9px 0 0', fontSize: 13.5, fontWeight: 650, lineHeight: 1.35 }}>{s.t}</h4>
            <p style={{ margin: '7px 0 0', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.55 }}>{s.d}</p>
          </div>
        ))}
      </div>
      <p className="mono" style={{ marginTop: 16, fontSize: 11.5, color: 'var(--ink-3)' }}>
        POST /api/match → evaluateTrial() → { '{' } inclusion[], exclusion[], evidence[], adversarial, verdict { '}' }
      </p>
    </div>
  );
}

function DecisionLogic() {
  const rules = [
    { when: 'Any exclusion criterion triggered', then: 'ineligible', tone: 'var(--crimson)', why: 'Exclusions are absolute. Nothing else is evaluated.' },
    { when: 'Any inclusion criterion with weight ≥ 0.9 fails', then: 'ineligible', tone: 'var(--crimson)', why: 'Protocol-defining clause. Requesting further workup would be wasteful and misleading.' },
    { when: 'Any blocking evidence requirement outstanding', then: 'evidence_gap', tone: 'var(--warn)', why: 'Eligibility cannot be finalised. An itemised request is produced instead.' },
    { when: 'All inclusion resolved and weighted rate ≥ 85%', then: 'eligible', tone: 'var(--ok)', why: 'Full satisfaction with no outstanding requirement.' },
    { when: 'Weighted inclusion rate ≥ 50% with indeterminates', then: 'borderline', tone: 'var(--info)', why: 'Partial or unresolved criteria route to coordinator review.' },
    { when: 'Eligible, but integrity findings at high severity', then: 'needs_adjudication', tone: '#55399a', why: 'Human sign-off required before enrolment.' }
  ];
  return (
    <div style={{ border: '1px solid var(--line-2)', borderRadius: 9, overflow: 'hidden' }}>
      {rules.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1.15fr)', gap: 18, padding: '15px 17px', background: 'var(--surface)', borderTop: i === 0 ? 0 : '1px solid var(--line-2)', alignItems: 'start' }}>
          <span style={{ fontSize: 13 }}>{r.when}</span>
          <span className="chip" style={{ background: 'transparent', borderColor: r.tone, color: r.tone }}>
            {r.then}
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>{r.why}</span>
        </div>
      ))}
    </div>
  );
}

function Roadmap() {
  const phases = [
    { p: 'Level 1', t: 'Idea, architecture, planning', d: 'SRS, data-flow specification, decision logic, wireframes, stack selection.', done: true },
    { p: 'Level 2', t: 'Core functionality', d: 'Matching engine, evidence ledger, integrity checks, workspace, protocol registry, cohort view.', done: true },
    { p: 'Level 3', t: 'Intelligence and security', d: 'Gold-set evaluation harness, adjudication workflow, audit log, auth, TLS, CI pipeline, container deploy.', done: true },
    { p: 'Level 4', t: 'Scale and reliability', d: 'Database persistence, result caching, rate limiting, container orchestration, monitoring dashboards and alerting.', done: false }
  ];
  return (
    <div style={{ border: '1px solid var(--line-2)', borderRadius: 9, overflow: 'hidden' }}>
      {phases.map((p, i) => (
        <div key={p.p} style={{ display: 'flex', gap: 18, padding: '16px 18px', background: 'var(--surface)', borderTop: i === 0 ? 0 : '1px solid var(--line-2)', alignItems: 'flex-start' }}>
          <span className="mono" style={{ fontSize: 11, fontWeight: 650, color: p.done ? 'var(--ok)' : 'var(--ink-3)', flex: 'none', width: 62 }}>{p.p}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 650 }}>{p.t}</h4>
            <p style={{ margin: '5px 0 0', fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>{p.d}</p>
          </div>
          <span className={`chip ${p.done ? 'chip-eligible' : 'chip-neutral'}`}>{p.done ? 'delivered' : 'planned'}</span>
        </div>
      ))}
    </div>
  );
}