/* Torq Rent — protótipo. Subsistema 1: gestão de pedidos e contratos (api.js + funções de dados).
   Subsistema 2: construção dinâmica das páginas (funções view*). */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fdate = d => d ? d.split('-').reverse().join('/') : '';
const STATUS = { 'Em análise': 'warning', 'Aprovado': 'info', 'Contrato executado': 'success', 'Reprovado': 'danger', 'Cancelado': 'secondary' };
const PROP = { cliente: 'Cliente', empresa: 'Empresa', banco: 'Banco' };
const ESTADO = { Novo: 'novo', Seminovo: 'seminovo', Usado: 'usado' };
const kmFmt = n => Number(n || 0).toLocaleString('pt-BR') + ' km';
const fotoOf = c => c.fotoUri || fotoUri(c);
const brl0 = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const thumb = c => `<img class="thumb" src="${esc(fotoOf(c))}" alt="" loading="lazy">`;
const tag = e => e ? `<span class="tag tag-${ESTADO[e] || 'usado'}">${esc(e)}</span>` : '';
const initials = n => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const home = () => isAg() ? '#pedidos' : '#catalogo';
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
  const h = location.hash || home();
  const link = (href, t) => `<a class="nav-link ${h === href ? 'active' : ''}" href="${href}" ${h === href ? 'aria-current="page"' : ''}>${t}</a>`;
  $('#nav').innerHTML = `<nav class="navbar navbar-expand-md"><div class="container">
    <a class="navbar-brand d-flex align-items-center gap-2" href="${user ? home() : '#'}">${logo}<span class="brand-word">TORQ<span class="text-primary">RENT</span></span></a>
    <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#nv" aria-label="Menu"><span class="navbar-toggler-icon"></span></button>
    <div class="collapse navbar-collapse" id="nv"><ul class="navbar-nav me-auto">${user ? `<li>${link('#catalogo', 'Catálogo')}</li><li>${link('#pedidos', 'Pedidos')}</li>` +
      (isAg() ? `<li>${link('#clientes', 'Clientes')}</li><li>${link('#frota', 'Frota')}</li>` : `<li>${link('#historico', 'Meu histórico')}</li>`) + `<li>${link('#perfil', 'Meu perfil')}</li>` : ''}<li><a class="nav-link" href="design-system.html">Design System</a></li></ul>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-secondary btn-sm" onclick="toggleTheme()" aria-pressed="${dark}">${dark ? 'Tema escuro' : 'Tema claro'}</button>
        ${user ? `<a class="avatar avatar-sm" href="#perfil" title="${esc(user.nome)}" aria-label="Meu perfil">${esc(initials(user.nome))}</a><button class="btn btn-sm btn-primary" onclick="logout()">Sair</button>` : ''}
      </div></div></div></nav>`;
}

/* ---------- Autenticação e cadastro ---------- */
function logout() { user = null; sessionStorage.removeItem('torq-user'); location.hash = ''; render(); }
function viewAuth() {
  $('#app').innerHTML = `<div class="row g-5 align-items-center py-lg-4"><div class="col-lg-6">
    <h1 class="display-5 mb-3">Escolha o carro, acompanhe o pedido.</h1>
    <p class="lead text-body-secondary mb-4">Veja fotos, quilometragem e localização de cada carro antes de pedir. Tudo o que você alugar fica salvo na sua biblioteca.</p>
    <div class="stage d-none d-lg-grid" aria-hidden="true"><i class="speed s1"></i><i class="speed s2"></i><i class="speed s3"></i><svg viewBox="0 0 64 64"><use href="#mark"/></svg></div></div>
    <div class="col-lg-6 col-xl-5 ms-xl-auto"><div class="card shadow-sm"><div class="card-body p-4">
    <h2 class="h3 mb-1">Entrar</h2><p class="text-body-secondary">O sistema só pode ser usado após cadastro prévio.</p>
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
      user = r[0]; sessionStorage.setItem('torq-user', JSON.stringify(user)); location.hash = home(); render();
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

/* ---------- Catálogo (antes do CRUD de pedidos): lê a coleção /catalogo do db.json ---------- */
const catF = { q: '', cidade: '', estado: '', categoria: '', marca: '', preco: 0, km: 0, ordem: 'relevancia' };
const busca = { ini: '', fim: '' };
let catalogo = [];
const CATEG = { hatch: 'Hatch', sedan: 'Sedã', suv: 'SUV', picape: 'Picape', esportivo: 'Esportivo' };
const norm = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const dias = () => busca.ini && busca.fim && busca.fim > busca.ini ? Math.round((new Date(busca.fim) - new Date(busca.ini)) / 864e5) : 0;
const PIN = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>';
const ORDEM = { relevancia: (a, b) => a.id - b.id, 'preco-asc': (a, b) => a.diaria - b.diaria, 'preco-desc': (a, b) => b.diaria - a.diaria, 'km-asc': (a, b) => a.km - b.km, 'ano-desc': (a, b) => b.ano - a.ano || a.km - b.km };
const filtrar = () => catalogo.filter(c =>
  (!catF.q || norm([c.marca, c.modelo, c.versao, c.cidade].join(' ')).includes(norm(catF.q))) &&
  (!catF.cidade || c.cidade === catF.cidade) && (!catF.estado || c.estado === catF.estado) && (!catF.categoria || c.categoria === catF.categoria) &&
  (!catF.marca || c.marca === catF.marca) && c.diaria <= catF.preco && c.km <= catF.km).sort(ORDEM[catF.ordem] || ORDEM.relevancia);

const carCard = c => {
  const d = dias();
  return `<article class="car car-row"><div class="car-photo"><img src="${esc(fotoOf(c))}" alt="${esc(c.marca + ' ' + c.modelo + ', cor ' + c.cor)}" loading="lazy">${tag(c.estado)}</div>
  <div class="car-main"><h2 class="h5 mb-0">${esc(c.marca)} ${esc(c.modelo)}</h2><div class="text-body-secondary small mb-3">${esc(c.versao)}, ${c.ano}</div>
    <div class="chips"><span>${kmFmt(c.km)}</span><span>${esc(c.cambio)}</span><span>${esc(c.combustivel)}</span><span>${c.lugares} lugares</span></div>
    <div class="loc">${PIN}<span>${esc(c.cidade)}, ${esc(c.uf)}</span></div>${c.fotoFonte ? `<div class="small mt-2"><a href="${esc(c.fotoFonte)}" target="_blank" rel="noopener noreferrer">Crédito e licença da foto</a></div>` : ''}</div>
  <div class="car-side"><div><div class="price">${brl0(c.diaria)}<small>/dia</small></div>${d ? `<div class="small text-body-secondary">${brl0(c.diaria * d)} por ${d} ${d > 1 ? 'dias' : 'dia'}</div>` : ''}</div>
    ${isAg() ? `<button class="btn btn-outline-primary btn-sm" onclick="paraFrota(${c.id})">Adicionar à frota</button>` : `<button class="btn btn-primary" onclick="pedirCatalogo(${c.id})">Fazer pedido</button>`}</div></article>`;
};

async function viewCatalogo() {
  catalogo = await api.get('/catalogo');
  await sincronizarCatalogoComFrota(catalogo);
  const uniq = k => [...new Set(catalogo.map(c => c[k]))].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
  const pmax = Math.max(...catalogo.map(c => c.diaria)), kmax = Math.max(...catalogo.map(c => c.km));
  if (!catF.preco || catF.preco > pmax) catF.preco = pmax;
  if (!catF.km || catF.km > kmax) catF.km = kmax;
  const opts = (itens, cur, todos) => `<option value="">${todos}</option>` + itens.map(([k, t]) => `<option value="${esc(k)}" ${cur === k ? 'selected' : ''}>${esc(t)}</option>`).join('');
  const radios = (nome, itens, cur) => itens.map(([v, t], i) => `<div class="form-check"><input class="form-check-input" type="radio" name="${nome}" id="${nome}${i}" value="${esc(v)}" ${cur === v ? 'checked' : ''}><label class="form-check-label" for="${nome}${i}">${esc(t)}</label></div>`).join('');
  const hoje = new Date().toISOString().slice(0, 10);
  $('#app').innerHTML = `<h1 class="h2 mb-3">Catálogo</h1>
    <form class="searchbar" onsubmit="return false" role="search">
      <div><label class="form-label small" for="fq">Buscar carro</label><input class="form-control" id="fq" type="search" placeholder="Marca ou modelo" value="${esc(catF.q)}"></div>
      <div><label class="form-label small" for="fl">Local de retirada</label><select class="form-select" id="fl">${opts(uniq('cidade').map(k => [k, k]), catF.cidade, 'Todos os locais')}</select></div>
      <div><label class="form-label small" for="di">Retirada</label><input class="form-control" id="di" type="date" min="${hoje}" value="${busca.ini}"></div>
      <div><label class="form-label small" for="df">Devolução</label><input class="form-control" id="df" type="date" min="${hoje}" value="${busca.fim}"></div>
    </form>
    <div class="row g-4"><aside class="col-lg-3"><form class="panel filtros" id="flt" onsubmit="return false">
      <div class="d-flex justify-content-between align-items-center mb-3"><h2 class="h5 mb-0">Filtros</h2><button type="button" class="btn btn-link btn-sm p-0" id="fx">Limpar</button></div>
      <fieldset class="mb-3"><legend class="form-label small">Estado do carro</legend>${radios('estado', [['', 'Todos'], ['Novo', 'Novo'], ['Seminovo', 'Seminovo'], ['Usado', 'Usado']], catF.estado)}</fieldset>
      <fieldset class="mb-3"><legend class="form-label small">Categoria</legend>${radios('categoria', [['', 'Todas'], ...uniq('categoria').map(k => [k, CATEG[k] || k])], catF.categoria)}</fieldset>
      <div class="mb-3"><label class="form-label small" for="fm">Marca</label><select class="form-select" id="fm">${opts(uniq('marca').map(k => [k, k]), catF.marca, 'Todas')}</select></div>
      <div class="mb-3"><label class="form-label small d-flex justify-content-between" for="fp"><span>Preço máximo por dia</span><strong id="fpv">${brl0(catF.preco)}</strong></label><input class="form-range" id="fp" type="range" min="50" max="${pmax}" step="10" value="${catF.preco}"></div>
      <div><label class="form-label small d-flex justify-content-between" for="fk"><span>Quilometragem máxima</span><strong id="fkv">${kmFmt(catF.km)}</strong></label><input class="form-range" id="fk" type="range" min="0" max="${kmax}" step="1000" value="${catF.km}"></div>
    </form></aside>
    <div class="col-lg-9"><div class="d-flex justify-content-between align-items-end gap-3 mb-3"><p class="mb-0 fw-semibold" id="cc" aria-live="polite"></p>
      <div><label class="form-label small mb-1" for="fo">Ordenar por</label><select class="form-select form-select-sm" id="fo">${opts([['preco-asc', 'Menor preço'], ['preco-desc', 'Maior preço'], ['km-asc', 'Menor quilometragem'], ['ano-desc', 'Mais novos']], catF.ordem === 'relevancia' ? '' : catF.ordem, 'Destaques')}</select></div></div>
      <div class="car-list" id="cg"></div></div></div>`;
  const aplicar = () => {
    const r = filtrar();
    $('#cc').textContent = r.length + (r.length === 1 ? ' carro disponível' : ' carros disponíveis') + (catF.cidade ? ' em ' + catF.cidade : '');
    $('#cg').innerHTML = r.map(carCard).join('') || '<div class="empty">Nenhum carro com esses filtros. Clique em “Limpar” ou escolha outro local.</div>';
  };
  let t; $('#fq').oninput = e => { catF.q = e.target.value; clearTimeout(t); t = setTimeout(aplicar, 200); };
  $('#fl').onchange = e => { catF.cidade = e.target.value; aplicar(); };
  $('#fm').onchange = e => { catF.marca = e.target.value; aplicar(); };
  $('#fo').onchange = e => { catF.ordem = e.target.value || 'relevancia'; aplicar(); };
  $('#di').onchange = e => { busca.ini = e.target.value; aplicar(); };
  $('#df').onchange = e => { busca.fim = e.target.value; aplicar(); };
  $('#fp').oninput = e => { catF.preco = Number(e.target.value); $('#fpv').textContent = brl0(catF.preco); aplicar(); };
  $('#fk').oninput = e => { catF.km = Number(e.target.value); $('#fkv').textContent = kmFmt(catF.km); aplicar(); };
  document.querySelectorAll('#flt input[type=radio]').forEach(r => r.onchange = e => { catF[e.target.name] = e.target.value; aplicar(); });
  $('#fx').onclick = () => { Object.assign(catF, { q: '', cidade: '', estado: '', categoria: '', marca: '', preco: 0, km: 0, ordem: 'relevancia' }); viewCatalogo(); };
  aplicar();
}

/* Mantém todos os itens do catálogo disponíveis no CRUD/frota e nos pedidos. */
function dadosAutomovelCatalogo(c, id) {
  return {
    catalogoId: c.id,
    matricula: 'MAT-' + (1000 + id),
    ano: c.ano,
    marca: c.marca,
    modelo: c.modelo,
    placa: c.placa,
    proprietario: 'empresa',
    estado: c.estado,
    km: c.km,
    localizacao: `${c.cidade}, ${c.uf}`,
    categoria: c.categoria,
    corHex: c.corHex,
    fotoUri: c.fotoUri,
    fotoFonte: c.fotoFonte
  };
}
async function sincronizarCatalogoComFrota(itens = null) {
  const carrosCatalogo = itens || await api.get('/catalogo');
  const autos = await api.get('/automoveis');
  const catalogoIds = new Set(autos.filter(a => a.catalogoId != null).map(a => Number(a.catalogoId)));
  let proximoId = Math.max(0, ...autos.map(a => Number(a.id) || 0)) + 1;
  for (const carro of carrosCatalogo) {
    if (catalogoIds.has(Number(carro.id))) continue;
    await api.post('/automoveis', dadosAutomovelCatalogo(carro, proximoId));
    catalogoIds.add(Number(carro.id));
    proximoId += 1;
  }
  return api.get('/automoveis');
}
/* Garante o vínculo de um carro específico e devolve seu registro no CRUD. */
async function garantirAutomovel(cid) {
  const carrosCatalogo = catalogo.length ? catalogo : await api.get('/catalogo');
  const c = carrosCatalogo.find(x => Number(x.id) === Number(cid));
  if (!c) throw new Error('Este carro não foi encontrado no catálogo.');
  const ja = (await api.get('/automoveis?catalogoId=' + encodeURIComponent(cid)))[0];
  if (ja) return { automovel: ja, criado: false };
  const todos = await api.get('/automoveis');
  const prox = Math.max(0, ...todos.map(a => Number(a.id) || 0)) + 1;
  const automovel = await api.post('/automoveis', dadosAutomovelCatalogo(c, prox));
  return { automovel, criado: true };
}
async function pedirCatalogo(cid) {
  try { const r = await garantirAutomovel(cid); await formPedido(null, r.automovel.id); } catch (x) { toast(x.message, 'danger'); }
}
async function paraFrota(cid) {
  try {
    const r = await garantirAutomovel(cid);
    toast(r.criado ? 'Carro adicionado ao CRUD. Abrindo a frota.' : 'Carro já cadastrado no CRUD. Abrindo a frota.');
    location.hash = '#frota';
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
    <td><div class="d-flex align-items-center gap-3">${thumb(c)}<div>${esc(c.marca)} ${esc(c.modelo)}<div class="small text-body-secondary">${esc(c.placa)}</div></div></div></td>
    <td>${fdate(p.dataInicio)} a ${fdate(p.dataFim)}</td><td>${PROP[p.propriedade]}${p.bancoId ? `<div class="small text-body-secondary">Crédito: ${esc(usr(p.bancoId)?.nome)}</div>` : ''}</td>
    <td>${badge(p.status)}${p.parecer ? `<div class="small text-body-secondary mt-1">${esc(p.parecer)}</div>` : ''}</td><td class="text-nowrap">${acts(p)}</td></tr>`; }).join('');
  $('#app').innerHTML = `<div class="d-flex justify-content-between align-items-center mb-3"><h1 class="h2 mb-0">${isAg() ? 'Pedidos para análise' : 'Meus pedidos'}</h1>
    ${isAg() ? '' : '<button class="btn btn-primary" onclick="formPedido()">Novo pedido</button>'}</div>
    <div class="card"><div class="table-responsive"><table class="table align-middle mb-0"><thead><tr><th>Nº</th>${isAg() ? '<th>Cliente</th>' : ''}<th>Automóvel</th><th>Período</th><th>Propriedade</th><th>Status</th><th>Ações</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="7" class="text-center py-4 text-body-secondary">Nenhum pedido ainda.${isAg() ? '' : ' Clique em “Novo pedido” para começar.'}</td></tr>`}</tbody></table></div></div>`;
}
async function formPedido(id, carId) {
  await sincronizarCatalogoComFrota();
  const [cars, us, p] = await Promise.all([api.get('/automoveis'), api.get('/usuarios'), id ? api.get('/pedidos/' + id) : {}]);
  const sel = (v, x) => v == x ? 'selected' : '', cur = id ? p.automovelId : carId;
  window._cars = cars; if (!id) { p.dataInicio = busca.ini; p.dataFim = busca.fim; }
  dlg(id ? 'Modificar pedido #' + id : 'Novo pedido de aluguel', `<div class="row g-3">
    <div class="col-12"><label class="form-label">Automóvel</label><select class="form-select" name="automovelId" required onchange="pvCar(this.value)">${cars.map(c => `<option value="${c.id}" ${sel(cur, c.id)}>${esc(c.marca)} ${esc(c.modelo)} (${c.ano}), placa ${esc(c.placa)}</option>`).join('')}</select></div>
    <div class="col-12" id="pv"></div>
    ${inp('dataInicio', 'Retirada', p.dataInicio, 'type="date" required')}${inp('dataFim', 'Devolução', p.dataFim, 'type="date" required')}
    <div class="col-md-6"><label class="form-label">Automóvel registrado como propriedade de</label><select class="form-select" name="propriedade">${Object.entries(PROP).map(([k, v]) => `<option value="${k}" ${sel(p.propriedade, k)}>${v}</option>`).join('')}</select></div>
    <div class="col-md-6"><label class="form-label">Contrato de crédito (opcional)</label><select class="form-select" name="bancoId"><option value="">Sem crédito</option>${us.filter(u => u.agenteTipo === 'banco').map(b => `<option value="${b.id}" ${sel(p.bancoId, b.id)}>${esc(b.nome)}</option>`).join('')}</select></div></div>`,
  async f => {
    const d = Object.fromEntries(new FormData(f));
    if (d.dataFim <= d.dataInicio) throw new Error('A devolução deve ser depois da retirada.');
    const body = { automovelId: Number(d.automovelId), dataInicio: d.dataInicio, dataFim: d.dataFim, propriedade: d.propriedade, bancoId: d.bancoId ? Number(d.bancoId) : null };
    if (id) await api.patch('/pedidos/' + id, body);
    else await api.post('/pedidos', { ...body, usuarioId: user.id, status: 'Em análise', parecer: '' });
    toast(id ? 'Pedido modificado.' : 'Pedido enviado para análise.');
    if (!id && location.hash !== '#pedidos') location.hash = '#pedidos'; else render();
  }, id ? 'Salvar alterações' : 'Enviar pedido');
  pvCar(cur || cars[0]?.id);
}
function pvCar(id) {
  const c = (window._cars || []).find(x => x.id == id); if (!c) return;
  $('#pv').innerHTML = `<div class="pv">${thumb(c)}<div><strong>${esc(c.marca)} ${esc(c.modelo)}</strong> ${tag(c.estado)}<div class="small text-body-secondary">${[c.km != null && kmFmt(c.km), c.localizacao].filter(Boolean).map(esc).join(', ')}</div></div></div>`;
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
  await sincronizarCatalogoComFrota();
  const cs = await api.get('/automoveis');
  $('#app').innerHTML = `<div class="d-flex justify-content-between align-items-center mb-3"><h1 class="h2 mb-0">Frota</h1><button class="btn btn-primary" onclick="formCarro()">Novo automóvel</button></div>
    <div class="card"><div class="table-responsive"><table class="table align-middle mb-0"><thead><tr><th>Automóvel</th><th>Matrícula</th><th>Ano</th><th>Placa</th><th>Propriedade</th><th></th></tr></thead><tbody>
    ${cs.map(c => `<tr><td><div class="d-flex align-items-center gap-3">${thumb(c)}<div>${esc(c.marca)} ${esc(c.modelo)}<div class="small text-body-secondary">${[c.estado && c.estado + ', ' + kmFmt(c.km), c.localizacao].filter(Boolean).map(esc).join(', ')}</div></div></div></td><td>${esc(c.matricula)}</td><td>${c.ano}</td><td>${esc(c.placa)}</td><td>${PROP[c.proprietario] || ''}</td><td><button class="btn btn-sm btn-outline-danger" onclick="excluirCarro(${c.id})">Excluir</button></td></tr>`).join('')}</tbody></table></div></div>`;
}
function formCarro() {
  dlg('Novo automóvel', `<div class="row g-3">${inp('matricula', 'Matrícula', '', 'required')}${inp('ano', 'Ano', '', 'type="number" min="1990" max="2100" required')}${inp('marca', 'Marca', '', 'required')}${inp('modelo', 'Modelo', '', 'required')}${inp('placa', 'Placa', '', 'required')}
    <div class="col-md-6"><label class="form-label">Propriedade</label><select class="form-select" name="proprietario">${Object.entries(PROP).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
    <div class="col-md-4"><label class="form-label">Estado</label><select class="form-select" name="estado"><option value="">Não informar</option>${Object.keys(ESTADO).map(e => `<option>${e}</option>`).join('')}</select></div>
    ${inp('km', 'Quilometragem', '', 'type="number" min="0"').replace('col-md-6', 'col-md-4')}${inp('localizacao', 'Localização', '', 'placeholder="Cidade, UF"').replace('col-md-6', 'col-md-4')}</div>`,
  async f => {
    const d = Object.fromEntries(new FormData(f)), b = { ...d, ano: Number(d.ano), km: Number(d.km || 0) };
    if (!b.estado) { delete b.estado; delete b.km; } if (!b.localizacao) delete b.localizacao;
    await api.post('/automoveis', b); toast('Automóvel cadastrado.'); render();
  });
}
async function excluirCarro(id) {
  if (!confirm('Excluir este automóvel?')) return;
  if ((await api.get('/pedidos?automovelId=' + id)).length) return toast('Há pedidos associados a este automóvel.', 'danger');
  await api.del('/automoveis/' + id); render();
}
async function viewPerfil() {
  const ps = await api.get(isAg() ? '/pedidos' : '/pedidos?usuarioId=' + user.id);
  const ex = ps.filter(p => p.status === 'Contrato executado'), aberto = ps.filter(p => ['Em análise', 'Aprovado'].includes(p.status)).length;
  const box = (titulo, corpo, cls = '') => `<section class="panel ${cls}"><h2 class="h5 mb-3">${titulo}</h2>${corpo}</section>`;
  const kv = itens => `<dl class="kv mb-0">${itens.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v) || '—'}</dd></div>`).join('')}</dl>`;
  const stat = (v, l) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`;
  const quem = `<section class="panel profile-id"><div class="avatar">${esc(initials(user.nome))}</div>
    <div class="flex-grow-1"><h1 class="h3 mb-1">${esc(user.nome)}</h1><div class="text-body-secondary">${esc(user.email)}</div>
    <span class="badge text-bg-secondary mt-2">${isAg() ? 'Agente: ' + esc(user.agenteTipo) : 'Cliente'}</span></div>
    <div class="d-flex gap-2 flex-wrap"><button class="btn btn-primary" onclick="editarUsuario(${user.id})">Editar cadastro</button><button class="btn btn-outline-danger" onclick="excluirUsuario(${user.id})">Excluir conta</button></div></section>`;
  const resumo = box('Resumo', `<div class="stats-2">${isAg()
    ? stat(ps.length, 'Pedidos na base') + stat(ps.filter(p => p.status === 'Em análise').length, 'Aguardando análise') + stat(ex.length, 'Contratos executados') + stat(aberto, 'Em andamento')
    : stat(ps.length, 'Pedidos feitos') + stat(aberto, 'Em andamento') + stat(ex.length, 'Contratos executados') + stat(brl0(renda(user)), 'Renda mensal')}</div>`);
  let basicas, renda2;
  if (isAg()) {
    basicas = box('Informações básicas', kv([['Nome', user.nome], ['E-mail', user.email], ['Tipo de agente', user.agenteTipo === 'banco' ? 'Banco' : 'Empresa']]));
    renda2 = '';
  } else {
    const emp = user.empregadores || [], tot = renda(user);
    basicas = box('Informações básicas', kv([['CPF', user.cpf], ['RG', user.rg], ['Endereço', user.endereco], ['Profissão', user.profissao]]));
    renda2 = box('Fontes de renda', (emp.map(e => `<div class="inc"><div class="d-flex justify-content-between gap-3"><span>${esc(e.nome)}</span><strong>${money(e.rendimento)}</strong></div><div class="bar"><i style="width:${tot ? Math.round(e.rendimento / tot * 100) : 0}%"></i></div></div>`).join('')
      || '<p class="text-body-secondary">Nenhuma fonte de renda informada. Edite o cadastro para incluir.</p>') + `<div class="d-flex justify-content-between pt-3 border-top"><span>Renda total</span><strong>${money(tot)}</strong></div>`, 'span-2');
  }
  $('#app').innerHTML = `<h1 class="h2 mb-3">Meu perfil</h1><div class="profile-grid">${quem}${resumo}${basicas}${renda2}</div>
    ${isAg() ? '' : '<p class="mt-4 mb-0">Seus carros alugados e pedidos anteriores estão em <a href="#historico">Meu histórico</a>.</p>'}`;
}

async function viewHistorico() {
  const [ps, cars] = await Promise.all([api.get('/pedidos?usuarioId=' + user.id), api.get('/automoveis')]);
  const car = id => cars.find(c => c.id == id) || {}, ex = ps.filter(p => p.status === 'Contrato executado');
  const seen = new Map();
  [...ex].sort((a, b) => b.dataFim.localeCompare(a.dataFim)).forEach(p => seen.has(p.automovelId) || seen.set(p.automovelId, p));
  const lib = [...seen.values()].map(p => {
    const c = car(p.automovelId), n = ex.filter(x => x.automovelId == p.automovelId).length;
    return `<article class="car"><div class="car-photo"><img src="${esc(fotoOf(c))}" alt="${esc(c.marca + ' ' + c.modelo)}" loading="lazy">${tag(c.estado)}</div>
      <div class="car-body"><h3 class="h6 mb-1">${esc(c.marca)} ${esc(c.modelo)}</h3><div class="small text-body-secondary">Último aluguel: ${fdate(p.dataInicio)} a ${fdate(p.dataFim)}</div>
      <div class="small mb-3">${n} ${n > 1 ? 'contratos' : 'contrato'} com este carro</div>
      <div class="car-foot"><button class="btn btn-outline-primary btn-sm" onclick="formPedido(null, ${c.id})">Alugar de novo</button></div></div></article>`;
  }).join('');
  const hist = [...ps].sort((a, b) => b.dataInicio.localeCompare(a.dataInicio)).map(p => { const c = car(p.automovelId); return `<li class="tl-item tl-${STATUS[p.status] || 'secondary'}"><div class="tl-body">${thumb(c)}
    <div class="flex-grow-1"><div class="fw-semibold">${esc(c.marca)} ${esc(c.modelo)} <span class="text-body-secondary fw-normal small">pedido #${p.id}</span></div>
    <div class="small text-body-secondary">${fdate(p.dataInicio)} a ${fdate(p.dataFim)}</div>${p.parecer ? `<div class="small mt-1">${esc(p.parecer)}</div>` : ''}</div>${badge(p.status)}</div></li>`; }).join('');
  $('#app').innerHTML = `<h1 class="h2 mb-4">Meu histórico</h1>
    <section class="mb-5"><h2 class="h4">Minha biblioteca</h2><p class="text-body-secondary">Carros que você já alugou com contrato executado.</p>
      <div class="car-grid">${lib || '<div class="empty">Seus contratos executados aparecem aqui. <a href="#catalogo">Ver catálogo</a></div>'}</div></section>
    <section><h2 class="h4 mb-3">Pedidos anteriores</h2>${hist ? `<ol class="timeline">${hist}</ol>` : '<div class="empty">Nenhum pedido ainda. <a href="#catalogo">Escolha um carro no catálogo</a></div>'}</section>`;
}

/* ---------- Roteador ---------- */
async function render() {
  renderNav();
  if (!user) return viewAuth();
  const h = location.hash || home(), views = { '#catalogo': viewCatalogo, '#pedidos': viewPedidos, '#historico': viewHistorico, '#perfil': viewPerfil, '#clientes': viewClientes, '#frota': viewFrota };
  try { await (views[h] && (isAg() ? h !== '#historico' : !['#clientes', '#frota'].includes(h)) ? views[h]() : views[home()]()); }
  catch (x) { $('#app').innerHTML = `<div class="alert alert-danger">${esc(x.message)}</div>`; }
}
addEventListener('hashchange', render);
render();
