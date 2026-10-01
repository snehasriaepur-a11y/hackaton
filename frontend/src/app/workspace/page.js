'use client';
import { useEffect, useMemo, useState } from 'react';
import AppShell, { PageHead, PageFoot } from '../../components/AppShell';
import MatchLattice from '../../components/MatchLattice';
import { Chip, CriterionRow, Meter, Panel, Skeleton, EmptyState } from '../../components/ui';
import { SEVERITY_CHIP, fmtDate } from '../../lib/format';
import api, { apiBase } from '../../lib/api';

export default function Workspace() {
  const [patients, setPatients] = useState([]);
  const [trials, setTrials] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiDown, setApiDown] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [ranked, setRanked] = useState([]);
  const [ranking, setRanking] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [trace, setTrace] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [p, t, o] = await Promise.all([api.get('/patients'), api.get('/trials'), api.get('/overview')]);
        if (!alive) return;
        setPatients(p.data);
        setTrials(t.data);
        setOverview(o);
      } catch (e) {
        if (alive) setApiDown(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const loadRank = async (id) => {
    setPatientId(id);
    setRanking(true);
    setTrace(null);
    try {
      const r = await api.post('/match/rank', { patientId: id });
      setRanked(r.data);
      const first = r.data.find(x => x.status !== 'ineligible') || r.data[0];
      if (first) setOpenId(first.trialId);
    } catch (e) {
      setApiDown(true);
    } finally {
      setRanking(false);
    }
  };

  const openTrace = async (r) => {
    setOpenId(r.trialId);
    setTrace(null);
    try {
      const failing = [...r.inclusion, ...r.exclusion].find(c => c.status === 'failed' || c.status === 'excluded' || c.status === 'indeterminate');
      const t = await api.post(`/criteria/${(failing || r.inclusion[0]).id}/explain`, {
        patientId: r.patientId,
        trialId: r.trialId
      });
      setTrace(t);
    } catch (e) {
      setTrace({ error: e.message });
    }
  };

  const selected = useMemo(() => patients.find(p => p.id === patientId) || null, [patients, patientId]);
  const openResult = useMemo(() => ranked.find(r => r.trialId === openId) || null, [ranked, openId]);

  return (
    <AppShell>
      <PageHead
        eyebrow="Matching workspace"
        title="Screen the cohort against open protocols"
        lede="Select a subject to rank every protocol. Each verdict expands into the criterion-level trace — the protocol clause, the record field, and the literal comparison that produced it."
      />

      <div className="wrap" style={{ paddingBottom: 70 }}>
        {apiDown ? (
          <div className="note note-crimson" style={{ marginBottom: 22 }}>
            <strong>Engine unreachable at {apiBase()}.</strong> Run{' '}
            <code className="mono" style={{ background: 'rgba(0,0,0,0.05)', padding: '1px 5px', borderRadius: 3 }}>
              npm run dev
            </code>{' '}
            from the project root, then reload.
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,290px) minmax(0,1fr)', gap: 24, alignItems: 'start' }} className="ws-grid">
          <Panel title="Subjects" bodyless>
            {loading ? (
              <div style={{ padding: 18 }}>
                <Skeleton rows={4} height={34} />
              </div>
            ) : (
              <div style={{ maxHeight: 560, overflowY: 'auto' }}>
                {patients.map((p) => {
                  const on = p.id === patientId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => loadRank(p.id)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '13px 18px',
                        border: 0,
                        borderTop: '1px solid var(--line-2)',
                        borderLeft: on ? '2px solid var(--crimson)' : '2px solid transparent',
                        background: on ? 'var(--crimson-50)' : 'transparent',
                        cursor: 'pointer',
                        font: 'inherit',
                        transition: 'background 130ms ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 650 }}>{p.name}</span>
                        <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{p.mrn}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 3 }}>{p.diagnosis}</div>
                      <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 4 }}>
                        {p.age}
                        {p.sex} · {p.stage} · ECOG {p.ecogPerformance}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>

          <div className="stack" style={{ gap: 22 }}>
            {overview ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  background: 'var(--surface)',
                  overflow: 'hidden'
                }}
              >
                {[
                  { k: 'Evaluations', v: overview.evaluations },
                  { k: 'Eligible', v: overview.byStatus.eligible || 0, c: 'var(--ok)' },
                  { k: 'Evidence gaps', v: overview.evidenceGaps, c: 'var(--warn)' },
                  { k: 'Indeterminate', v: overview.indeterminateCriteria, c: 'var(--info)' },
                  { k: 'Integrity flags', v: overview.adversarialFindings, c: 'var(--crimson)' }
                ].map((s, i) => (
                  <div key={s.k} style={{ padding: '15px 17px', borderLeft: i === 0 ? 0 : '1px solid var(--line-2)' }}>
                    <div className="stat-v num" style={{ fontSize: 24, color: s.c }}>
                      {s.v}
                    </div>
                    <div className="stat-k" style={{ fontSize: 10 }}>
                      {s.k}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {!selected ? (
              <Panel title="Protocol ranking" bodyless>
                <EmptyState
                  title="Select a subject"
                  body="Ranking evaluates the subject against all five protocols and returns a traceable verdict for each."
                />
              </Panel>
            ) : (
              <>
                <Panel
                  title={`Protocol ranking — ${selected.name}`}
                  right={
                    <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                      last visit {fmtDate(selected.lastVisit)} · {selected.notes.length} notes
                    </span>
                  }
                  bodyless
                >
                  {ranking ? (
                    <div style={{ padding: 18 }}>
                      <Skeleton rows={4} height={38} />
                    </div>
                  ) : (
                    <div>
                      {ranked.map((r, idx) => {
                        const on = r.trialId === openId;
                        return (
                          <div key={r.trialId} style={{ borderTop: idx === 0 ? 0 : '1px solid var(--line-2)' }}>
                            <button
                              onClick={() => openTrace(r)}
                              style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                padding: '15px 20px',
                                background: on ? '#fdfbfa' : 'transparent',
                                border: 0,
                                cursor: 'pointer',
                                font: 'inherit'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', gap: 20 }}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                                    <Chip status={r.status} />
                                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                                      {r.nctId}
                                    </span>
                                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{r.trialPhase}</span>
                                  </div>
                                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 7, lineHeight: 1.4 }}>{r.trialTitle}</div>
                                  <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                                    {r.headline}
                                  </p>
                                </div>
                                <div style={{ width: 116, flex: 'none', textAlign: 'right' }}>
                                  <div className="num" style={{ fontSize: 21, fontWeight: 620, letterSpacing: '-0.02em' }}>
                                    {r.score}%
                                  </div>
                                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginBottom: 6 }}>
                                    weighted inclusion
                                  </div>
                                  <Meter value={r.score} />
                                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 7 }}>
                                    {r.summary.inclusionPassed}/{r.summary.inclusionTotal} incl ·{' '}
                                    {r.summary.exclusionTriggered}/{r.summary.exclusionTotal} excl
                                  </div>
                                </div>
                              </div>
                            </button>

                            {on ? (
                              <div style={{ borderTop: '1px solid var(--line-2)', background: '#fdfcfb' }}>
                                <TracePanel result={r} trace={trace} />
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Panel>

                <Panel title="Full cohort matrix" bodyless>
                  <div style={{ padding: '4px 0 6px' }}>
                    <MatchLattice patients={patients} trials={trials} results={flatten(ranked)} selected={patientId} onSelect={loadRank} />
                  </div>
                </Panel>
              </>
            )}
          </div>
        </div>
      </div>
      <PageFoot />
    </AppShell>
  );
}

function flatten(ranked) {
  return ranked;
}

function TracePanel({ result, trace }) {
  const inc = result.inclusion;
  const exc = result.exclusion;
  const incFailed = inc.filter(c => c.status !== 'passed');
  const excTriggered = exc.filter(c => c.status === 'excluded');

  const section = (label, items, tone) =>
    items.length ? (
      <div style={{ padding: '14px 0' }}>
        <div className="rule-label" style={{ color: tone, marginBottom: 2 }}>
          {label} · {items.length}
        </div>
      </div>
    ) : null;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '14px 20px 0' }}>
        <span className="chip chip-neutral">
          inclusion {result.summary.inclusionPassed}/{result.summary.inclusionTotal}
        </span>
        <span className="chip chip-neutral">exclusion {result.summary.exclusionTriggered}/{result.summary.exclusionTotal}</span>
        <span className="chip chip-neutral">
          evidence {result.summary.evidencePresent}/{result.summary.evidenceTotal}
        </span>
        {result.summary.evidenceStale ? (
          <span className="chip chip-evidence_gap">{result.summary.evidenceStale} stale</span>
        ) : null}
        <span className="chip chip-neutral">confidence {result.confidence}</span>
      </div>

      {result.adversarial.findings.length ? (
        <div style={{ padding: '14px 20px 0' }}>
          <div className="advisory">
            <div style={{ flex: 'none', paddingTop: 1 }}>
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                <path d="M9 2.5L16 14.5H2L9 2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M9 7v3.2M9 12.3v.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <strong style={{ fontWeight: 650 }}>
                {result.adversarial.findings.length} record-integrity finding
                {result.adversarial.findings.length === 1 ? '' : 's'}
              </strong>
              <div className="stack" style={{ gap: 7, marginTop: 9 }}>
                {result.adversarial.findings.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span className={`chip ${SEVERITY_CHIP[f.severity] || 'chip-neutral'}`} style={{ fontSize: 9.5, padding: '2px 6px' }}>
                      {f.severity}
                    </span>
                    <span style={{ fontSize: 12.5 }}>
                      <strong style={{ fontWeight: 600 }}>{f.type.replace(/-/g, ' ')}</strong> — {f.detail}
                    </span>
                  </div>
                ))}
              </div>
              {result.adversarial.requiresAdjudication ? (
                <p style={{ margin: '11px 0 0', fontSize: 12.5, fontWeight: 600 }}>
                  Routed to human adjudication. Affected criteria are reported as indeterminate rather than resolved.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {trace && !trace.error ? (
        <div style={{ padding: '14px 20px 0' }}>
          <div className="note" style={{ background: '#fbfaf9' }}>
            <div className="rule-label" style={{ color: 'var(--crimson)', marginBottom: 8 }}>
              Provenance · {trace.criterion.id}
            </div>
            <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px', fontSize: 12.5 }}>
              <dt style={{ color: 'var(--ink-3)' }}>Protocol</dt>
              <dd style={{ margin: 0, fontWeight: 600 }} className="mono">
                {trace.provenance.nctId}
              </dd>
              <dt style={{ color: 'var(--ink-3)' }}>Record field</dt>
              <dd style={{ margin: 0 }} className="mono">
                {trace.provenance.patientField}
              </dd>
              <dt style={{ color: 'var(--ink-3)' }}>Extraction</dt>
              <dd style={{ margin: 0 }}>{trace.provenance.extractionMethod}</dd>
              <dt style={{ color: 'var(--ink-3)' }}>Outcome</dt>
              <dd style={{ margin: 0 }}>
                <Chip status={trace.criterion.status} small />
              </dd>
            </dl>
          </div>
        </div>
      ) : null}
      {trace && trace.error ? (
        <div style={{ padding: '14px 20px 0' }}>
          <div className="note note-warn">Trace unavailable: {trace.error}</div>
        </div>
      ) : null}

      <div style={{ padding: '16px 20px 4px' }}>
        {section('Inclusion not satisfied', incFailed, incFailed.some(c => c.status === 'failed') ? 'var(--crimson)' : 'var(--warn)')}
        {section('Exclusion triggered', excTriggered, 'var(--crimson)')}
      </div>

      {incFailed.length ? (
        <div style={{ borderTop: '1px solid var(--line-2)' }}>
          <div className="rule-label" style={{ padding: '13px 20px 0' }}>
            Inclusion criteria not satisfied
          </div>
          {incFailed.map(c => (
            <CriterionRow key={c.id} c={c} />
          ))}
        </div>
      ) : null}

      {excTriggered.length ? (
        <div style={{ borderTop: '1px solid var(--line-2)' }}>
          <div className="rule-label" style={{ padding: '13px 20px 0' }}>
            Exclusion criteria triggered
          </div>
          {excTriggered.map(c => (
            <CriterionRow key={c.id} c={c} />
          ))}
        </div>
      ) : null}

      {incFailed.length === 0 && excTriggered.length === 0 ? (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--line-2)' }}>
          <div className="rule-label" style={{ marginBottom: 4 }}>
            Every inclusion criterion satisfied
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>
            {result.summary.inclusionTotal} criteria resolved as passed with no exclusion triggered.
          </p>
        </div>
      ) : null}

      {result.evidence.filter(e => e.status !== 'present').length ? (
        <div style={{ borderTop: '1px solid var(--line-2)' }}>
          <div className="rule-label" style={{ padding: '13px 20px 8px' }}>
            Evidence ledger — outstanding
          </div>
          {result.evidence
            .filter(e => e.status !== 'present')
            .map(e => (
              <div key={e.key} className="crit">
                <span className="crit-icon" style={e.status === 'stale' ? { background: 'var(--warn-50)', color: 'var(--warn)' } : { background: '#f2eeec', color: 'var(--ink-3)' }}>
                  <svg width="9" height="9" viewBox="0 0 18 18" fill="none">
                    <path d="M9 5v5M9 12.4v.1" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
                  </svg>
                </span>
                <div style={{ minWidth: 0 }}>
                  <p className="crit-title">
                    {e.label}
                    <span style={{ marginLeft: 8 }}>
                      <span className={`chip ${e.status === 'stale' ? 'chip-evidence_gap' : 'chip-neutral'}`} style={{ fontSize: 9.5, padding: '2px 6px' }}>
                        {e.status === 'stale' ? 'stale' : 'missing'}
                      </span>
                    </span>
                    {e.blocking ? (
                      <span className="chip chip-ineligible" style={{ fontSize: 9.5, padding: '2px 6px', marginLeft: 5 }}>
                        blocking
                      </span>
                    ) : null}
                  </p>
                  <p className="crit-proto" style={{ fontStyle: 'normal' }}>{e.message}</p>
                </div>
              </div>
            ))}
        </div>
      ) : null}
    </div>
  );
}