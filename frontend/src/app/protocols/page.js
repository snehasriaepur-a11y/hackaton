'use client';
import { useEffect, useState } from 'react';
import AppShell, { PageHead, PageFoot } from '../../components/AppShell';
import { Panel, Skeleton, EmptyState } from '../../components/ui';
import api from '../../lib/api';

export default function Protocols() {
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    api
      .get('/trials')
      .then(r => setTrials(r.data))
      .catch(() => setErr(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <PageHead
        eyebrow="Protocol registry"
        title="Five open protocols, clause by clause"
        lede="Each protocol is stored as a structured criterion set with weights, an evidence ledger and a validity window — not free-text prose. This is the contract the engine evaluates against."
      />
      <div className="wrap" style={{ paddingBottom: 70 }}>
        {err ? <div className="note note-crimson" style={{ marginBottom: 20 }}>Engine unreachable. Run <code className="mono">npm run dev</code> in <code className="mono">backend/</code>.</div> : null}
        {loading ? (
          <Panel><Skeleton rows={6} height={44} /></Panel>
        ) : trials.length === 0 ? (
          <Panel><EmptyState title="No protocols loaded" body="Start the engine to populate the registry." /></Panel>
        ) : (
          <div className="stack" style={{ gap: 16 }}>
            {trials.map((t) => {
              const on = open === t.id;
              return (
                <Panel
                  key={t.id}
                  title={t.acronym}
                  right={
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="chip chip-neutral">{t.phase}</span>
                      <span className="chip chip-evidence_gap">{t.status}</span>
                    </div>
                  }
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0, flex: '1 1 380px' }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 620, lineHeight: 1.4 }}>{t.title}</h3>
                      <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>{t.sponsor}</p>
                      <div className="mono" style={{ marginTop: 14, fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                        <span>{t.nctId}</span>
                        <span>{t.indication}</span>
                        <span>{t.sites} sites</span>
                        <span>n={t.targetEnrollment}</span>
                        <span>window {t.evidenceWindowDays}d</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 22, flex: 'none' }}>
                      <Figure v={t.inclusionCriteria.length} k="inclusion" c="var(--ok)" />
                      <Figure v={t.exclusionCriteria.length} k="exclusion" c="var(--crimson)" />
                      <Figure v={t.requiredEvidence.length} k="evidence" c="var(--warn)" />
                    </div>
                  </div>

                  <button onClick={() => setOpen(on ? null : t.id)} className="btn btn-ghost btn-sm" style={{ marginTop: 20 }}>
                    {on ? 'Hide clauses' : `Show ${t.inclusionCriteria.length + t.exclusionCriteria.length} clauses`}
                  </button>

                  {on ? (
                    <div style={{ marginTop: 20, borderTop: '1px solid var(--line-2)' }}>
                      <div className="cols-2" style={{ marginTop: 14 }}>
                        <div style={{ paddingRight: 20 }}>
                          <div className="rule-label" style={{ color: 'var(--ok)' }}>Inclusion</div>
                          {t.inclusionCriteria.map(c => (
                            <div key={c.id} style={{ padding: '11px 0', borderTop: '1px solid var(--line-2)' }}>
                              <div style={{ display: 'flex', gap: 9, alignItems: 'baseline' }}>
                                <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{c.id}</span>
                                <span style={{ fontSize: 13 }}>{c.text}</span>
                              </div>
                              <div className="mono" style={{ marginTop: 5, fontSize: 11, color: 'var(--ink-3)' }}>
                                {c.field} {c.operator} {JSON.stringify(c.value)} · w={c.weight}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ paddingLeft: 20, borderLeft: '1px solid var(--line-2)' }}>
                          <div className="rule-label" style={{ color: 'var(--crimson)' }}>Exclusion</div>
                          {t.exclusionCriteria.map(c => (
                            <div key={c.id} style={{ padding: '11px 0', borderTop: '1px solid var(--line-2)' }}>
                              <div style={{ display: 'flex', gap: 9, alignItems: 'baseline' }}>
                                <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{c.id}</span>
                                <span style={{ fontSize: 13 }}>{c.text}</span>
                              </div>
                              <div className="mono" style={{ marginTop: 5, fontSize: 11, color: 'var(--ink-3)' }}>
                                {c.field} {c.operator} {JSON.stringify(c.value)} · w={c.weight}
                              </div>
                            </div>
                          ))}
                          <div style={{ marginTop: 18 }}>
                            <div className="rule-label">Evidence ledger</div>
                            {t.requiredEvidence.map(e => (
                              <div key={e.key} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '7px 0', borderTop: '1px solid var(--line-2)' }}>
                                <span style={{ fontSize: 13, flex: 1 }}>{e.label}</span>
                                <span className="chip chip-neutral" style={{ fontSize: 9.5, padding: '2px 6px' }}>{e.category}</span>
                                {e.blocking ? (
                                  <span className="chip chip-ineligible" style={{ fontSize: 9.5, padding: '2px 6px' }}>blocking</span>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </Panel>
              );
            })}
          </div>
        )}
      </div>
      <PageFoot />
    </AppShell>
  );
}

function Figure({ v, k, c }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="stat-v num" style={{ fontSize: 26, color: c }}>
        {v}
      </div>
      <div className="stat-k" style={{ fontSize: 10 }}>
        {k}
      </div>
    </div>
  );
}