'use client';
import { useEffect, useMemo, useState } from 'react';
import AppShell, { PageHead, PageFoot } from '../../components/AppShell';
import { Panel, EmptyState } from '../../components/ui';

const DEFAULT_STATE = {
  patients: [],
  trials: []
};

export default function Data() {
  const [data, setData] = useState(DEFAULT_STATE);
  const [rows, setRows] = useState('');
  const [jsonText, setJsonText] = useState('[\n  {\n    "id":"u001",\n    "name":"Subject U-001",\n    "age":55,\n    "sex":"M",\n    "diagnosis":"Non-Small Cell Lung Cancer",\n    "stage":"Stage IIIB",\n    "ecogPerformance":1,\n    "hemoglobine":10.9,\n    "platelets":150000,\n    "creatinine":0.9,\n    "alt":24,\n    "ast":28,\n    "bilirubin":0.6,\n    "neutrophils":3200\n  }\n]');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      const [p, t] = await Promise.all([fetch('/api/patients').then(r => r.json()), fetch('/api/trials').then(r => r.json())]);
      setData({ patients: p.data || [], trials: t.data || [] });
    } catch (e) {}
  };

  useEffect(() => { load(); }, []);

  const downloadTemplate = async () => {
    try {
      const r = await fetch('/api/ingest/template');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ctem-patient-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setErr('Could not download template'); }
  };

  const ingestCsv = async () => {
    setBusy(true); setErr(''); setMsg('');
    try {
      const r = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: rows })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed to import CSV');
      setMsg(`Imported ${j.added} subject(s)${j.rejected?.length ? `, ${j.rejected.length} rejected` : ''}.`);
      setRows('');
      load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const ingestJson = async () => {
    setBusy(true); setErr(''); setMsg('');
    try {
      const parsed = JSON.parse(jsonText);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const r = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patients: list })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed to import JSON');
      setMsg(`Imported ${j.added} subject(s)${j.rejected?.length ? `, ${j.rejected.length} rejected` : ''}.`);
      load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const evalSample = async (pid, tid) => {
    setBusy(true); setErr(''); setMsg('');
    try {
      const r = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: pid, trialId: tid })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Evaluation failed');
      setMsg(`Evaluated ${pid} vs ${tid} → ${j.status}, score ${j.score}%`);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const examplePairs = useMemo(() => {
    const ps = data.patients.slice(0, 2);
    const ts = data.trials.slice(0, 2);
    return ps.flatMap(p => ts.map(t => [p.id, t.id]));
  }, [data]);

  return (
    <AppShell>
      <PageHead
        eyebrow="Data & Evaluation"
        title="Add your own data and test eligibility"
        lede="Upload a small CSV or paste JSON to add subjects, run evaluations, and download a template. All data stays in memory for this demo."
      />
      <div className="wrap" style={{ paddingBottom: 70 }}>
        <div className="stack" style={{ gap: 22 }}>
          <Panel title="Current dataset">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <div className="stat">
                <div className="stat-v num">{data.patients.length}</div>
                <div className="stat-k">Subjects loaded</div>
              </div>
              <div className="stat">
                <div className="stat-v num">{data.trials.length}</div>
                <div className="stat-k">Protocols loaded</div>
              </div>
            </div>
          </Panel>

          <Panel title="Import subjects">
            <div className="stack" style={{ gap: 18 }}>
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: 13.5, fontWeight: 650 }}>Step 1: Download template</h4>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)' }}>
                  Use the CSV template to add subjects in bulk. At minimum include <code>diagnosis</code>.
                </p>
                <button onClick={downloadTemplate} className="btn btn-ghost" style={{ marginTop: 10 }}>
                  Download CSV template
                </button>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 13.5, fontWeight: 650 }}>Step 2: Paste CSV</h4>
                <textarea
                  value={rows}
                  onChange={(e) => setRows(e.target.value)}
                  rows={6}
                  placeholder="id,mrn,name,age,sex,diagnosis,stage,ecogPerformance,hemoglobine,platelets,..."
                  style={{
                    width: '100%',
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 12.5,
                    fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace',
                    background: '#fbf9f8'
                  }}
                />
                <button onClick={ingestCsv} disabled={busy || !rows.trim()} className="btn" style={{ marginTop: 10 }}>
                  {busy ? 'Importing...' : 'Import CSV'}
                </button>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 13.5, fontWeight: 650 }}>Or paste JSON</h4>
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  rows={9}
                  style={{
                    width: '100%',
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 12.5,
                    fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace',
                    background: '#fbf9f8'
                  }}
                />
                <button onClick={ingestJson} disabled={busy || !jsonText.trim()} className="btn" style={{ marginTop: 10 }}>
                  {busy ? 'Importing...' : 'Import JSON'}
                </button>
              </div>

              {msg ? <div className="note">{msg}</div> : null}
              {err ? <div className="note note-warn">{err}</div> : null}
            </div>
          </Panel>

          <Panel title="Quick evaluation">
            <div className="stack" style={{ gap: 12 }}>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)' }}>
                Test a subject against a protocol to see the criterion-by-criterion trace.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {examplePairs.length === 0 ? <EmptyState title="No data yet" body="Add subjects above to run evaluations." /> : examplePairs.map(([pid, tid], i) => (
                  <button key={i} onClick={() => evalSample(pid, tid)} className="btn btn-ghost" disabled={busy}>
                    Evaluate {pid} vs {tid}
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Notes">
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
              Data you add here lives only in memory for this browser session (no database or authentication is configured). For a demo, this is intentional.
            </p>
          </Panel>
        </div>
      </div>
      <PageFoot />
    </AppShell>
  );
}
