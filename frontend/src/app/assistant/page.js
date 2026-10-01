'use client';
import { useEffect, useRef, useState } from 'react';
import AppShell, { PageHead, PageFoot } from '../../components/AppShell';
import { Panel, EmptyState } from '../../components/ui';

const EXAMPLES = ['Why is p004 not eligible?', 'Summarise patient p001', 'Which trials are still recruiting?', 'What is ECOG?', 'How accurate is the engine?'];

export default function Assistant() {
  const [input, setInput] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patients, setPatients] = useState([]);
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState(EXAMPLES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    (async () => {
      try {
        const [p, a] = await Promise.all([fetch('/api/patients').then(r => r.json()), fetch('/api/assistant').then(r => r.json())]);
        setPatients(p.data || []);
        setSuggestions(a.suggestions || EXAMPLES);
      } catch (e) {}
    })();
  }, []);

  const send = async (q) => {
    const question = q || input;
    if (!question.trim()) return;
    setInput('');
    setError('');
    const userMsg = { role: 'user', content: question };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, patientId: patientId || null, history: messages })
      });
      const body = await res.json();
      setMessages((m) => [...m, { role: 'assistant', content: body.reply, sources: body.sources || [] }]);
    } catch (e) {
      setError('Assistant is not responding right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHead
        eyebrow="AI Assistant"
        title="Talk to the eligibility assistant"
        lede="Ask plain questions about subjects, trials, or medical terms. Answers are grounded in the loaded records and the deterministic engine (no hallucinations)."
      />
      <div className="wrap" style={{ paddingBottom: 80 }}>
        <div className="stack" style={{ gap: 22, maxWidth: 880, margin: '0 auto' }}>
          <Panel title="Context">
            <div className="stack" style={{ gap: 12 }}>
              <label style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Focus on a specific subject (optional)</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  padding: '9px 11px',
                  fontSize: 13.5,
                  background: '#fbf9f8'
                }}
              >
                <option value="">No specific subject</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.mrn} · {p.diagnosis}
                  </option>
                ))}
              </select>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)' }}>
                When selected, answers include that subject's history and trial rankings.
              </p>
            </div>
          </Panel>

          <Panel title="Conversation" bodyless>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 420, maxHeight: 520, overflowY: 'auto', padding: '10px 0' }}>
              {messages.length === 0 ? (
                <EmptyState
                  title="Ask your first question"
                  body="Try one of the suggestions below, or ask in plain language."
                />
              ) : (
                messages.map((m, i) => (
                  <div key={i} style={{ padding: '12px 20px', borderTop: i === 0 ? 0 : '1px solid var(--line-2)' }}>
                    <div style={{ fontSize: 11, fontWeight: 650, textTransform: 'uppercase', letterSpacing: 0.5, color: m.role === 'user' ? 'var(--crimson)' : 'var(--ink-3)' }}>
                      {m.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    {m.role === 'assistant' && m.sources?.length ? (
                      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {m.sources.map((s, j) => (
                          <span key={j} className="chip chip-neutral" style={{ fontSize: 10, padding: '2px 6px' }}>
                            {s.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
              {loading ? (
                <div style={{ padding: '12px 20px' }}>
                  <div className="chip chip-neutral">Thinking...</div>
                </div>
              ) : null}
              {error ? (
                <div style={{ padding: '12px 20px' }}>
                  <div className="note note-warn">{error}</div>
                </div>
              ) : null}
              <div ref={endRef} />
            </div>

            <div style={{ borderTop: '1px solid var(--line)', padding: '14px 20px', background: '#fdfcfb' }}>
              <div className="stack" style={{ gap: 10 }}>
                {suggestions.length ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {suggestions.slice(0, 6).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => send(s)}
                        className="chip chip-neutral"
                        style={{ cursor: 'pointer', fontSize: 11, padding: '3px 8px' }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : null}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                  style={{ display: 'flex', gap: 10 }}
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask in plain language (e.g. Why is p004 not eligible?)"
                    style={{
                      flex: 1,
                      border: '1px solid var(--line)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      fontSize: 13.5,
                      background: '#fff'
                    }}
                  />
                  <button type="submit" disabled={loading} className="btn">
                    Send
                  </button>
                </form>
                <p style={{ margin: 0, fontSize: 11.5, color: 'var(--ink-3)' }}>
                  Answers are grounded in the loaded records and deterministic rules — not AI-generated guesses.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
      <PageFoot />
    </AppShell>
  );
}
