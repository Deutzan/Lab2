const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../db.json');

test('cada carro do catálogo também está disponível na frota/CRUD', () => {
  const frotaPorCatalogo = new Map(db.automoveis.map(carro => [Number(carro.catalogoId), carro]));
  for (const carroCatalogo of db.catalogo) {
    const carroFrota = frotaPorCatalogo.get(Number(carroCatalogo.id));
    assert.ok(carroFrota, `Faltou o carro ${carroCatalogo.marca} ${carroCatalogo.modelo} na frota`);
    assert.equal(carroFrota.marca, carroCatalogo.marca);
    assert.equal(carroFrota.modelo, carroCatalogo.modelo);
  }
});

test('todos os carros do catálogo usam fotografias reais hospedadas no Wikimedia Commons', () => {
  for (const carro of db.catalogo) {
    assert.match(carro.fotoUri || '', /^https:\/\/commons\.wikimedia\.org\//,
      `Foto real ausente para ${carro.marca} ${carro.modelo}`);
    assert.match(carro.fotoFonte || '', /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/,
      `Fonte/atribuição ausente para ${carro.marca} ${carro.modelo}`);
  }
});

test('o catálogo não contém marcas e modelos fictícios', () => {
  const nomes = db.catalogo.map(c => `${c.marca} ${c.modelo}`.toLowerCase());
  assert.equal(nomes.some(n => n.includes('torq') || n.includes('aurora') || n.includes('vento gt') || n.includes('trilha suv')), false);
});
