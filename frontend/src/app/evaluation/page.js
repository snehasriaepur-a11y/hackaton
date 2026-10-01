'use client';
import { useEffect, useState } from 'react';
import AppShell, { PageHead, PageFoot } from '../../components/AppShell';
import { Panel, Skeleton, Meter, Stat, Chip } from '../../components/ui';
import { SEVERITY_CHIP, fmtTimestamp } from '../../lib/format';
import api from '../../lib/api';

export default function Evaluation() {
  const [metrics, setMetrics] = useState(null);
  const [robust, setRobust] = useState(null);
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [tab, setTab] = useState('metrics');

  useEffect(() => {
    (async () => {
      try {
        const [m, r, a] = await Promise.all([
          api.get('/evaluation/metrics'),
          api.get('/evaluation/robustness'),
          api.get('/evaluation/audit?limit=60')
        ]);
        setMetrics(m);
        setRobust(r);
        setAudit(a.data);
      } catch (e) {
        setErr(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell>
      <PageHead
        eyebrow="Evaluation framework"
        title="Measured against a labelled gold set"
        lede="The engine is scored against pre-adjudicated pairs, tracked for false positives, and stress-tested against the adversarial scenarios that break naive matchers. Numbers below are computed at request time from the live engine."
        actions={
          <div style={{ display: 'flex', gap: 4, background: '#f2eeec', padding: 3, borderRadius: 7 }}>
            {['metrics', 'robustness', 'audit'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="btn btn-sm"
                style={
                  tab === t
                    ? { background: '#fff', color: 'var(--ink)', boxShadow: '0 1px 2px rgba(0,0,0,.06)' }
                    : { background: 'transparent', color: 'var(--ink-3)' }
                }
              >
                {t}
              </button>
            ))}
          </div>
        }
      />

      <div className="wrap" style={{ paddingBottom: 70 }}>
        {err ? (
          <div className="note note-crimson">Engine unreachable. Run <code className="mono">npm run dev</code> in <code className="mono">backend/</code>.</div>
        ) : loading ? (
          <Panel><Skeleton rows={8} height={40} /></Panel>
        ) : null}

        {!loading && !err && tab === 'metrics' && metrics ? <MetricsTab m={metrics} /> : null}
        {!loading && !err && tab === 'robustness' && robust ? <RobustnessTab r={robust} /> : null}
        {!loading && !err && tab === 'audit' && audit ? <AuditTab a={audit} /> : null}
      </div>
      <PageFoot />
    </AppShell>
  );
}

function MetricsTab({ m }) {
  const c = m.confusion;
  const total = c.tp + c.fp + c.tn + c.fn;
  const cell = (v, k, tone, note) => (
    <div style={{ padding: '15px 17px', borderLeft: '1px solid var(--line-2)' }}>
      <div className="stat-v num" style={{ fontSize: 26, color: tone }}>
        {v}
      </div>
      <div className="stat-k" style={{ fontSize: 10 }}>{k}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{note}</div>
    </div>
  );

  return (
    <div className="stack" style={{ gap: 22 }}>
      <Panel title="Screening performance" right={<span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{total} labelled pairs</span>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))', borderBottom: '1px solid var(--line-2)' }}>
          <div style={{ padding: '15px 17px' }}>
            <div className="stat-v num" style={{ fontSize: 26, color: 'var(--ok)' }}>{m.precision}%</div>
            <div className="stat-k" style={{ fontSize: 10 }}>Precision</div>
          </div>
          {cell(m.recall + '%', 'Recall', 'var(--ok)', 'of true eligible found')}
          {cell(m.f1, 'F1 score', 'var(--ink)', 'harmonic mean')}
          {cell(m.accuracy + '%', 'Accuracy', 'var(--ink)', 'all classes')}
          {cell(m.falsePositiveRate + '%', 'False positive rate', 'var(--crimson)', 'unsafe enrolments')}
        </div>
        <div style={{ paddingTop: 20 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="rule-label">Specificity — rejection of ineligible subjects</span>
            <span className="mono num" style={{ fontSize: 13, fontWeight: 650 }}>{m.specificity}%</span>
          </div>
          <Meter value={m.specificity} tone="var(--ok)" />
          <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--ink-2)' }}>
            In screening, a false positive enrols a subject who must then be withdrawn after protocol review — the
            expensive direction. The engine mitigates it by refusing to finalise eligibility while blocking evidence
            is outstanding, which pushes marginal cases into <Chip status="evidence_gap" small /> rather than
            into a confident yes.
          </p>
        </div>
      </Panel>

      <Panel title="Confusion matrix" bodyless>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--line-2)' }}>
          {cell(c.tp, 'True positive', 'var(--ok)', 'correctly eligible')}
          {cell(c.fp, 'False positive', 'var(--crimson)', 'wrongly eligible')}
          {cell(c.fn, 'False negative', 'var(--warn)', 'eligible, missed')}
          {cell(c.tn, 'True negative', 'var(--ink-3)', 'correctly rejected')}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="grid">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Pair</th>
                <th>Outcome</th>
                <th>Engine</th>
                <th>Gold label</th>
                <th style={{ width: '38%' }}>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {m.perCase
                .slice()
                .sort((a, b) => (a.outcome === 'true-negative' ? 1 : 0) - (b.outcome === 'true-negative' ? 1 : 0))
                .map((r, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ fontSize: 11.5 }}>
                      {r.patientId}/{r.trialId}
                    </td>
                    <td>
                      <span className={`chip ${r.outcome === 'true-positive' ? 'chip-eligible' : r.outcome === 'false-positive' ? 'chip-ineligible' : r.outcome === 'false-negative' ? 'chip-evidence_gap' : 'chip-neutral'}`}>
                        {r.outcome.replace(/-/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <Chip status={r.predicted} small />
                    </td>
                    <td className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{r.actual}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{r.note}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function RobustnessTab({ r }) {
  return (
    <div className="stack" style={{ gap: 22 }}>
      <Panel title="Adversarial scenarios" right={<span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{r.adversarialScenarios.length} classes</span>} bodyless>
        {r.adversarialScenarios.map((s, i) => (
          <div key={s.name} style={{ padding: '18px 20px', borderTop: i === 0 ? 0 : '1px solid var(--line-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 650 }}>{s.name}</h4>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {typeof s.occurrences === 'number' ? (
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                    {s.occurrences} in cohort
                  </span>
                ) : null}
                <span className="chip chip-eligible">{s.status}</span>
              </div>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>{s.description}</p>
            <div style={{ marginTop: 11, padding: '10px 13px', background: '#fbfaf9', border: '1px solid var(--line-2)', borderRadius: 7 }}>
              <span className="rule-label" style={{ color: 'var(--crimson)' }}>Mitigation</span>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--ink-2)' }}>{s.behaviour}</p>
            </div>
          </div>
        ))}
      </Panel>

      <Panel title="Status distribution across 30 evaluations" bodyless>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          {r.utilization.distribution.map((d, i) => (
            <Stat
              key={d.status}
              label={d.status.replace(/_/g, ' ')}
              value={d.count}
              sub={`${d.pct}% of all evaluations`}
              tone={d.status === 'eligible' ? 'var(--ok)' : d.status === 'ineligible' ? 'var(--crimson)' : d.status === 'evidence_gap' ? 'var(--warn)' : 'var(--info)'}
            />
          ))}
        </div>
      </Panel>

      <Panel title="Subject × protocol outcome matrix" bodyless>
        <div style={{ overflowX: 'auto', padding: '4px 0 6px' }}>
          <table className="grid" style={{ minWidth: 620 }}>
            <thead>
              <tr>
                <th>Subject</th>
                {r.statusMatrix.trials.map(t => (
                  <th key={t.id} style={{ textAlign: 'center' }}>
                    <span className="mono" style={{ fontSize: 10.5, letterSpacing: 0 }}>
                      {t.id.toUpperCase()}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.statusMatrix.patients.map((p, pi) => (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginLeft: 8 }}>{p.mrn}</span>
                  </td>
                  {r.statusMatrix.matrix[pi].map((s, si) => (
                    <td key={si} style={{ textAlign: 'center' }}>
                      <Chip status={s} small />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function AuditTab({ a }) {
  return (
    <Panel title="Decision log" right={<span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{a.length} entries, newest first</span>} bodyless>
      <div style={{ overflowX: 'auto' }}>
        <table className="grid" style={{ minWidth: 860 }}>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Protocol</th>
              <th>Verdict</th>
              <th style={{ textAlign: 'center' }}>Score</th>
              <th style={{ textAlign: 'center' }}>Confidence</th>
              <th style={{ textAlign: 'center' }}>Flags</th>
              <th>Reason</th>
              <th>Reviewer</th>
            </tr>
          </thead>
          <tbody>
            {a.map((e) => (
              <tr key={e.id}>
                <td>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{e.patientName}</span>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{e.mrn}</div>
                </td>
                <td>
                  <span className="mono" style={{ fontSize: 11 }}>{e.nctId}</span>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', maxWidth: 210 }}>{e.trialTitle.slice(0, 44)}…</div>
                </td>
                <td><Chip status={e.status} small /></td>
                <td className="num" style={{ textAlign: 'center', fontWeight: 620 }}>{e.score}%</td>
                <td style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-2)' }}>{e.confidence}</td>
                <td className="num" style={{ textAlign: 'center', color: e.adversarialCount ? 'var(--crimson)' : 'var(--ink-3)' }}>
                  {e.adversarialCount}
                </td>
                <td style={{ fontSize: 12.5, color: 'var(--ink-2)', maxWidth: 300 }}>{e.headline}</td>
                <td style={{ fontSize: 12.5, color: e.reviewedBy ? 'var(--ink-2)' : 'var(--ink-3)' }}>
                  {e.reviewedBy || 'pending'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}