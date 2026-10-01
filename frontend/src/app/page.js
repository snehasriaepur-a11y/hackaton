'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell, { PageHead } from '../../components/AppShell';
import { Panel } from '../../components/ui';
import HeroCanvas from '../../components/HeroCanvas';

export default function Home() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/overview');
        const j = await r.json();
        if (alive) setOverview(j);
      } catch (e) {
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppShell accent="CTEM">
      <div className="hero-wrap">
        <HeroCanvas />
        <div className="wrap hero-inner">
          <div style={{ maxWidth: 760 }}>
            <div className="eyebrow" style={{ color: 'var(--crimson)' }}>
              Trial eligibility made easy
            </div>
            <h1 className="display serif">
              Find out who can join a clinical trial — in plain English
            </h1>
            <p className="lede">
              Upload a few patient details and see which trials they may qualify for. Every answer shows exactly why it was
              decided, using simple words anyone can understand.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 26 }}>
              <Link href="/workspace" className="btn btn-primary">
                Get started
              </Link>
              <Link href="/assistant" className="btn btn-ghost">
                Ask the assistant
              </Link>
              <Link href="/glossary" className="btn btn-ghost">
                Explain medical terms
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ paddingBottom: 70, paddingTop: 42 }}>
        <div className="grid-3">
          <Panel title="See the reason for every decision">
            <p className="muted">
              For each requirement, you'll see "met", "not met", "missing info", or "disqualifies". No guessing — if there's
              not enough info, it says so clearly.
            </p>
            <Link href="/workspace" className="link">
              Try the workspace →
            </Link>
          </Panel>
          <Panel title="Fix what's missing">
            <p className="muted">
              If a document is missing or out of date, you'll see exactly what to get (and whether it's required before a
              decision can be made).
            </p>
            <Link href="/data" className="link">
              Add your own data →
            </Link>
          </Panel>
          <Panel title="Ask in plain English">
            <p className="muted">
              "Why isn't this person eligible?" or "What is ECOG?" — ask naturally and get a clear answer grounded in your
              loaded records.
            </p>
            <Link href="/assistant" className="link">
              Talk to the assistant →
            </Link>
          </Panel>
        </div>

        {overview && (
          <Panel title="Quick numbers" style={{ marginTop: 22 }}>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-num">{overview.patients}</div>
                <div className="stat-label">People</div>
                <div className="stat-sub">loaded in the demo</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{overview.trials}</div>
                <div className="stat-label">Trials</div>
                <div className="stat-sub">ready to check</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{overview.evaluations}</div>
                <div className="stat-label">Checks done</div>
                <div className="stat-sub">patient vs trial</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{overview.byStatus?.eligible || 0}</div>
                <div className="stat-label">Likely eligible</div>
                <div className="stat-sub">clear matches</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{overview.evidenceGaps}</div>
                <div className="stat-label">Need more info</div>
                <div className="stat-sub">missing documents</div>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </AppShell>
  );
}
