'use client';

export default function MatchLattice({ patients, trials, results, selected, onSelect }) {
  const byKey = {};
  for (const r of results) byKey[`${r.patientId}:${r.trialId}`] = r;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="grid" style={{ minWidth: 640 }}>
        <thead>
          <tr>
            <th style={{ minWidth: 190 }}>Subject</th>
            {trials.map((t) => (
              <th key={t.id} style={{ textAlign: 'center', minWidth: 96 }} title={t.title}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', letterSpacing: 0 }}>
                    {t.nctId}
                  </span>
                  <span style={{ fontSize: 9.5, fontWeight: 600 }}>{t.phase}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id}>
              <td>
                <button
                  onClick={() => onSelect(p.id)}
                  style={{
                    background: 'none',
                    border: 0,
                    padding: 0,
                    textAlign: 'left',
                    cursor: 'pointer',
                    font: 'inherit',
                    color: 'inherit'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 5,
                        background: selected === p.id ? 'var(--crimson)' : '#f2eeec',
                        color: selected === p.id ? '#fff' : 'var(--ink-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10.5,
                        fontWeight: 700,
                        flex: 'none',
                        letterSpacing: '0.02em'
                      }}
                    >
                      {p.initials}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{p.name}</span>
                      <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
                        {p.mrn} · {p.diagnosis}
                      </span>
                    </span>
                  </div>
                </button>
              </td>
              {trials.map((t) => {
                const r = byKey[`${p.id}:${t.trialId}`];
                const isSel = selected === p.id;
                return (
                  <td key={t.id} style={{ textAlign: 'center' }}>
                    {r ? (
                      <button
                        onClick={() => onSelect(p.id)}
                        title={`${r.status} — ${r.score}% weighted`}
                        style={{
                          background: 'none',
                          border: 0,
                          padding: 0,
                          cursor: 'pointer',
                          display: 'inline-block'
                        }}
                      >
                        <span
                          className={`score-cell ${r.status === 'ineligible' ? 'sc-ineligible' : r.status === 'eligible' ? 'sc-eligible' : r.status === 'evidence_gap' ? 'sc-evidence_gap' : r.status === 'borderline' ? 'sc-borderline' : 'sc-needs_adjudication'}`}
                          style={
                            isSel
                              ? { outline: '2px solid var(--crimson)', outlineOffset: 2 }
                              : undefined
                          }
                        >
                          {r.score}
                        </span>
                      </button>
                    ) : (
                      <span style={{ color: 'var(--line)', fontSize: 15 }}>·</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}