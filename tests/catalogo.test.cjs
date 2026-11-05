const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const app = readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

class Element extends EventTarget {
  children = [];
  textContent = '';
  attributes = new Map();
  classList = { toggle() {} };

  set innerHTML(html) {
    this.html = html;
    this.children.length = 0;
  }

  get innerHTML() {
    return this.html ?? '';
  }

  appendChild(child) {
    this.children.push(child);
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
}

function press(element, key) {
  element.dispatchEvent(Object.assign(new Event('keydown'), { key }));
}

function openCatalog() {
  const grid = new Element();
  const count = new Element();
  const search = new Element();
  const catalogView = { id: 's2', hidden: true, dataset: {} };
  const detailView = { id: 's3', hidden: true, dataset: {} };
  const details = ['name', 'cat', 'pat'].map(() => new Element());
  const chips = new Map();
  for (const label of ['Todos', 'Notebooks', 'Monitores', 'Câmeras', 'Acessórios', 'Só disponíveis']) {
    const chip = new Element();
    chip.textContent = label;
    chips.set(label, chip);
  }

  const elements = new Map([
    ['catalog-grid', grid], ['catalog-count', count], ['catalog-search', search],
    ['detail-name', details[0]], ['detail-cat', details[1]], ['detail-pat', details[2]],
  ]);
  const chipRow = { querySelectorAll: () => [...chips.values()] };
  const views = [catalogView, detailView];
  const document = {
    readyState: 'loading',
    addEventListener() {},
    getElementById: (id) => elements.get(id) ?? null,
    createElement: () => new Element(),
    querySelector: (selector) => ({
      '#s2 .chips-row': chipRow,
      '.view:not([hidden])': views.find((view) => !view.hidden),
    })[selector] ?? null,
    querySelectorAll: (selector) => ({
      '#s2 .chips-row .chip': [...chips.values()],
      '.view': views,
    })[selector] ?? [],
  };
  const window = new EventTarget();
  window.scrollTo = () => {};
  let hash = '#s2';
  const location = {
    get hash() { return hash; },
    set hash(value) {
      if (hash === value) return;
      hash = value;
      window.dispatchEvent(new Event('hashchange'));
    },
  };
  const context = vm.createContext({ document, window, location });
  vm.runInContext(app, context, { filename: 'app.js' });
  // Sessão simulada. A inicialização usa o catálogo de demonstração do app.
  vm.runInContext("session = { user: { email: 'teste@example.test' } }; boot();", context);

  const cards = () => grid.children.filter((child) => child.className.startsWith('equip-card'));
  return {
    grid, count, catalogView, detailView, details, cards,
    card: (pat) => cards().find((card) => card.innerHTML.includes(pat)),
    assets: () => cards().map((card) => card.innerHTML.match(/PAT-\d+/u)?.[0]),
    filter: (label) => chips.get(label).dispatchEvent(new Event('click')),
    search: (value) => {
      search.value = value;
      search.dispatchEvent(new Event('input'));
    },
  };
}

test('CA-01 — catálogo exibe cada equipamento e ordena disponíveis primeiro', () => {
  const catalog = openCatalog();
  assert.equal(catalog.catalogView.hidden, false);
  const expected = [
    ['PAT-1042', 'MacBook Pro 14"', 'Notebook', 'Disponível'],
    ['PAT-0871', 'Dell UltraSharp 27"', 'Monitor', 'Disponível'],
    ['PAT-0455', 'Dock USB-C Anker', 'Acessório', 'Disponível'],
    ['PAT-1188', 'ThinkPad T14', 'Notebook', 'Emprestado'],
    ['PAT-0910', 'LG UltraFine 24"', 'Monitor', 'Manutenção'],
    ['PAT-0233', 'Sony A7 III', 'Câmera', 'Emprestado'],
  ];
  assert.deepEqual(catalog.assets(), expected.map(([pat]) => pat));
  for (const [pat, name, category, status] of expected) {
    const html = catalog.card(pat).innerHTML;
    assert.ok(html.includes(`>${name}</p>`));
    assert.ok(html.includes(`>${category} · ${pat}</p>`));
    assert.ok(html.includes(`>${status}</span>`));
  }
});

test('CA-02 — manutenção fica visível nas consultas e fora da disponibilidade', () => {
  const catalog = openCatalog();
  const maintenance = () => catalog.card('PAT-0910');
  assert.match(maintenance().innerHTML, />Manutenção<\/span>/u);
  maintenance().dispatchEvent(new Event('click'));
  press(maintenance(), 'Enter');
  press(maintenance(), ' ');
  assert.equal(catalog.detailView.hidden, true);
  assert.equal(maintenance().tabIndex, undefined);

  catalog.filter('Monitores');
  assert.match(maintenance().innerHTML, />Manutenção<\/span>/u);
  catalog.search('PAT-0910');
  assert.deepEqual(catalog.assets(), ['PAT-0910']);
  assert.match(maintenance().innerHTML, />Manutenção<\/span>/u);
  assert.equal(catalog.count.textContent, '1 de 6 equipamentos · 3 disponíveis');

  catalog.search('');
  catalog.filter('Só disponíveis');
  assert.equal(maintenance(), undefined);
  assert.deepEqual(catalog.assets(), ['PAT-0871']);
});

test('CA-03 — categoria e disponibilidade podem ser combinadas e removidas separadamente', () => {
  const catalog = openCatalog();
  for (const [category, expected] of [
    ['Notebooks', ['PAT-1042', 'PAT-1188']],
    ['Monitores', ['PAT-0871', 'PAT-0910']],
    ['Câmeras', ['PAT-0233']],
    ['Acessórios', ['PAT-0455']],
  ]) {
    catalog.filter(category);
    assert.deepEqual(catalog.assets(), expected);
  }
  catalog.filter('Monitores');
  catalog.filter('Só disponíveis');
  assert.deepEqual(catalog.assets(), ['PAT-0871']);
  catalog.filter('Só disponíveis');
  assert.deepEqual(catalog.assets(), ['PAT-0871', 'PAT-0910']);
  catalog.filter('Só disponíveis');
  catalog.filter('Todos');
  assert.deepEqual(catalog.assets(), ['PAT-1042', 'PAT-0871', 'PAT-0455']);
});

test('CA-04 — busca por nome, categoria ou patrimônio respeita filtros', () => {
  const catalog = openCatalog();
  for (const [query, expected] of [
    ['  uLtRaShArP  ', ['PAT-0871']],
    ['  mOnItOr  ', ['PAT-0871', 'PAT-0910']],
    ['  pAt-023  ', ['PAT-0233']],
  ]) {
    catalog.search(query);
    assert.deepEqual(catalog.assets(), expected);
  }
  catalog.filter('Monitores');
  catalog.filter('Só disponíveis');
  catalog.search('LG UltraFine');
  assert.deepEqual(catalog.assets(), []);
  catalog.search('');
  assert.deepEqual(catalog.assets(), ['PAT-0871']);
});

test('CA-05 — mensagem de lista vazia desaparece quando a busca volta a ter resultado', () => {
  const catalog = openCatalog();
  catalog.filter('Monitores');
  catalog.search('MacBook');
  assert.deepEqual(catalog.assets(), []);
  assert.equal(catalog.grid.children.length, 1);
  assert.equal(catalog.grid.children[0].textContent,
    'Nada encontrado por aqui. Tente outro filtro ou outra busca.');
  catalog.search('Dell');
  assert.deepEqual(catalog.assets(), ['PAT-0871']);
  assert.equal(catalog.grid.children.length, 1);
});

test('CA-06 — clique, Enter e Espaço abrem os detalhes do cartão disponível selecionado', () => {
  for (const activate of [
    (card) => card.dispatchEvent(new Event('click')),
    (card) => press(card, 'Enter'),
    (card) => press(card, ' '),
  ]) {
    const catalog = openCatalog();
    for (const pat of ['PAT-1188', 'PAT-0910']) {
      const card = catalog.card(pat);
      assert.equal(card.tabIndex, undefined);
      assert.equal(card.attributes.has('role'), false);
      activate(card);
      assert.equal(catalog.detailView.hidden, true);
    }
    const available = catalog.card('PAT-0871');
    assert.equal(available.tabIndex, 0);
    assert.equal(available.attributes.get('role'), 'button');
    activate(available);
    assert.equal(catalog.detailView.hidden, false);
    assert.deepEqual(catalog.details.map((detail) => detail.textContent),
      ['Dell UltraSharp 27"', 'Monitor', 'PAT-0871']);
  }
});

test('CA-07 — contador usa os dados na lista geral e nas seleções', () => {
  const catalog = openCatalog();
  assert.equal(catalog.count.textContent, '6 equipamentos · 3 disponíveis agora');
  catalog.search('   ');
  assert.equal(catalog.count.textContent, '6 equipamentos · 3 disponíveis agora');
  catalog.filter('Monitores');
  assert.equal(catalog.count.textContent, '2 de 6 equipamentos · 3 disponíveis');
  catalog.filter('Só disponíveis');
  assert.equal(catalog.count.textContent, '1 de 6 equipamentos · 3 disponíveis');
  catalog.search('sem resultado');
  assert.equal(catalog.count.textContent, '0 de 6 equipamentos · 3 disponíveis');
  catalog.search('');
  catalog.filter('Só disponíveis');
  catalog.filter('Todos');
  assert.equal(catalog.count.textContent, '6 equipamentos · 3 disponíveis agora');
});
