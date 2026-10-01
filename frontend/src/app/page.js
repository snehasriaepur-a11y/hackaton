import Link from 'next/link';
import HeroCanvas from '../components/HeroCanvas';

const PIPELINE = [
  { n: '01', t: 'Ingest', d: 'Structured EHR components and free-text notes are normalised into a single de-identified schema. Free text is parsed for lab values, negations and temporal markers.' },
  { n: '02', t: 'Parse', d: 'Clinical notes are scanned for ambiguous abbreviations, contradictory assertions and duplicate encounter dates before any criterion is evaluated.' },
  { n: '03', t: 'Evaluate', d: 'Each protocol clause is matched deterministically against a named record field. Every outcome carries the field path and the literal comparison performed.' },
  { n: '04', t: 'Reconcile', d: 'Blocking requirements are reconciled against the evidence ledger. Outstanding items become an explicit procurement request rather than a silent failure.' },
  { n: '05', t: 'Adjudicate', d: 'Record-integrity findings escalate the case to a human coordinator. The engine never resolves a contradiction on its own.' }
];

const PROBLEMS = [
  {
    t: 'Substring negation',
    d: '"Non-Small Cell Lung Cancer" contains the literal string "Small Cell". Naive matching enrols the wrong histology into a small-cell protocol.',
    fix: 'Negation-aware phrase matching with boundary and prefix guards.'
  },
  {
    t: 'Absolute vs normalised labs',
    d: 'A transaminase of 32 U/L exceeds a literal threshold of "3" while sitting at 0.8 × ULN. Absolute comparison inverts the clinical answer.',
    fix: 'Derived ULN-normalised values, computed from a reference table, never hand-entered.'
  },
  {
    t: 'Absent ≠ negative',
    d: 'A record with no prior checkpoint inhibitor is not the same as a record that omits the field. One is a positive finding, the other is unknown.',
    fix: 'Field-presence is tracked separately from field-emptiness.'
  },
  {
    t: 'Class vs instance therapy',
    d: 'The chart lists "Pembrolizumab 200mg". The protocol excludes the class "Checkpoint Inhibitor". Literal matching finds nothing.',
    fix: 'Therapy classes are expanded from agent names before criterion evaluation.'
  },
  {
    t: 'Stale but present',
    d: 'A pathology report exists but predates the protocol evidence window. It satisfies presence and fails currency.',
    fix: 'Every requirement carries a validity window; age is computed against last visit.'
  },
  {
    t: 'Silent hallucination',
    d: 'Free-form generation can produce a justification no one can trace back to the chart, which is indefensible in a screening decision.',
    fix: 'The decision path is extractive. Justifications quote the field and the comparison.'
  }
];

const GUARANTEES = [
  { t: 'Every verdict is traceable', d: 'Select any criterion to reveal the record field, the protocol clause and the literal comparison that produced it.' },
  { t: 'Nothing is inferred silently', d: 'Unresolvable criteria return indeterminate. The system reports its own uncertainty instead of guessing.' },
  { t: 'Humans hold the pen', d: 'Contradictory records and integrity flags route to coordinator adjudication before enrolment.' },
  { t: 'Minimal exposure', d: 'Synthetic de-identified records only. No PHI leaves the boundary, and every request is logged.' }
];

export default function Landing() {
  return (
    <div>
      <section style={{ position: 'relative', borderBottom: '1px solid var(--line)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.85 }}>
          <HeroCanvas />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(100deg, var(--paper) 34%, rgba(253,252,251,0.72) 58%, rgba(253,252,251,0.15) 100%)'
          }}
        />
        <div className="wrap" style={{ position: 'relative', paddingTop: 108, paddingBottom: 116 }}>
          <div style={{ maxWidth: 610 }}>
            <div className="rule-label" style={{ color: 'var(--crimson)' }}>
              Deterministic matching engine · Level 1–4
            </div>
            <h1
              className="serif"
              style={{
                fontSize: 'clamp(38px, 5.4vw, 62px)',
                lineHeight: 1.04,
                letterSpacing: '-0.028em',
                fontWeight: 500,
                margin: '20px 0 0'
              }}
            >
              Trial eligibility,
              <br />
              decided on the record.
            </h1>
            <p style={{ fontSize: 17.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '26px 0 0', maxWidth: 520 }}>
              CTEM matches de-identified patient records against dense protocol criteria and returns a
              justification for every decision — the field read, the comparison made, and the evidence still
              outstanding. No black box between the chart and the verdict.
            </p>
            <div style={{ display: 'flex', gap: 11, marginTop: 34, flexWrap: 'wrap' }}>
              <Link href="/workspace" className="btn btn-primary">
                Open the workspace
              </Link>
              <a href="#adversarial" className="btn btn-ghost">
                How it handles bad records
              </a>
            </div>
            <p className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 26 }}>
              6 synthetic subjects · 5 protocols · 30 evaluations · 0 generated justifications
            </p>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 84, paddingBottom: 8 }}>
        <p className="rule-label">The pipeline</p>
        <h2 className="serif" style={{ fontSize: 34, letterSpacing: '-0.02em', fontWeight: 500, margin: '14px 0 0' }}>
          Five stages, each auditable
        </h2>
      </section>
      <section className="wrap" style={{ paddingBottom: 92 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(216px, 1fr))',
            gap: 0,
            border: '1px solid var(--line)',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'var(--surface)',
            marginTop: 34
          }}
        >
          {PIPELINE.map((s, i) => (
            <div
              key={s.n}
              style={{
                padding: '24px 22px 28px',
                borderLeft: i === 0 ? '0' : '1px solid var(--line-2)',
                borderTop: i > 2 ? '1px solid var(--line-2)' : '0'
              }}
            >
              <div className="mono" style={{ fontSize: 11, color: 'var(--crimson)', fontWeight: 600, letterSpacing: '0.08em' }}>
                {s.n}
              </div>
              <h3 style={{ margin: '11px 0 0', fontSize: 15.5, fontWeight: 650 }}>{s.t}</h3>
              <p style={{ margin: '9px 0 0', fontSize: 13.5, lineHeight: 1.62, color: 'var(--ink-2)' }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="adversarial" style={{ borderTop: '1px solid var(--line)', background: '#fbf9f8', paddingTop: 84, paddingBottom: 92 }}>
        <div className="wrap">
          <div style={{ maxWidth: 640 }}>
            <p className="rule-label">Adversarial resilience</p>
            <h2 className="serif" style={{ fontSize: 34, letterSpacing: '-0.02em', fontWeight: 500, margin: '14px 0 0' }}>
              Six ways a naive matcher breaks
            </h2>
            <p style={{ fontSize: 16.5, lineHeight: 1.62, color: 'var(--ink-2)', margin: '18px 0 0' }}>
              Each row below is a real class of defect that produces a confidently wrong answer. The engine
              carries an explicit defence for all six, and the evaluation suite measures that the defences hold.
            </p>
          </div>

          <div style={{ marginTop: 38, border: '1px solid var(--line)', borderRadius: 12, background: 'var(--surface)', overflow: 'hidden' }}>
            {PROBLEMS.map((p, i) => (
              <div
                key={p.t}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,1.1fr) minmax(0,0.85fr)',
                  gap: 26,
                  padding: '22px 24px',
                  borderTop: i === 0 ? '0' : '1px solid var(--line-2)',
                  alignItems: 'start'
                }}
                className="prob-row"
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 650 }}>{p.t}</h4>
                  <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>{p.d}</p>
                </div>
                <div>
                  <div className="rule-label" style={{ color: 'var(--crimson)', marginBottom: 7 }}>Symptom</div>
                  <p className="mono" style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.65 }}>
                    {p.t === 'Substring negation' && 'includes("Small Cell") → true on "Non-Small Cell Lung Cancer"'}
                    {p.t === 'Absolute vs normalised labs' && '32 U/L > 3 → exclusion triggered at 0.8 × ULN'}
                    {p.t === 'Absent ≠ negative' && '[] treated as "no data" instead of "no exposure"'}
                    {p.t === 'Class vs instance therapy' && 'includes("Checkpoint Inhibitor") → false on "Pembrolizumab"'}
                    {p.t === 'Stale but present' && 'present = true, age = 411d, window = 120d'}
                    {p.t === 'Silent hallucination' && 'justification with no resolvable source field'}
                  </p>
                </div>
                <div>
                  <div className="rule-label" style={{ marginBottom: 7 }}>Defence</div>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>{p.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 84, paddingBottom: 92 }}>
        <div style={{ maxWidth: 620 }}>
          <p className="rule-label">Safety posture</p>
          <h2 className="serif" style={{ fontSize: 34, letterSpacing: '-0.02em', fontWeight: 500, margin: '14px 0 0' }}>
            What the system will not do
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(272px, 1fr))', gap: 22, marginTop: 36 }}>
          {GUARANTEES.map((g) => (
            <div key={g.t}>
              <div style={{ width: 22, height: 2, background: 'var(--crimson)', marginBottom: 16 }} />
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 650 }}>{g.t}</h4>
              <p style={{ margin: '9px 0 0', fontSize: 13.5, lineHeight: 1.62, color: 'var(--ink-2)' }}>{g.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ borderTop: '1px solid var(--line)', background: 'var(--crimson)', color: '#fff' }}>
        <div className="wrap" style={{ paddingTop: 68, paddingBottom: 68, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 520 }}>
            <h2 className="serif" style={{ fontSize: 30, fontWeight: 500, margin: 0, letterSpacing: '-0.018em' }}>
              Run it against the synthetic cohort
            </h2>
            <p style={{ margin: '13px 0 0', fontSize: 15.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.86)' }}>
              Six subjects, five protocols, one matrix. Every cell opens into the criterion-level trace
              behind the decision.
            </p>
          </div>
          <Link
            href="/workspace"
            className="btn"
            style={{ background: '#fff', color: 'var(--crimson)', padding: '12px 24px', fontSize: 14.5 }}
          >
            Launch workspace
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--line)' }}>
        <div className="wrap" style={{ paddingTop: 30, paddingBottom: 34, display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <b className="serif" style={{ fontSize: 15 }}>CTEM</b>
            <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>PNH2 · Clinical Trial Eligibility Matcher</span>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 12.5, color: 'var(--ink-3)' }}>
            <Link href="/workspace" style={{ color: 'inherit', textDecoration: 'none' }}>Workspace</Link>
            <Link href="/evaluation" style={{ color: 'inherit', textDecoration: 'none' }}>Evaluation</Link>
            <Link href="/architecture" style={{ color: 'inherit', textDecoration: 'none' }}>Architecture</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}