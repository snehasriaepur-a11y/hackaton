'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/workspace', label: 'Workspace' },
  { href: '/protocols', label: 'Protocols' },
  { href: '/cohort', label: 'Cohort' },
  { href: '/data', label: 'Data & Evaluation' },
  { href: '/assistant', label: 'Assistant' },
  { href: '/glossary', label: 'Glossary' },
  { href: '/evaluation', label: 'Metrics' },
  { href: '/architecture', label: 'Architecture' }
];

export default function AppShell({ children, accent = 'CTEM' }) {
  const pathname = usePathname() || '/';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="masthead">
        <div className="wrap masthead-inner">
          <Link href="/" className="wordmark">
            <b>{accent}</b>
            <span className="hide-sm">Trial Eligibility Matcher</span>
          </Link>
          <nav className="nav hide-sm">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={pathname.startsWith(l.href) ? 'on' : ''}>
                {l.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="btn btn-ghost btn-sm hide-sm" style={{ marginLeft: 12 }}>
            Overview
          </Link>
        </div>
      </header>

      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

export function PageHead({ eyebrow, title, lede, actions }) {
  return (
    <div className="wrap" style={{ paddingTop: 46, paddingBottom: 26 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 28, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 660 }}>
          {eyebrow ? (
            <div className="rule-label" style={{ color: 'var(--crimson)' }}>{eyebrow}</div>
          ) : null}
          <h1
            className="serif"
            style={{ fontSize: 'clamp(27px, 3.4vw, 37px)', lineHeight: 1.12, letterSpacing: '-0.022em', fontWeight: 500, margin: eyebrow ? '11px 0 0' : 0 }}
          >
            {title}
          </h1>
          {lede ? (
            <p style={{ margin: '13px 0 0', fontSize: 15.5, lineHeight: 1.62, color: 'var(--ink-2)', maxWidth: 620 }}>
              {lede}
            </p>
          ) : null}
        </div>
        {actions ? <div style={{ display: 'flex', gap: 10 }}>{actions}</div> : null}
      </div>
    </div>
  );
}

export function PageFoot() {
  return (
    <footer style={{ borderTop: '1px solid var(--line)', marginTop: 64 }}>
      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 26, display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          Synthetic de-identified records only · no PHI in this environment
        </span>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
          CTEM / PNH2
        </span>
      </div>
    </footer>
  );
}