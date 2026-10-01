const EXPLICIT_BASE = process.env.NEXT_PUBLIC_API_URL || '';

let remoteBase = null;
let remoteChecked = false;

async function ping(base, ms = 600) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(`${base}/api/health`, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) return false;
    const body = await res.json();
    return body?.service === 'ctem-matching-engine';
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function resolveBase() {
  if (EXPLICIT_BASE) return EXPLICIT_BASE.replace(/\/$/, '');
  if (remoteChecked) return remoteBase || '';

  remoteChecked = true;
  if (typeof window === 'undefined') return '';

  const host = window.location.hostname || 'localhost';
  for (const port of [5000, 5001, 5002]) {
    const candidate = `${window.location.protocol}//${host}:${port}`;
    if (await ping(candidate)) {
      remoteBase = candidate;
      return remoteBase;
    }
  }
  return '';
}

export function apiBase() {
  return EXPLICIT_BASE || remoteBase || '(same origin)';
}

async function request(method, path, body) {
  const base = await resolveBase();
  const opts = { method, headers: { 'Content-Type': 'application/json' }, cache: 'no-store' };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const suffix = path.startsWith('/api') ? path : `/api${path || '/'}`;
  const url = base ? `${base}${suffix}` : suffix;

  let res;
  try {
    res = await fetch(url, opts);
  } catch {
    remoteChecked = false;
    throw new Error('The matching engine did not respond. Reload the page.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path)
};

export default api;
