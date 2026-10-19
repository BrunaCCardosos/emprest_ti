/* =========================================================================
   EmpresTI — front-end do protótipo (telas 01–06)
   -------------------------------------------------------------------------
   Autenticação  Supabase Auth (e-mail + senha) com a chave PÚBLICA definida
                 em config.js. persistSession:false — a sessão vive em memória
                 enquanto a página está aberta e nunca é gravada em
                 localStorage/sessionStorage.
   Fluxo         tela de login (#s1) → app. As demais telas só abrem com sessão
                 ativa; uma tela por vez, roteada pelo hash da URL. Telas de
                 Operações (#s5, #s6) exigem perfil de Operações.
   Telas         renderizadas a partir do estado em memória, aplicando as
                 regras do PRD: até 3 itens simultâneos por pessoa, prazo de 14
                 dias, atraso bloqueia nova solicitação e item em manutenção
                 não fica disponível.
   Dados         de exemplo (docs/layout.md). Não há API tRPC neste pacote: o
                 cadastro de equipamento real é gravado pelo procedimento tRPC
                 da aplicação Next.js; aqui a tela valida o formulário e
                 mantém a prévia do catálogo.
   ========================================================================= */

/* ---------- 0 · utilidades ---------- */
function byId(id){ return document.getElementById(id); }
function qsa(selector, root){ return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }

function initialsOf(name){
  const parts = String(name || '').trim().split(/[\s._@-]+/).filter(Boolean);
  if(!parts.length) return '--';
  if(parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function matchesQuery(query, values){
  const q = String(query || '').trim().toLowerCase();
  if(!q) return true;
  return values.some(function(value){ return String(value || '').toLowerCase().indexOf(q) !== -1; });
}

function setMessage(el, kind, text){
  if(!el) return;
  if(!text){
    el.hidden = true;
    el.textContent = '';
    return;
  }
  el.classList.remove('form-message', 'info', 'ok', 'warn', 'error');
  el.classList.add('form-message');
  if(kind) el.classList.add(kind);
  el.textContent = text;
  el.hidden = false;
}

function emptyState(text){
  const el = document.createElement('div');
  el.className = 'empty-state';
  el.textContent = text;
  return el;
}

/* ---------- 1 · configuração pública + cliente de autenticação ---------- */
const CONFIG = window.EMPRESTI_CONFIG || {};
const SUPA_LIB = window.supabase;
const NETWORK_MSG = 'Não foi possível falar com o Supabase. Verifique a conexão e sirva a pasta por HTTP (ex.: npx serve docs): abrir o arquivo direto (file://) pode ser bloqueado pelo navegador.';

let auth = null;
let session = null;

function createAuthClient(){
  if(!SUPA_LIB || typeof SUPA_LIB.createClient !== 'function') return null;
  if(!CONFIG.supabaseUrl || !CONFIG.supabasePublishableKey) return null;
  const authOptions = Object.assign({
    persistSession: false,      // proibido guardar sessão em localStorage/sessionStorage
    autoRefreshToken: true,
    detectSessionInUrl: false,
  }, CONFIG.auth || {});
  return SUPA_LIB.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey, { auth: authOptions });
}

auth = createAuthClient();
const AUTH_AVAILABLE = !!auth;

/* ---------- 2 · regras de negócio (PRD) ---------- */
const MAX_ITEMS = 3;            // máximo de itens simultâneos por colaborador
const LOAN_DAYS = 14;           // prazo padrão de devolução
const OPS_PAGE_SIZE = 7;        // linhas por página em Operações
const TODAY_LABEL = '21/set';   // data de referência do protótipo (docs/layout.md)
const DUE_LABEL = '05/out';     // TODAY_LABEL + LOAN_DAYS

/* ---------- 3 · dados de exemplo ---------- */
const DEMO_USER = {
  colaborador: {initials:'MA', name:'Marina Alves', role:'Design'},
  operacoes:   {initials:'OP', name:'Operações', role:'Balcão · 2º andar'},
};

const SIDEBARS = [
  {id:'sidebar-2', active:'#s2', user:'colaborador'},
  {id:'sidebar-3', active:'#s2', user:'colaborador'},
  {id:'sidebar-4', active:'#s4', user:'colaborador'},
  {id:'sidebar-5', active:'#s5', user:'operacoes'},
  {id:'sidebar-6', active:'#s6', user:'operacoes'},
];

const NAV_ITEMS = [
  {group:'Colaborador', items:[
    {icon:'i-grid', label:'Catálogo', href:'#s2'},
    {icon:'i-handdown', label:'Meus empréstimos', href:'#s4', counter:'loans'},
  ]},
  {group:'Operações', items:[
    {icon:'i-listchecks', label:'Empréstimos em aberto', href:'#s5'},
    {icon:'i-plussquare', label:'Cadastrar equipamento', href:'#s6'},
  ]},
];

const CATALOG_CHIPS = {
  'Todos':      function(){ return true; },
  'Notebooks':  function(item){ return item.category === 'Notebook'; },
  'Monitores':  function(item){ return item.category === 'Monitor'; },
  'Câmeras':    function(item){ return item.category === 'Câmera'; },
  'Acessórios': function(item){ return item.category === 'Acessório'; },
};

const OPS_CHIPS = {
  'Todos':              function(){ return true; },
  'Em atraso':          function(row){ return row.state === 'late'; },
  'Vencem esta semana': function(row){ return row.week === true; },
  'Notebooks':          function(row){ return row.category === 'Notebook'; },
};

const state = {
  catalog: [
    {icon:'i-laptop',  name:'MacBook Pro 14"',     meta:'Notebook · PAT-1042',  category:'Notebook',  pat:'PAT-1042', dueLabel:DUE_LABEL, state:'ok'},
    {icon:'i-laptop',  name:'ThinkPad T14',        meta:'Notebook · PAT-1188',  category:'Notebook',  pat:'PAT-1188', state:'borrowed', with:'Camila Duarte', due:'27/set'},
    {icon:'i-monitor', name:'Dell UltraSharp 27"', meta:'Monitor · PAT-0871',   category:'Monitor',   pat:'PAT-0871', dueLabel:DUE_LABEL, state:'ok'},
    {icon:'i-monitor', name:'LG UltraFine 24"',    meta:'Monitor · PAT-0910',   category:'Monitor',   pat:'PAT-0910', state:'maint', note:'Aguardando peça'},
    {icon:'i-camera',  name:'Sony A7 III',         meta:'Câmera · PAT-0233',    category:'Câmera',    pat:'PAT-0233', state:'borrowed', with:'Rafael Lima', due:'02/out'},
    {icon:'i-usb',     name:'Dock USB-C Anker',    meta:'Acessório · PAT-0455', category:'Acessório', pat:'PAT-0455', dueLabel:DUE_LABEL, state:'ok'},
  ],
  loans: [
    {icon:'i-monitor', name:'Dell UltraSharp 27"', pat:'PAT-0871', meta:'PAT-0871 · retirado em 10/set', dueLabel:'28/set', progress:0.5},
    {icon:'i-usb',     name:'Dock USB-C Anker',    pat:'PAT-0455', meta:'PAT-0455 · retirado em 15/set', dueLabel:'05/out', progress:0.3},
  ],
  ops: [
    {item:'MacBook Pro 14"',       pat:'PAT-1042', category:'Notebook',  person:'Marina Alves',  out:'10/set', due:'24/set', state:'ok',   label:'No prazo', week:true},
    {item:'ThinkPad T14',          pat:'PAT-1188', category:'Notebook',  person:'Camila Duarte', out:'02/set', due:'16/set', state:'late', label:'Atraso de 5 dias'},
    {item:'Sony A7 III',           pat:'PAT-0233', category:'Câmera',     person:'Rafael Lima',   out:'18/set', due:'02/out', state:'ok',   label:'No prazo'},
    {item:'Projetor Epson X49',    pat:'PAT-0102', category:'Projetor',   person:'Helena Prado',  out:'01/set', due:'15/set', state:'late', label:'Atraso de 6 dias'},
    {item:'ThinkPad T14',          pat:'PAT-1190', category:'Notebook',  person:'Tiago Menezes', out:'30/ago', due:'13/set', state:'late', label:'Atraso de 8 dias'},
    {item:'Dock USB-C Anker',      pat:'PAT-0455', category:'Acessório',  person:'Ana Sato',      out:'15/set', due:'29/set', state:'ok',   label:'No prazo', week:true},
    {item:'Adaptador HDMI Belkin', pat:'PAT-0338', category:'Acessório',  person:'Bruno Kato',    out:'19/set', due:'03/out', state:'ok',   label:'No prazo'},
  ],
  stats: {open:21, late:3},
  filters: {
    catalog: {chip:'Todos', onlyAvailable:false, query:''},
    ops:     {chip:'Todos', query:''},
  },
  opsPage: 1,
  examples: {catalogCount:''},
  pendingItem: null,
};

/* ---------- 4 · sidebar ---------- */
function sessionUser(){
  if(!session || !session.user) return null;
  const user = session.user;
  const meta = user.user_metadata || {};
  const label = meta.full_name || meta.name || user.email || 'Sessão ativa';
  return {
    initials: initialsOf(meta.full_name || meta.name || user.email),
    name: label,
    email: user.email || '',
    role: isOps() ? 'Operações' : 'Colaborador',
  };
}

/* Perfil: vem do JWT do Supabase (app_metadata.role, definido só pelo servidor;
   user_metadata.role como alternativa). O papel real é o `memberships.role`
   (ADMIN = Operações) e é imposto no servidor pelo tRPC — aqui só decide o que
   mostrar. */
function isOps(){
  if(!session || !session.user) return false;
  const raw = (session.user.app_metadata && session.user.app_metadata.role) ||
              (session.user.user_metadata && session.user.user_metadata.role) || '';
  return ['admin', 'operacoes', 'operações', 'ops'].indexOf(String(raw).trim().toLowerCase()) !== -1;
}

function renderSidebar(config){
  const el = byId(config.id);
  if(!el) return;
  const user = sessionUser() || DEMO_USER[config.user];
  let html = `<div class="brand">
      <div class="brand-mark"><svg class="icon" width="15" height="15"><use href="#i-package"/></svg></div>
      <span class="brand-name">EmpresTI</span>
    </div>`;
  NAV_ITEMS.forEach(function(group){
    if(group.group === 'Operações' && !isOps()) return;
    html += `<div class="nav-group"><p class="nav-label">${group.group}</p>`;
    group.items.forEach(function(item){
      const active = item.href === config.active;
      const badge = (item.counter === 'loans' && state.loans.length)
        ? `<span class="nav-badge">${state.loans.length}</span>`
        : '';
      html += `<a class="nav-item${active ? ' active' : ''}" href="${item.href}">
          <svg class="icon" width="16" height="16"><use href="#${item.icon}"/></svg>
          <span>${item.label}</span>
          ${badge}
        </a>`;
    });
    html += `</div>`;
  });
  html += `<div class="sidebar-user">
      <div class="avatar">${user.initials}</div>
      <div class="user-meta"><div class="name" title="${user.email || ''}">${user.name}</div><div class="role">${user.role}</div></div>
      <button class="logout-btn" type="button" data-action="logout">Sair</button>
    </div>`;
  el.innerHTML = html;
}

function renderSidebars(){ SIDEBARS.forEach(renderSidebar); }

/* ---------- 5 · catálogo (tela 02) ---------- */
function catalogCard(item){
  const card = document.createElement('div');
  let pill = '', footer = '', clickable = '';
  if(item.state === 'ok'){
    pill = '<span class="pill pill-ok">Disponível</span>';
    footer = '<span style="color:#8AA6EE;">Solicitar →</span>';
    clickable = ' clickable';
  }
  if(item.state === 'borrowed'){
    pill = '<span class="pill pill-borrowed">Emprestado</span>';
    footer = `<span style="color:#5E6884;">Com ${item.with} · devolve ${item.due}</span>`;
  }
  if(item.state === 'maint'){
    pill = '<span class="pill pill-maint">Manutenção</span>';
    footer = `<span style="color:#5E6884;">${item.note}</span>`;
  }
  card.className = 'equip-card' + clickable;
  card.innerHTML = `
      <div class="equip-card-top">
        <div class="equip-icon"><svg class="icon" width="20" height="20"><use href="#${item.icon}"/></svg></div>
        ${pill}
      </div>
      <p class="equip-name">${item.name}</p>
      <p class="equip-meta">${item.meta}</p>
      <p class="equip-footer">${footer}</p>`;
  if(item.state === 'ok') card.addEventListener('click', function(){ state.pendingItem = item; renderDetail(); location.hash = '#s3'; });
  return card;
}

function syncChips(rowSelector, activeLabel, onlyAvailable){
  const row = document.querySelector(rowSelector);
  if(!row) return;
  qsa('.chip', row).forEach(function(chip){
    const label = chip.textContent.trim();
    if(label === 'Só disponíveis') chip.classList.toggle('active', !!onlyAvailable);
    else chip.classList.toggle('active', label === activeLabel);
  });
}

function renderCatalog(){
  const filter = state.filters.catalog;
  const predicate = CATALOG_CHIPS[filter.chip] || CATALOG_CHIPS['Todos'];
  const items = state.catalog.filter(function(item){
    return predicate(item) &&
      (!filter.onlyAvailable || item.state === 'ok') &&
      matchesQuery(filter.query, [item.name, item.meta, item.pat, item.category]);
  });

  const grid = byId('catalog-grid');
  if(grid){
    grid.innerHTML = '';
    if(items.length) items.forEach(function(item){ grid.appendChild(catalogCard(item)); });
    else grid.appendChild(emptyState('Nenhum equipamento com esse filtro.'));
  }

  const count = byId('catalog-count');
  if(count){
    const filtered = filter.chip !== 'Todos' || filter.onlyAvailable || !!filter.query;
    const available = state.catalog.filter(function(item){ return item.state === 'ok'; }).length;
    count.textContent = filtered
      ? items.length + ' de ' + state.catalog.length + ' equipamentos · ' + available + ' disponíveis'
      : state.examples.catalogCount;
  }

  syncChips('#s2 .chips-row', filter.chip, filter.onlyAvailable);
}

/* ---------- 5b · detalhe do item (tela 03) ---------- */
const DETAIL_DEMO_DESC = 'Notebook de alta performance para desenvolvimento e edição. Acompanha carregador USB-C original. Recomendado para uso em escritório e viagens curtas.';

function renderDetail(){
  const item = state.pendingItem;
  if(!item) return;
  const set = function(id, text){ const el = byId(id); if(el) el.textContent = text; };
  set('detail-name', item.name);
  set('detail-crumb-name', item.name);
  set('detail-crumb-cat', item.category);
  set('detail-cat', item.category);
  set('detail-pat', item.pat);
  set('detail-due', item.dueLabel || DUE_LABEL);
  const icon = byId('detail-icon');
  if(icon) icon.setAttribute('href', '#' + item.icon);
  // descrição e histórico de exemplo existem só para o MacBook Pro 14"
  const demo = item.pat === 'PAT-1042';
  set('detail-desc', demo ? DETAIL_DEMO_DESC : item.category + ' · ' + item.pat + '. A retirada é feita no balcão de Operações.');
  const hist = byId('detail-history');
  if(hist) hist.hidden = !demo;
  setMessage(byId('detail-message'), '', '');
}

/* ---------- 6 · meus empréstimos (tela 04) ---------- */
function renderLimitSegments(container, filled){
  if(!container) return;
  let html = '';
  for(let i = 0; i < MAX_ITEMS; i++) html += `<div class="limit-seg${i < filled ? ' filled' : ''}"></div>`;
  container.innerHTML = html;
}

function hasOverdue(){
  return state.loans.some(function(loan){ return loan.late === true; });
}

function renderLoanRow(loan){
  const row = document.createElement('div');
  row.className = 'loan-row';
  row.innerHTML = `
      <div class="loan-icon"><svg class="icon" width="21" height="21"><use href="#${loan.icon}"/></svg></div>
      <div class="loan-info"><p class="n">${loan.name}</p><p class="m">${loan.meta}</p></div>
      <div class="loan-deadline">
        <p class="lbl">Devolver até ${loan.dueLabel}</p>
        <div class="deadline-track"><div class="deadline-fill" style="width:${loan.progress * 100}%"></div></div>
      </div>
      <button class="btn btn-row" type="button">Devolver</button>`;
  row.querySelector('.btn-row').addEventListener('click', function(){ returnLoan(loan, row); });
  return row;
}

function renderLoanCounters(){
  const label = state.loans.length + ' de ' + MAX_ITEMS + ' itens com você';
  [document.querySelector('#s2 .header-meta'), document.querySelector('#s3 .header-meta')].forEach(function(el){
    if(el) el.textContent = label;
  });

  const used = byId('detail-items-count');
  if(used) used.textContent = state.loans.length + ' de ' + MAX_ITEMS;
  renderLimitSegments(document.querySelector('#s3 .limit-segments'), state.loans.length);

  const sideNote = byId('detail-side-note');
  if(sideNote){
    const next = Math.min(state.loans.length + 1, MAX_ITEMS);
    if(state.loans.length >= MAX_ITEMS){
      sideNote.textContent = 'Você está no limite de ' + MAX_ITEMS + ' itens. Devolva um item para solicitar outro equipamento.';
    } else if(next >= MAX_ITEMS){
      sideNote.textContent = 'Este pedido levará você a ' + next + ' de ' + MAX_ITEMS + ' itens.';
    } else {
      sideNote.textContent = 'Você está com ' + state.loans.length + ' de ' + MAX_ITEMS + ' itens.';
    }
  }

  const note = byId('detail-note');
  if(note){
    note.textContent = hasOverdue()
      ? 'Você tem item em atraso: regularize a devolução no balcão de Operações para solicitar outro equipamento.'
      : 'A retirada é feita no balcão de Operações, 2º andar.';
  }

  const button = byId('open-dialog-btn');
  if(button){
    const blocked = state.loans.length >= MAX_ITEMS || hasOverdue();
    button.disabled = blocked;
    button.style.opacity = blocked ? '.45' : '';
  }
}

function renderLoans(){
  const list = byId('loan-rows');
  if(list){
    list.innerHTML = '';
    if(state.loans.length) state.loans.forEach(function(loan){ list.appendChild(renderLoanRow(loan)); });
    else list.appendChild(emptyState('Nenhum item com você agora.'));
  }

  const sub = byId('loans-sub');
  if(sub){
    const late = state.loans.filter(function(loan){ return loan.late === true; }).length;
    sub.textContent = state.loans.length + ' de ' + MAX_ITEMS + ' itens · ' +
      (late ? late + ' em atraso' : 'nenhum em atraso');
  }

  renderLimitSegments(document.querySelector('#s4 .limit-segments'), state.loans.length);
  renderLoanCounters();
}

/* ---------- 7 · operações (tela 05) ---------- */
function renderOpsRow(data){
  const row = document.createElement('div');
  row.className = 't-row t-body-row' + (data.state === 'late' ? ' late' : '');
  row.style.gridTemplateColumns = '1.3fr 1.1fr 120px 120px 150px 110px';
  row.innerHTML = `
      <span style="font-weight:600;">${data.item} <span style="color:#5E6884; font-weight:400;">· ${data.pat}</span></span>
      <span>${data.person}</span>
      <span style="color:#7C86A2;">${data.out}</span>
      <span style="color:#7C86A2;">${data.due}</span>
      <span class="pill ${data.state === 'late' ? 'pill-late' : 'pill-ok'}">${data.label}</span>
      <button class="btn btn-table${data.state === 'late' ? ' late' : ''}" type="button">Devolver</button>`;
  row.querySelector('button').addEventListener('click', function(){ returnOpRow(data, row); });
  return row;
}

function filterOps(){
  const filter = state.filters.ops;
  const predicate = OPS_CHIPS[filter.chip] || OPS_CHIPS['Todos'];
  return state.ops.filter(function(row){
    return predicate(row) && matchesQuery(filter.query, [row.item, row.pat, row.person]);
  });
}

function renderOps(){
  const filtered = filterOps();
  const pages = Math.max(1, Math.ceil(filtered.length / OPS_PAGE_SIZE));
  if(state.opsPage > pages) state.opsPage = pages;
  if(state.opsPage < 1) state.opsPage = 1;
  const start = (state.opsPage - 1) * OPS_PAGE_SIZE;
  const visible = filtered.slice(start, start + OPS_PAGE_SIZE);

  const container = byId('ops-rows');
  if(container){
    container.innerHTML = '';
    if(visible.length) visible.forEach(function(row){ container.appendChild(renderOpsRow(row)); });
    else container.appendChild(emptyState('Nenhum empréstimo em aberto com esse filtro.'));
  }

  const info = byId('ops-pagination');
  if(info) info.textContent = visible.length + ' de ' + state.stats.open + ' empréstimos';

  const prev = byId('ops-prev');
  if(prev) prev.disabled = state.opsPage <= 1;
  const next = byId('ops-next');
  if(next) next.disabled = state.opsPage >= pages;

  syncChips('#s5 .chips-row', state.filters.ops.chip, false);
}

function renderStats(){
  const open = byId('stat-open');
  if(open) open.textContent = String(state.stats.open);
  const late = byId('stat-late');
  if(late) late.textContent = String(state.stats.late);
}

/* ---------- 8 · devoluções ---------- */
function returnLoan(loan, row){
  row.style.overflow = 'hidden';
  row.style.opacity = '0';
  row.style.maxHeight = row.offsetHeight + 'px';
  requestAnimationFrame(function(){
    row.style.transition = 'opacity 200ms ease-in, max-height 200ms ease-in, padding 200ms ease-in, margin 200ms ease-in';
    row.style.maxHeight = '0px';
    row.style.paddingTop = '0';
    row.style.paddingBottom = '0';
  });
  setTimeout(function(){
    const index = state.loans.indexOf(loan);
    if(index > -1) state.loans.splice(index, 1);

    const item = state.catalog.find(function(entry){
      return entry.pat === loan.pat && entry.state === 'borrowed' && entry.with === 'Você';
    });
    if(item){
      item.state = 'ok';
      delete item.with;
      delete item.due;
    }

    renderCatalog();
    renderLoans();
    renderSidebars();
  }, 210);
}

function returnOpRow(data, row){
  row.classList.add('exit');
  row.style.opacity = '0';
  setTimeout(function(){
    const index = state.ops.indexOf(data);
    if(index > -1) state.ops.splice(index, 1);
    if(state.stats.open > 0) state.stats.open--;
    if(data.state === 'late' && state.stats.late > 0) state.stats.late--;
    renderOps();
    renderStats();
  }, 200);
}

/* ---------- 9 · solicitação de empréstimo (tela 03) ---------- */
function openLoanDialog(){
  const backdrop = byId('dialog-backdrop');
  const item = state.pendingItem;
  if(!backdrop || !item) return;

  if(state.loans.length >= MAX_ITEMS){
    setMessage(byId('detail-message'), 'warn',
      'Limite de ' + MAX_ITEMS + ' itens simultâneos atingido. Devolva um item para solicitar outro.');
    return;
  }
  if(hasOverdue()){
    setMessage(byId('detail-message'), 'warn', 'Você tem item em atraso e não pode solicitar novo empréstimo.');
    return;
  }
  setMessage(byId('detail-message'), '', '');

  const total = state.loans.length + 1;
  const body = byId('dialog-body');
  if(body){
    body.innerHTML = 'Você está solicitando <strong style="color:#E6EAF6;">' + item.name + ' (' + item.pat + ')</strong>, ' +
      'com devolução prevista para <strong style="color:#E6EAF6;">' + (item.dueLabel || DUE_LABEL) + '</strong>.';
  }
  const note = byId('dialog-note');
  if(note){
    note.textContent = total >= MAX_ITEMS
      ? 'Este pedido levará você a ' + total + ' de ' + MAX_ITEMS + ' itens permitidos. Você não poderá solicitar outro equipamento até devolver algum item.'
      : 'Você passará a ter ' + total + ' de ' + MAX_ITEMS + ' itens. O prazo padrão de devolução é de ' + LOAN_DAYS + ' dias.';
  }
  backdrop.classList.add('open');
}

function closeLoanDialog(){
  const backdrop = byId('dialog-backdrop');
  if(backdrop) backdrop.classList.remove('open');
}

function confirmLoan(){
  const item = state.pendingItem;
  closeLoanDialog();
  if(!item || state.loans.length >= MAX_ITEMS || hasOverdue()) return;

  state.loans.push({
    icon: item.icon,
    name: item.name,
    pat: item.pat,
    meta: item.pat + ' · retirado em ' + TODAY_LABEL,
    dueLabel: item.dueLabel || DUE_LABEL,
    progress: 0.12,
  });
  item.state = 'borrowed';
  item.with = 'Você';
  item.due = item.dueLabel;

  renderCatalog();
  renderLoans();
  renderSidebars();
  location.hash = '#s4';
}

/* ---------- 10 · cadastro de equipamento (tela 06) ---------- */
const SITUACAO_LABEL = {disponivel:'Disponível', manutencao:'Em manutenção', fora:'Fora de uso'};

function fieldValue(id){
  const el = byId(id);
  return el ? String(el.value).trim() : '';
}

function currentSituacao(){
  const active = document.querySelector('#reg-situacao button.active');
  return (active && active.dataset.val) ? active.dataset.val : 'disponivel';
}

function updatePreview(){
  const nome = byId('preview-nome');
  if(nome) nome.textContent = fieldValue('reg-nome') || 'Nome do equipamento';
  const meta = byId('preview-meta');
  if(meta) meta.textContent = (fieldValue('reg-categoria') || 'Notebook') + ' · ' + (fieldValue('reg-pat') || 'PAT-0000');
}

function submitRegister(another){
  const nome = fieldValue('reg-nome');
  const pat = fieldValue('reg-pat');
  const message = byId('reg-message');

  if(!nome){
    setMessage(message, 'error', 'Informe o nome do equipamento.');
    const el = byId('reg-nome');
    if(el) el.focus();
    return;
  }
  if(!/^PAT-\d{3,}$/i.test(pat)){
    setMessage(message, 'error', 'Patrimônio no formato PAT-0000.');
    const el = byId('reg-pat');
    if(el) el.focus();
    return;
  }

  setMessage(message, 'info',
    'Formulário validado: ' + nome + ' · ' + pat + ' · ' + SITUACAO_LABEL[currentSituacao()] + '. ' +
    'Neste protótipo o registro fica só na tela — a gravação é feita pelo procedimento tRPC da aplicação.');

  if(another){
    ['reg-nome','reg-pat','reg-serie','reg-obs'].forEach(function(id){
      const el = byId(id);
      if(el) el.value = '';
    });
    updatePreview();
    const el = byId('reg-nome');
    if(el) el.focus();
  }
}

/* ---------- 11 · login e sessão (tela 01) ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isNetworkError(error){
  if(!error) return false;
  if(error.name === 'AuthRetryableFetchError') return true;
  if(error.status === 0) return true;
  return /failed to fetch|network|load failed/i.test(error.message || '');
}

function loginErrorMessage(error){
  const code = (error && (error.code || error.error_code)) || '';
  if(code === 'invalid_credentials') return 'E-mail ou senha inválidos.';
  if(code === 'email_not_confirmed') return 'Confirme seu e-mail antes de entrar.';
  if(code === 'user_banned') return 'Usuário bloqueado. Fale com Operações.';
  if(code === 'over_request_rate_limit' || code === 'too_many_requests'){
    return 'Muitas tentativas. Aguarde um instante e tente novamente.';
  }
  return 'Não foi possível entrar: ' + ((error && error.message) || 'erro desconhecido') + '.';
}

/* ---------- 11b · roteador (uma tela por vez) ---------- */
const LOGIN_ROUTE = '#s1';
const HOME_ROUTE = '#s2';
const OPS_ROUTES = ['#s5', '#s6'];
const ROUTES = ['#s1', '#s2', '#s3', '#s4', '#s5', '#s6'];

function resolveRoute(){
  const wanted = ROUTES.indexOf(location.hash) !== -1 ? location.hash : '';
  if(!session) return LOGIN_ROUTE;                              // sem sessão: só o login
  if(!wanted || wanted === LOGIN_ROUTE) return HOME_ROUTE;      // logado: login não faz sentido
  if(OPS_ROUTES.indexOf(wanted) !== -1 && !isOps()) return HOME_ROUTE;
  return wanted;
}

function route(){
  const target = resolveRoute();
  if(location.hash !== target){
    // replace: não deixa a tela barrada no histórico do botão "voltar"
    history.replaceState(null, '', target);
  }
  closeLoanDialog();
  qsa('.view').forEach(function(view){ view.hidden = ('#' + view.id) !== target; });
  const current = document.querySelector('.view:not([hidden])');
  document.title = (current && current.dataset.title ? current.dataset.title + ' · ' : '') + 'EmpresTI';
  window.scrollTo(0, 0);
  if(target === LOGIN_ROUTE){
    const email = byId('login-email');
    if(email && !email.value) email.focus();
  }
}

function applySession(){
  renderSidebars();
  route();
}

async function handleLogin(event){
  if(event) event.preventDefault();
  const message = byId('login-message');
  const emailEl = byId('login-email');
  const senhaEl = byId('login-senha');
  const submit = byId('login-submit');
  const email = emailEl ? emailEl.value.trim() : '';
  const senha = senhaEl ? senhaEl.value : '';

  if(!email || !senha){
    setMessage(message, 'warn', 'Informe e-mail e senha.');
    return;
  }
  if(!EMAIL_RE.test(email)){
    setMessage(message, 'warn', 'E-mail inválido. Use o formato nome@empresa.com.');
    return;
  }
  if(!AUTH_AVAILABLE){
    setMessage(message, 'error', 'Autenticação indisponível: a biblioteca do Supabase não foi carregada. ' + NETWORK_MSG);
    return;
  }

  if(submit) submit.disabled = true;
  setMessage(message, 'info', 'Entrando…');
  try {
    const result = await auth.auth.signInWithPassword({email: email, password: senha});
    if(result.error){
      setMessage(message, 'error', isNetworkError(result.error) ? NETWORK_MSG : loginErrorMessage(result.error));
      return;
    }
    session = result.data.session || null;
    if(senhaEl) senhaEl.value = '';
    setMessage(message, '', '');
    applySession();   // com sessão ativa, o roteador leva ao catálogo
  } catch (error) {
    setMessage(message, 'error', isNetworkError(error)
      ? NETWORK_MSG
      : 'Falha inesperada ao entrar: ' + ((error && error.message) || error));
  } finally {
    if(submit) submit.disabled = false;
  }
}

async function handleLogout(){
  try {
    if(auth) await auth.auth.signOut();
  } catch (error) {
    /* a sessão em memória é descartada logo abaixo de qualquer forma */
  }
  session = null;
  applySession();   // sem sessão, o roteador volta ao login
  setMessage(byId('login-message'), 'info', 'Sessão encerrada.');
}

/* ---------- 12 · eventos ---------- */
function wireChips(){
  qsa('#s2 .chips-row .chip').forEach(function(chip){
    chip.addEventListener('click', function(){
      const label = chip.textContent.trim();
      if(label === 'Só disponíveis') state.filters.catalog.onlyAvailable = !state.filters.catalog.onlyAvailable;
      else state.filters.catalog.chip = label;
      renderCatalog();
    });
  });

  qsa('#s5 .chips-row .chip').forEach(function(chip){
    chip.addEventListener('click', function(){
      state.filters.ops.chip = chip.textContent.trim();
      state.opsPage = 1;
      renderOps();
    });
  });
}

function wireSearch(){
  const catalogSearch = byId('catalog-search');
  if(catalogSearch){
    catalogSearch.addEventListener('input', function(){
      state.filters.catalog.query = catalogSearch.value;
      renderCatalog();
    });
  }
  const opsSearch = byId('ops-search');
  if(opsSearch){
    opsSearch.addEventListener('input', function(){
      state.filters.ops.query = opsSearch.value;
      state.opsPage = 1;
      renderOps();
    });
  }
}

function wireRegister(){
  ['reg-nome','reg-categoria','reg-pat'].forEach(function(id){
    const el = byId(id);
    if(!el) return;
    el.addEventListener('input', updatePreview);
    el.addEventListener('change', updatePreview);
  });

  qsa('#reg-situacao button').forEach(function(button){
    button.addEventListener('click', function(){
      qsa('#reg-situacao button').forEach(function(other){ other.classList.remove('active'); });
      button.classList.add('active');
      const pill = byId('preview-pill');
      if(!pill) return;
      const val = button.dataset.val;
      if(val === 'disponivel'){ pill.className = 'pill pill-ok'; pill.textContent = 'Disponível'; }
      if(val === 'manutencao'){ pill.className = 'pill pill-maint'; pill.textContent = 'Manutenção'; }
      if(val === 'fora'){ pill.className = 'pill pill-out'; pill.textContent = 'Fora de uso'; }
    });
  });

  const submit = byId('reg-submit');
  if(submit) submit.addEventListener('click', function(){ submitRegister(false); });
  const submitAnother = byId('reg-submit-another');
  if(submitAnother) submitAnother.addEventListener('click', function(){ submitRegister(true); });
}

function wireDialog(){
  const open = byId('open-dialog-btn');
  if(open) open.addEventListener('click', openLoanDialog);
  const cancel = byId('dialog-cancel');
  if(cancel) cancel.addEventListener('click', closeLoanDialog);
  const confirm = byId('dialog-confirm');
  if(confirm) confirm.addEventListener('click', confirmLoan);
  const backdrop = byId('dialog-backdrop');
  if(backdrop) backdrop.addEventListener('click', function(event){ if(event.target === backdrop) closeLoanDialog(); });
  document.addEventListener('keydown', function(event){
    if(event.key === 'Escape') closeLoanDialog();
  });
}

function wireNavigation(){
  const loginForm = byId('login-form');
  if(loginForm) loginForm.addEventListener('submit', handleLogin);
  document.addEventListener('click', function(event){
    const btn = event.target.closest && event.target.closest('[data-action="logout"]');
    if(btn) handleLogout();
  });
  window.addEventListener('hashchange', route);
  const goCatalog = byId('go-catalog-btn');
  if(goCatalog) goCatalog.addEventListener('click', function(){ location.hash = '#s2'; });
  const goRegister = byId('go-register-btn');
  if(goRegister) goRegister.addEventListener('click', function(){ location.hash = '#s6'; });
  const prev = byId('ops-prev');
  if(prev) prev.addEventListener('click', function(){ state.opsPage--; renderOps(); });
  const next = byId('ops-next');
  if(next) next.addEventListener('click', function(){ state.opsPage++; renderOps(); });
}

/* ---------- 13 · inicialização ---------- */
function boot(){
  const count = byId('catalog-count');
  if(count) state.examples.catalogCount = count.textContent.trim();

  state.pendingItem = state.catalog.find(function(item){ return item.pat === 'PAT-1042'; }) || state.catalog[0] || null;

  renderCatalog();
  renderLoans();
  renderOps();
  renderStats();
  renderSidebars();
  renderLoanCounters();
  renderDetail();
  updatePreview();
  applySession();

  wireChips();
  wireSearch();
  wireRegister();
  wireDialog();
  wireNavigation();

  if(auth){
    auth.auth.onAuthStateChange(function(event, nextSession){
      session = nextSession || null;
      applySession();
    });
    auth.auth.getSession().then(function(result){
      if(result && result.data && result.data.session){
        session = result.data.session;
        applySession();
      }
    }).catch(function(){
      /* persistSession:false — não há sessão antiga para restaurar */
    });
  } else {
    setMessage(byId('login-message'), 'info',
      'Autenticação indisponível: não foi possível carregar a biblioteca do Supabase. ' + NETWORK_MSG);
  }
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();