'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import AppShell, { PageHead, PageFoot } from '../../components/AppShell';
import { Panel, Skeleton, EmptyState } from '../../components/ui';
import { GLOSSARY } from '../../lib/ctem/glossary';

export default function Glossary() {
  const terms = useMemo(() => Object.entries(GLOSSARY), []);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return terms;
    return terms.filter(([k, v]) => k.toLowerCase().includes(q) || v.plain.toLowerCase().includes(q));
  }, [terms, query]);

  return (
    <AppShell>
      <PageHead
        eyebrow="Reference"
        title="Medical terms, explained in plain language"
        lede="Every clinical term used in the eligibility report is defined here, along with a short explanation of why it affects trial eligibility."
      />
      <div className="wrap" style={{ paddingBottom: 70 }}>
        <Panel title="Glossary">
          <div className="stack" style={{ gap: 18 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search terms like ECOG, ULN, PD-L1..."
              className="mono"
              style={{
                width: '100%',
                border: '1px solid var(--line)',
                borderRadius: 10,
                padding: '11px 13px',
                fontSize: 13.5,
                outline: 'none',
                background: '#fbf9f8'
              }}
            />
            <div className="stack" style={{ gap: 14 }}>
              {filtered.map(([k, v]) => (
                <article key={k} style={{ borderBottom: '1px solid var(--line-2)', paddingBottom: 14 }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: 14.5, fontWeight: 650 }}>{k}</h4>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>{v.plain}</p>
                  {v.why ? (
                    <p style={{ margin: '7px 0 0', fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                      <strong>Why it matters:</strong> {v.why}
                    </p>
                  ) : null}
                </article>
              ))}
              {filtered.length === 0 ? <EmptyState title="No terms match" body="Try a shorter search." /> : null}
            </div>
          </div>
        </Panel>
      </div>
      <PageFoot />
    </AppShell>
  );
}
