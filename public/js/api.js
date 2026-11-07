// Camada de acesso à API REST (JSON Server)

// Verifica se o site está sendo executado localmente
const local = ['localhost', '127.0.0.1'].includes(location.hostname);

// Define a URL da API conforme o ambiente
const BASE = local
  ? (location.port === '3000' ? '' : 'http://localhost:3000')
  : 'https://orq-rent-api.onrender.com';

const chk = r => {
  if (!r.ok) {
    throw new Error('Falha na API (' + r.status + ').');
  }
  return r.json();
};

const send = (m, p, b) =>
  fetch(BASE + p, {
    method: m,
    headers: { 'Content-Type': 'application/json' },
    body: b ? JSON.stringify(b) : undefined
  }).then(chk);

const api = {
  get: p => fetch(BASE + p).then(chk),
  post: (p, b) => send('POST', p, b),
  put: (p, b) => send('PUT', p, b),
  patch: (p, b) => send('PATCH', p, b),
  del: p => send('DELETE', p)
};