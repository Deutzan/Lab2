// Camada de acesso à API REST (JSON Server) via Fetch
const BASE = location.protocol === 'file:' ? 'http://localhost:3000' : '';
const chk = r => { if (!r.ok) throw new Error('Falha na API (' + r.status + '). O JSON Server está rodando?'); return r.json(); };
const send = (m, p, b) => fetch(BASE + p, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }).then(chk);
const api = {
  get: p => fetch(BASE + p).then(chk),
  post: (p, b) => send('POST', p, b),
  put: (p, b) => send('PUT', p, b),
  patch: (p, b) => send('PATCH', p, b),
  del: p => send('DELETE', p)
};
