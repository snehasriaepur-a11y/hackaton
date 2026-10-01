const DEFAULT_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const PORTS = [5000, 5001, 5002, 5003, 5004, 5005];

let resolvedBase = DEFAULT_BASE;
let probed = false;

async function ping(base, ms = 700) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(`${base}/api/health`, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) return false;
    const body = await res.json();
    return body?.service === 'ctem-matching-engine' || body?.status === 'ok';
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function resolveBase() {
  if (probed) return resolvedBase;
  probed = true;
  if (await ping(DEFAULT_BASE)) {
    resolvedBase = DEFAULT_BASE;
    return resolvedBase;
  }
  const base = DEFAULT_BASE.replace(/:\d+$/, '');
  for (const p of PORTS) {
    const candidate = `${base}:${p}`;
    if (candidate === DEFAULT_BASE) continue;
    if (await ping(candidate)) {
      resolvedBase = candidate;
      return resolvedBase;
    }
  }
  return resolvedBase;
}

export function apiBase() {
  return resolvedBase;
}

async function request(method, path, body) {
  const base = await resolveBase();
  const opts = { method, headers: { 'Content-Type': 'application/json' }, cache: 'no-store' };
  if (body !== undefined) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${base}${path}`, opts);
  } catch {
    probed = false;
    throw new Error(`Cannot reach the matching engine at ${base}. Run \`npm run dev\` from the project root.`);
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