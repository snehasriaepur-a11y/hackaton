import engine from '../../../lib/ctem';

const { answer, historyFor, SUGGESTIONS } = engine;

export async function POST(req) {
  const { question, patientId, history = [] } = await req.json().catch(() => ({}));
  const res = answer(question || '');
  return new Response(JSON.stringify({ ...res, historyContext: patientId ? historyFor(patientId) : null }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

export async function GET() {
  return new Response(JSON.stringify({ suggestions: SUGGESTIONS }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}
