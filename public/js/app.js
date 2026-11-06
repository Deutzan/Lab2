/* Torq Rent — protótipo. Subsistema 1: gestão de pedidos e contratos (api.js + funções de dados).
   Subsistema 2: construção dinâmica das páginas (funções view*). */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fdate = d => d ? d.split('-').reverse().join('/') : '';
const STATUS = { 'Em análise': 'warning', 'Aprovado': 'info', 'Contrato executado': 'success', 'Reprovado': 'danger', 'Cancelado': 'secondary' };
const PROP = { cliente: 'Cliente', empresa: 'Empresa', banco: 'Banco' };
let user = JSON.parse(sessionStorage.getItem('torq-user') || 'null');
const isAg = () => user && user.tipo === 'agente';
const renda = u => (u.empregadores || []).reduce((s, e) => s + Number(e.rendimento || 0), 0);

/* ---------- UI helpers ---------- */
const modal = new bootstrap.Modal('#m');
function dlg(title, body, onOk, label = 'Salvar') {
  $('#mt').textContent = title; $('#mb').innerHTML = body; $('#ok').textContent = label;
  $('#f').onsubmit = async e => { e.preventDefault(); try { await onOk(e.target); modal.hide(); } catch (x) { toast(x.message, 'danger'); } };
  modal.show();
}
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = 'alert alert-' + type + ' shadow'; el.setAttribute('role', 'alert'); el.textContent = msg;
  $('#toasts').append(el); setTimeout(() => el.remove(), 3500);
}
function setTheme(t) { document.documentElement.dataset.bsTheme = t; localStorage.setItem('torq-theme', t); }
setTheme(localStorage.getItem('torq-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
const toggleTheme = () => { setTheme(document.documentElement.dataset.bsTheme === 'dark' ? 'light' : 'dark'); renderNav(); };
const logo = '<svg width="32" height="32" viewBox="0 0 64 64" class="text-body"><use href="#mark"/></svg>';

function renderNav() {
  const dark = document.documentElement.dataset.bsTheme === 'dark';
  const h = location.hash || '#pedidos';
  const link = (href, t) => `<a class="nav-link ${h === href ? 'active fw-bold' : ''}" href="${href}">${t}</a>`;
  $('#nav').innerHTML = `<nav class="navbar navbar-expand-md bg-body-tertiary"><div class="container">
    <a class="navbar-brand d-flex align-items-center gap-2" href="#pedidos">${logo}<span class="brand-word">TORQ<span class="text-primary">RENT</span></span></a>
    <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#nv" aria-label="Menu"><span class="navbar-toggler-icon"></span></button>
    <div class="collapse navbar-collapse" id="nv"><ul class="navbar-nav me-auto">${user ? `<li>${link('#pedidos', 'Pedidos')}</li>` +
      (isAg() ? `<li>${link('#clientes', 'Clientes')}</li><li>${link('#frota', 'Frota')}</li>` : '') + `<li>${link('#perfil', 'Meu perfil')}</li>` : ''}<li><a class="nav-link" href="design-system.html">Design System</a></li></ul>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-secondary btn-sm" onclick="toggleTheme()" aria-pressed="${dark}">${dark ? 'Tema escuro' : 'Tema claro'}</button>
        ${user ? `<span class="small text-body-secondary">${esc(user.nome)}</span><button class="btn btn-sm btn-primary" onclick="logout()">Sair</button>` : ''}
      </div></div></div></nav>`;
}

/* ---------- Autenticação e cadastro ---------- */
function logout() { user = null; sessionStorage.removeItem('torq-user'); location.hash = ''; render(); }
function viewAuth() {
  $('#app').innerHTML = `<div class="row justify-content-center"><div class="col-md-7 col-lg-5"><div class="card shadow-sm"><div class="card-body p-4">
    <h1 class="h2 mb-1">Entrar</h1><p class="text-body-secondary">O sistema só pode ser usado após cadastro prévio.</p>
    <form id="lf"><div class="mb-3"><label class="form-label" for="le">E-mail</label><input class="form-control" id="le" type="email" required></div>
    <div class="mb-3"><label class="form-label" for="lp">Senha</label><input class="form-control" id="lp" type="password" required></div>
    <button class="btn btn-primary w-100">Entrar</button></form>
    <button class="btn btn-link w-100 mt-2" onclick="cadastro()">Criar cadastro</button>
    <p class="small text-body-secondary mb-0 mt-3">Contas de teste (senha 123): cliente@torq.com, empresa@torq.com, banco@torq.com</p>
  </div></div></div></div>`;
  $('#lf').onsubmit = async e => {
    e.preventDefault();
    try {
      const r = await api.get(`/usuarios?email=${encodeURIComponent($('#le').value)}&senha=${encodeURIComponent($('#lp').value)}`);
      if (!r.length) return toast('E-mail ou senha incorretos.', 'danger');
      user = r[0]; sessionStorage.setItem('torq-user', JSON.stringify(user)); location.hash = '#pedidos'; render();
    } catch (x) { toast(x.message, 'danger'); }
  };
}
const inp = (n, l, v = '', extra = '') => `<div class="col-md-6"><label class="form-label">${l}</label><input class="form-control" name="${n}" value="${esc(v)}" ${extra}></div>`;
function userForm(u = {}, novo = false) {
  const emp = u.empregadores || [];
  const rows = [0, 1, 2].map(i => `<div class="row g-2 mb-2">${inp('emp' + i, 'Empregador ' + (i + 1), emp[i]?.nome)}${inp('ren' + i, 'Rendimento mensal (R$)', emp[i]?.rendimento, 'type="number" min="0" step="0.01"')}</div>`).join('');
  return `<div class="row g-3">
    ${novo ? `<div class="col-md-6"><label class="form-label">Tipo de conta</label><select class="form-select" name="tipo" onchange="tgl(this.value)"><option value="cliente">Cliente (pessoa física)</option><option value="agente">Agente (empresa ou banco)</option></select></div>
    <div class="col-md-6 d-none" id="sa"><label class="form-label">Tipo de agente</label><select class="form-select" name="agenteTipo"><option value="empresa">Empresa</option><option value="banco">Banco</option></select></div>` : ''}
    ${inp('nome', 'Nome', u.nome, 'required')}${inp('email', 'E-mail', u.email, 'type="email" required')}
    ${novo ? inp('senha', 'Senha', '', 'type="password" required minlength="3"') : ''}
    <div class="col-12 ${u.tipo === 'agente' ? 'd-none' : ''}" id="sc"><div class="row g-3">
      ${inp('rg', 'RG', u.rg)}${inp('cpf', 'CPF (11 dígitos)', u.cpf, 'inputmode="numeric" pattern="\\d{11}" title="11 dígitos, só números"')}
      <div class="col-12"><label class="form-label">Endereço</label><input class="form-control" name="endereco" value="${esc(u.endereco)}"></div>
      ${inp('profissao', 'Profissão', u.profissao)}<div class="col-12"><h3 class="h6 mt-2">Entidades empregadoras e rendimentos (máximo 3)</h3>${rows}</div>
    </div></div></div>`;
}
function tgl(t) { $('#sa').classList.toggle('d-none', t !== 'agente'); $('#sc').classList.toggle('d-none', t === 'agente'); }
function readUser(f, base = {}) {
  const d = Object.fromEntries(new FormData(f)), u = { ...base, nome: d.nome.trim(), email: d.email.trim() };
  if (d.senha) u.senha = d.senha;
  if (d.tipo) { u.tipo = d.tipo; if (d.tipo === 'agente') u.agenteTipo = d.agenteTipo; }
  if (u.tipo === 'cliente') {
    Object.assign(u, { rg: d.rg, cpf: d.cpf, endereco: d.endereco, profissao: d.profissao });
    u.empregadores = [0, 1, 2].filter(i => d['emp' + i]?.trim()).map(i => ({ nome: d['emp' + i].trim(), rendimento: Number(d['ren' + i] || 0) }));
  }
  return u;
}
function cadastro() {
  dlg('Criar cadastro', userForm({}, true), async f => {
    const u = readUser(f);
    if ((await api.get('/usuarios?email=' + encodeURIComponent(u.email))).length) throw new Error('Este e-mail já está cadastrado.');
    await api.post('/usuarios', u); toast('Cadastro criado. Faça login para continuar.');
  }, 'Cadastrar');
}
function editarUsuario(id) {
  api.get('/usuarios/' + id).then(u => dlg('Editar cadastro', userForm(u), async f => {
    const n = await api.put('/usuarios/' + id, readUser(f, u));
    if (user.id === id) { user = n; sessionStorage.setItem('torq-user', JSON.stringify(n)); }
    toast('Cadastro atualizado.'); render();
  }));
}
async function excluirUsuario(id) {
  if (!confirm('Excluir este cadastro e todos os pedidos dele?')) return;
  try {
    for (const p of await api.get('/pedidos?usuarioId=' + id)) await api.del('/pedidos/' + p.id);
    await api.del('/usuarios/' + id); toast('Cadastro excluído.');
    if (user.id === id) return logout(); render();
  } catch (x) { toast(x.message, 'danger'); }
}

/* ---------- Pedidos ---------- */
const badge = s => `<span class="badge text-bg-${STATUS[s] || 'secondary'}">${s}</span>`;
async function viewPedidos() {
  const q = isAg() ? '' : '?usuarioId=' + user.id;
  const [ps, cars, us] = await Promise.all([api.get('/pedidos' + q), api.get('/automoveis'), api.get('/usuarios')]);
  const car = id => cars.find(c => c.id == id), usr = id => us.find(u => u.id == id);
  const acts = p => {
    const open = !['Cancelado', 'Reprovado', 'Contrato executado'].includes(p.status), b = [];
    if (!isAg() && p.status === 'Em análise') b.push(`<button class="btn btn-sm btn-outline-primary" onclick="formPedido(${p.id})">Modificar</button>`);
    if (!isAg() && open) b.push(`<button class="btn btn-sm btn-outline-danger" onclick="cancelarPedido(${p.id})">Cancelar</button>`);
    if (isAg() && open) b.push(`<button class="btn btn-sm btn-outline-primary" onclick="formPedido(${p.id})">Modificar</button>`);
    if (isAg() && p.status === 'Em análise') b.push(`<button class="btn btn-sm btn-primary" onclick="avaliar(${p.id})">Avaliar</button>`);
    if (isAg() && p.status === 'Aprovado') b.push(`<button class="btn btn-sm btn-primary" onclick="executar(${p.id})">Executar contrato</button>`);
    return b.join(' ');
  };
  const rows = ps.map(p => { const c = car(p.automovelId) || {}; return `<tr>
    <td>#${p.id}</td>${isAg() ? `<td>${esc(usr(p.usuarioId)?.nome)}</td>` : ''}
    <td>${esc(c.marca)} ${esc(c.modelo)}<div class="small text-body-secondary">${esc(c.placa)}</div></td>
    <td>${fdate(p.dataInicio)} a ${fdate(p.dataFim)}</td><td>${PROP[p.propriedade]}${p.bancoId ? `<div class="small text-body-secondary">Crédito: ${esc(usr(p.bancoId)?.nome)}</div>` : ''}</td>
    <td>${badge(p.status)}${p.parecer ? `<div class="small text-body-secondary mt-1">${esc(p.parecer)}</div>` : ''}</td><td class="text-nowrap">${acts(p)}</td></tr>`; }).join('');
  $('#app').innerHTML = `<div class="d-flex justify-content-between align-items-center mb-3"><h1 class="h2 mb-0">${isAg() ? 'Pedidos para análise' : 'Meus pedidos'}</h1>
    ${isAg() ? '' : '<button class="btn btn-primary" onclick="formPedido()">Novo pedido</button>'}</div>
    <div class="card"><div class="table-responsive"><table class="table align-middle mb-0"><thead><tr><th>Nº</th>${isAg() ? '<th>Cliente</th>' : ''}<th>Automóvel</th><th>Período</th><th>Propriedade</th><th>Status</th><th>Ações</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="7" class="text-center py-4 text-body-secondary">Nenhum pedido ainda.${isAg() ? '' : ' Clique em “Novo pedido” para começar.'}</td></tr>`}</tbody></table></div></div>`;
}
async function formPedido(id) {
  const [cars, us, p] = await Promise.all([api.get('/automoveis'), api.get('/usuarios'), id ? api.get('/pedidos/' + id) : {}]);
  const sel = (v, x) => v == x ? 'selected' : '';
  dlg(id ? 'Modificar pedido #' + id : 'Novo pedido de aluguel', `<div class="row g-3">
    <div class="col-12"><label class="form-label">Automóvel</label><select class="form-select" name="automovelId" required>${cars.map(c => `<option value="${c.id}" ${sel(p.automovelId, c.id)}>${esc(c.marca)} ${esc(c.modelo)} (${c.ano}), placa ${esc(c.placa)}</option>`).join('')}</select></div>
    ${inp('dataInicio', 'Retirada', p.dataInicio, 'type="date" required')}${inp('dataFim', 'Devolução', p.dataFim, 'type="date" required')}
    <div class="col-md-6"><label class="form-label">Automóvel registrado como propriedade de</label><select class="form-select" name="propriedade">${Object.entries(PROP).map(([k, v]) => `<option value="${k}" ${sel(p.propriedade, k)}>${v}</option>`).join('')}</select></div>
    <div class="col-md-6"><label class="form-label">Contrato de crédito (opcional)</label><select class="form-select" name="bancoId"><option value="">Sem crédito</option>${us.filter(u => u.agenteTipo === 'banco').map(b => `<option value="${b.id}" ${sel(p.bancoId, b.id)}>${esc(b.nome)}</option>`).join('')}</select></div></div>`,
  async f => {
    const d = Object.fromEntries(new FormData(f));
    if (d.dataFim <= d.dataInicio) throw new Error('A devolução deve ser depois da retirada.');
    const body = { automovelId: Number(d.automovelId), dataInicio: d.dataInicio, dataFim: d.dataFim, propriedade: d.propriedade, bancoId: d.bancoId ? Number(d.bancoId) : null };
    if (id) await api.patch('/pedidos/' + id, body);
    else await api.post('/pedidos', { ...body, usuarioId: user.id, status: 'Em análise', parecer: '' });
    toast(id ? 'Pedido modificado.' : 'Pedido enviado para análise.'); render();
  }, id ? 'Salvar alterações' : 'Enviar pedido');
}
async function cancelarPedido(id) {
  if (!confirm('Cancelar este pedido?')) return;
  await api.patch('/pedidos/' + id, { status: 'Cancelado' }); toast('Pedido cancelado.'); render();
}
async function avaliar(id) {
  const p = await api.get('/pedidos/' + id), c = await api.get('/usuarios/' + p.usuarioId);
  dlg('Análise financeira do pedido #' + id, `<dl class="row mb-3"><dt class="col-sm-4">Cliente</dt><dd class="col-sm-8">${esc(c.nome)}, CPF ${esc(c.cpf)}</dd>
    <dt class="col-sm-4">Profissão</dt><dd class="col-sm-8">${esc(c.profissao)}</dd>
    <dt class="col-sm-4">Rendimentos</dt><dd class="col-sm-8">${(c.empregadores || []).map(e => `${esc(e.nome)}: ${money(e.rendimento)}`).join('<br>') || 'Não informados'}<br><strong>Total: ${money(renda(c))}</strong></dd></dl>
    <div class="mb-3"><div class="form-check"><input class="form-check-input" type="radio" name="r" value="Aprovado" id="r1" checked><label class="form-check-label" for="r1">Parecer positivo</label></div>
    <div class="form-check"><input class="form-check-input" type="radio" name="r" value="Reprovado" id="r2"><label class="form-check-label" for="r2">Parecer negativo</label></div></div>
    <label class="form-label" for="pc">Justificativa</label><textarea class="form-control" id="pc" name="parecer" rows="3" required></textarea>`,
  async f => { const d = Object.fromEntries(new FormData(f)); await api.patch('/pedidos/' + id, { status: d.r, parecer: d.parecer, avaliadoPor: user.id }); toast('Análise registrada.'); render(); }, 'Registrar parecer');
}
async function executar(id) {
  if (!confirm('Executar o contrato deste pedido?')) return;
  const p = await api.get('/pedidos/' + id);
  await api.patch('/pedidos/' + id, { status: 'Contrato executado' });
  await api.patch('/automoveis/' + p.automovelId, { proprietario: p.propriedade });
  toast('Contrato executado.'); render();
}

/* ---------- Clientes, frota e perfil ---------- */
async function viewClientes() {
  const cs = (await api.get('/usuarios?tipo=cliente'));
  $('#app').innerHTML = `<h1 class="h2 mb-3">Clientes</h1><div class="card"><div class="table-responsive"><table class="table align-middle mb-0"><thead><tr><th>Nome</th><th>CPF</th><th>Profissão</th><th>Renda total</th><th>Ações</th></tr></thead><tbody>
    ${cs.map(c => `<tr><td>${esc(c.nome)}<div class="small text-body-secondary">${esc(c.email)}</div></td><td>${esc(c.cpf)}</td><td>${esc(c.profissao)}</td><td>${money(renda(c))}</td>
    <td class="text-nowrap"><button class="btn btn-sm btn-outline-primary" onclick="editarUsuario(${c.id})">Editar</button> <button class="btn btn-sm btn-outline-danger" onclick="excluirUsuario(${c.id})">Excluir</button></td></tr>`).join('') || '<tr><td colspan="5" class="text-center py-4">Sem clientes.</td></tr>'}</tbody></table></div></div>`;
}
async function viewFrota() {
  const cs = await api.get('/automoveis');
  $('#app').innerHTML = `<div class="d-flex justify-content-between align-items-center mb-3"><h1 class="h2 mb-0">Frota</h1><button class="btn btn-primary" onclick="formCarro()">Novo automóvel</button></div>
    <div class="card"><div class="table-responsive"><table class="table align-middle mb-0"><thead><tr><th>Matrícula</th><th>Marca e modelo</th><th>Ano</th><th>Placa</th><th>Propriedade</th><th></th></tr></thead><tbody>
    ${cs.map(c => `<tr><td>${esc(c.matricula)}</td><td>${esc(c.marca)} ${esc(c.modelo)}</td><td>${c.ano}</td><td>${esc(c.placa)}</td><td>${PROP[c.proprietario] || ''}</td><td><button class="btn btn-sm btn-outline-danger" onclick="excluirCarro(${c.id})">Excluir</button></td></tr>`).join('')}</tbody></table></div></div>`;
}
function formCarro() {
  dlg('Novo automóvel', `<div class="row g-3">${inp('matricula', 'Matrícula', '', 'required')}${inp('ano', 'Ano', '', 'type="number" min="1990" max="2100" required')}${inp('marca', 'Marca', '', 'required')}${inp('modelo', 'Modelo', '', 'required')}${inp('placa', 'Placa', '', 'required')}
    <div class="col-md-6"><label class="form-label">Propriedade</label><select class="form-select" name="proprietario">${Object.entries(PROP).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div></div>`,
  async f => { const d = Object.fromEntries(new FormData(f)); await api.post('/automoveis', { ...d, ano: Number(d.ano) }); toast('Automóvel cadastrado.'); render(); });
}
async function excluirCarro(id) {
  if (!confirm('Excluir este automóvel?')) return;
  if ((await api.get('/pedidos?automovelId=' + id)).length) return toast('Há pedidos associados a este automóvel.', 'danger');
  await api.del('/automoveis/' + id); render();
}
function viewPerfil() {
  $('#app').innerHTML = `<h1 class="h2 mb-3">Meu perfil</h1><div class="card"><div class="card-body">
    <p class="mb-1"><strong>${esc(user.nome)}</strong> (${isAg() ? 'agente: ' + user.agenteTipo : 'cliente'})</p><p class="text-body-secondary">${esc(user.email)}</p>
    ${isAg() ? '' : `<p class="mb-1">CPF ${esc(user.cpf)}, RG ${esc(user.rg)}</p><p class="mb-1">${esc(user.endereco)}</p><p>${esc(user.profissao)} · Renda total ${money(renda(user))}</p>`}
    <button class="btn btn-primary" onclick="editarUsuario(${user.id})">Editar cadastro</button> <button class="btn btn-outline-danger" onclick="excluirUsuario(${user.id})">Excluir minha conta</button></div></div>`;
}

/* ---------- Roteador ---------- */
async function render() {
  renderNav();
  if (!user) return viewAuth();
  const h = location.hash || '#pedidos', views = { '#pedidos': viewPedidos, '#perfil': viewPerfil, '#clientes': viewClientes, '#frota': viewFrota };
  try { await (views[h] && (isAg() || !['#clientes', '#frota'].includes(h)) ? views[h]() : viewPedidos()); }
  catch (x) { $('#app').innerHTML = `<div class="alert alert-danger">${esc(x.message)}</div>`; }
}
addEventListener('hashchange', render);
render();
