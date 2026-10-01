import { statusMeta, CRITERION_COLOR, CRITERION_ICON } from '../lib/format';

export function Chip({ status, small }) {
  const m = statusMeta(status);
  return (
    <span className={`chip ${m.chip}`} style={small ? { fontSize: 10, padding: '2px 7px' } : undefined}>
      <i className="dot" />
      {m.label}
    </span>
  );
}

export function Check({ d, size = 11, sw = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CriterionIcon({ status }) {
  return (
    <span className="crit-icon">
      <Check d={CRITERION_ICON[status] || CRITERION_ICON.indeterminate} size={9} sw={2.1} />
    </span>
  );
}

export function CriterionRow({ c, showProtocol = true }) {
  return (
    <div className={`crit crit-${c.status}`}>
      <CriterionIcon status={c.status} />
      <div style={{ minWidth: 0 }}>
        <p className="crit-title">
          {c.fieldLabel}
          <span className="mono" style={{ color: 'var(--ink-3)', fontWeight: 500, marginLeft: 8, fontSize: 11.5 }}>
            {c.id}
          </span>
        </p>
        {showProtocol && c.text ? <p className="crit-proto">&ldquo;{c.text}&rdquo;</p> : null}
        {c.evidence ? <div className="crit-evidence">{c.evidence}</div> : null}
        {Array.isArray(c.actual) && c.actual.length ? (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
            Record value: <span className="mono">{c.actual.join(' · ')}</span>
          </div>
        ) : c.actual !== null && c.actual !== undefined && !Array.isArray(c.actual) ? (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
            Record value: <span className="mono">{String(c.actual)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Meter({ value, tone }) {
  const color = tone || (value >= 85 ? 'var(--ok)' : value >= 50 ? 'var(--warn)' : 'var(--crimson)');
  return (
    <div className="meter">
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

export function Stat({ label, value, sub, tone }) {
  return (
    <div className="stat" style={tone ? { color: tone } : undefined}>
      <div className="stat-v num">{value}</div>
      <div className="stat-k">{label}</div>
      {sub ? <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>{sub}</div> : null}
    </div>
  );
}

export function Panel({ title, right, children, bodyless }) {
  return (
    <section className="panel">
      {(title || right) && (
        <header className="panel-head">
          <h3>{title}</h3>
          {right}
        </header>
      )}
      {bodyless ? children : <div className="panel-body">{children}</div>}
    </section>
  );
}

export function Skeleton({ rows = 3, height = 15 }) {
  return (
    <div className="stack" style={{ gap: 9 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height,
            borderRadius: 5,
            background: 'linear-gradient(90deg,#f2eeec 25%,#f8f5f4 50%,#f2eeec 75%)',
            backgroundSize: '200% 100%',
            animation: 'dotpulse 1.5s ease-in-out infinite',
            width: `${100 - i * 9}%`
          }}
        />
      ))}
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div style={{ padding: '52px 24px', textAlign: 'center' }}>
      <div
        style={{
          width: 34,
          height: 34,
          margin: '0 auto 16px',
          border: '1px solid var(--line)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ink-3)',
          background: '#fbf9f8'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M12.2 12.2L16 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <p style={{ margin: 0, fontSize: 14.5, fontWeight: 600 }}>{title}</p>
      {body ? <p style={{ margin: '7px auto 0', fontSize: 13.5, color: 'var(--ink-3)', maxWidth: 400 }}>{body}</p> : null}
      {action ? <div style={{ marginTop: 18 }}>{action}</div> : null}
    </div>
  );
}