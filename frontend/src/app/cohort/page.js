'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell, { PageHead, PageFoot } from '../../components/AppShell';
import { Panel, Skeleton, EmptyState } from '../../components/ui';
import { fmtDate, sexLabel } from '../../lib/format';
import api from '../../lib/api';

export default function Cohort() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    api
      .get('/patients')
      .then(r => setPatients(r.data))
      .catch(() => setErr(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <PageHead
        eyebrow="De-identified cohort"
        title="Six synthetic subjects, fully inspectable"
        lede="Every record is a synthetic de-identified construct. Notes carry deliberate defects — duplicate encounter dates, ambiguous abbreviations, legacy classification codes — so the parsing and integrity layers have something real to catch."
      />
      <div className="wrap" style={{ paddingBottom: 70 }}>
        {err ? <div className="note note-crimson" style={{ marginBottom: 20 }}>Engine unreachable. Run <code className="mono">npm run dev</code> in <code className="mono">backend/</code>.</div> : null}
        {loading ? (
          <Panel><Skeleton rows={5} height={52} /></Panel>
        ) : (
          <div className="stack" style={{ gap: 16 }}>
            {patients.map((p) => {
              const on = open === p.id;
              return (
                <Panel
                  key={p.id}
                  title={p.name}
                  right={
                    <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                      {p.mrn}
                    </span>
                  }
                >
                  <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 18px', fontSize: 13, flex: '1 1 300px' }}>
                      <dt style={{ color: 'var(--ink-3)' }}>Diagnosis</dt>
                      <dd style={{ margin: 0, fontWeight: 600 }}>{p.diagnosis}</dd>
                      <dt style={{ color: 'var(--ink-3)' }}>Histology</dt>
                      <dd style={{ margin: 0 }}>{p.histology}</dd>
                      <dt style={{ color: 'var(--ink-3)' }}>Stage</dt>
                      <dd style={{ margin: 0 }}>{p.stage} · ECOG {p.ecogPerformance}</dd>
                      <dt style={{ color: 'var(--ink-3)' }}>Demographics</dt>
                      <dd style={{ margin: 0 }}>
                        {p.age} {sexLabel(p.sex)} · {p.race}
                      </dd>
                      <dt style={{ color: 'var(--ink-3)' }}>Diagnosed</dt>
                      <dd style={{ margin: 0 }} className="mono">{fmtDate(p.dateOfDiagnosis)}</dd>
                      <dt style={{ color: 'var(--ink-3)' }}>Last visit</dt>
                      <dd style={{ margin: 0 }} className="mono">{fmtDate(p.lastVisit)}</dd>
                    </dl>

                    <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                      <div className="rule-label" style={{ marginBottom: 8 }}>
                        Key laboratory values
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))', gap: 10 }}>
                        {Object.entries(p.labs).slice(0, 8).map(([k, v]) => (
                          <div key={k}>
                            <div className="num" style={{ fontSize: 15, fontWeight: 620 }}>
                              {v}
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{k}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {p.adversarialFlags.length ? (
                    <div style={{ marginTop: 18, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {p.adversarialFlags.map(f => (
                        <span key={f} className="chip chip-evidence_gap">
                          {f.replace(/-/g, ' ')}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                    <button onClick={() => setOpen(on ? null : p.id)} className="btn btn-ghost btn-sm">
                      {on ? 'Hide record' : `Show record (${p.notes.length} notes)`}
                    </button>
                    <Link href="/workspace" className="btn btn-primary btn-sm">
                      Screen against protocols
                    </Link>
                  </div>

                  {on ? (
                    <div style={{ marginTop: 22, borderTop: '1px solid var(--line-2)' }}>
                      {p.parse && p.parse.ambiguities.length ? (
                        <div style={{ padding: '16px 0', borderBottom: '1px solid var(--line-2)' }}>
                          <div className="rule-label" style={{ color: 'var(--warn)' }}>
                            Ambiguous abbreviations detected in free text
                          </div>
                          {p.parse.ambiguities.map((a, i) => (
                            <p key={i} style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink-2)' }}>
                              <strong className="mono">{a.abbreviation}</strong> — {a.ambiguousMeaning}
                            </p>
                          ))}
                        </div>
                      ) : null}

                      {p.parse && p.parse.temporalAnomalies.length ? (
                        <div style={{ padding: '16px 0', borderBottom: '1px solid var(--line-2)' }}>
                          <div className="rule-label" style={{ color: 'var(--crimson)' }}>
                            Temporal anomalies
                          </div>
                          {p.parse.temporalAnomalies.map((a, i) => (
                            <p key={i} style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink-2)' }}>
                              {a.message}
                            </p>
                          ))}
                        </div>
                      ) : null}

                      <div style={{ paddingTop: 16 }}>
                        <div className="rule-label">Clinical notes</div>
                        {p.notes.map(n => (
                          <div key={n.id} style={{ padding: '14px 0', borderTop: '1px solid var(--line-2)' }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                              <span className="mono" style={{ fontSize: 11, color: 'var(--crimson)' }}>{n.date}</span>
                              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{n.author}</span>
                              <span className="chip chip-neutral" style={{ fontSize: 9.5, padding: '2px 6px' }}>{n.type}</span>
                            </div>
                            <p style={{ margin: '7px 0 0', fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>{n.text}</p>
                          </div>
                        ))}
                      </div>

                      <div style={{ paddingTop: 16, borderTop: '1px solid var(--line-2)' }}>
                        <div className="rule-label">Evidence on file</div>
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', paddingTop: 10 }}>
                          {Object.entries(p.evidence).map(([k, v]) => (
                            <span key={k} className={`chip ${v.present ? 'chip-eligible' : 'chip-neutral'}`}>
                              {k.replace(/^[a-z]+\./, '')} {v.present ? fmtDate(v.date) : '— absent'}
                            </span>
                          ))}
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