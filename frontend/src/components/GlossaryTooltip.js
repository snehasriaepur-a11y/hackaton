import { GLOSSARY } from '../lib/ctem/glossary';

export default function GlossaryTooltip({ term, children }) {
  const key = Object.keys(GLOSSARY).find((k) => k.toLowerCase() === String(term).toLowerCase());
  const entry = key ? GLOSSARY[key] : null;

  if (!entry) return <>{children}</>;

  return (
    <span className="tip" tabIndex={0} role="button" aria-label={`What is ${key}?`}>
      {children}
      <span className="tip-body" role="tooltip">
        <strong>{key}</strong>
        <span>{entry.plain}</span>
        {entry.why ? <em>Why it matters: {entry.why}</em> : null}
      </span>
    </span>
  );
}
