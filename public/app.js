const API = '';
let TOKEN = localStorage.getItem('ayala_admin_token') || '';

function api(path, opts = {}) {
  opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  if (TOKEN) opts.headers['Authorization'] = 'Bearer ' + TOKEN;
  return fetch(API + path, opts).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Ошибка запроса');
    return data;
  });
}

async function login() {
  const pw = document.getElementById('pw').value;
  const msg = document.getElementById('loginMsg');
  try {
    const { token } = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: pw }) });
    TOKEN = token;
    localStorage.setItem('ayala_admin_token', token);
    showApp();
  } catch (e) {
    msg.textContent = e.message;
  }
}

function logout() {
  TOKEN = '';
  localStorage.removeItem('ayala_admin_token');
  document.getElementById('app').style.display = 'none';
  document.getElementById('login').style.display = 'block';
}

async function showApp() {
  document.getElementById('login').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  const content = await api('/api/content');
  ce.init(content); // визуальный редактор контента (content-editor.js)
  themeEditor.init(content.theme); // цвета приложения (theme-editor.js)
  layoutEditor.init(content.layout); // порядок блоков (layout-editor.js)
  logoEditor.init(content.branding); // логотип сада (logo-editor.js)
  routineInit(); // күн тәртібі + ас мәзірі (routine-editor.js)
  chatsLoad(); // переписка воспитателей с родителями (chats-viewer.js)
  loadLeads();
  loadPayments();
  loadSettings();
  dbInit();
  dcInit();
}

/* ---------- Настройки оплаты ---------- */
const DESIGNS = [
  { id: 'solid', name: 'Сплошная' },
  { id: 'gradient', name: 'Градиент' },
  { id: 'outline', name: 'Контур' },
  { id: 'soft', name: 'Мягкая' },
  { id: 'glow', name: 'С подсветкой' },
  { id: 'card', name: 'Карточка' },
];
const CARD_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2.5"/><line x1="2" y1="10" x2="22" y2="10"/></svg>';
let selectedDesign = 'outline';

function buildDesignGrid() {
  const grid = document.getElementById('designGrid');
  grid.innerHTML = DESIGNS.map((d) =>
    `<div class="design-opt" data-id="${d.id}" onclick="pickDesign('${d.id}')">
       ${miniButton(d.id)}<div class="nm">${d.name}</div>
     </div>`).join('');
  markDesign();
}

function miniButton(id) {
  if (id === 'card') {
    return `<div class="v-card" style="min-width:0;transform:scale(.8);"><span class="ci">${CARD_ICON}</span>` +
           `<span class="ct"><b>Оплатить</b></span></div>`;
  }
  return `<button class="paybtn v-${id}" style="min-width:0;padding:9px 14px;font-size:12px;">${CARD_ICON}<span>Оплатить</span></button>`;
}

function markDesign() {
  document.querySelectorAll('.design-opt').forEach((el) =>
    el.classList.toggle('active', el.dataset.id === selectedDesign));
}

function pickDesign(id) {
  selectedDesign = id;
  markDesign();
  renderPreview();
}

function renderPreview() {
  const amount = document.getElementById('pay-amount').value || '15 000 ₸';
  const enabled = document.getElementById('pay-enabled').checked;
  const box = document.getElementById('preview');
  if (!enabled) {
    box.innerHTML = '<span style="color:var(--muted);font-weight:700;font-size:13px;">Кнопка отключена — в приложении не показывается</span>';
    return;
  }
  if (selectedDesign === 'card') {
    box.innerHTML = `<div class="v-card"><span class="ci">${CARD_ICON}</span>` +
      `<span class="ct"><b>Оплатить обучение</b><small>Безопасная оплата через Kaspi</small></span>` +
      `<span class="cam">${escapeHtml(amount)}</span></div>`;
  } else {
    box.innerHTML = `<button class="paybtn v-${selectedDesign}">${CARD_ICON}` +
      `<span>Оплатить обучение · ${escapeHtml(amount)}</span></button>`;
  }
}

async function loadSettings() {
  try {
    const s = await api('/api/settings');
    const p = (s && s.payment) || {};
    document.getElementById('pay-enabled').checked = p.enabled !== false;
    document.getElementById('pay-amount').value = p.amount || '';
    document.getElementById('pay-title').value = p.title || '';
    document.getElementById('pay-kaspi').value = p.kaspiUrl || '';
    selectedDesign = p.design || 'outline';
    buildDesignGrid();
    renderPreview();
  } catch (e) {
    /* оставляем поля пустыми */
  }
}

async function saveSettings() {
  const msg = document.getElementById('msg-payment');
  msg.className = 'msg';
  msg.textContent = '';
  const payment = {
    enabled: document.getElementById('pay-enabled').checked,
    design: selectedDesign,
    amount: document.getElementById('pay-amount').value.trim(),
    title: document.getElementById('pay-title').value.trim(),
    kaspiUrl: document.getElementById('pay-kaspi').value.trim(),
  };
  try {
    await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ payment }) });
    msg.className = 'msg ok';
    msg.textContent = 'Сохранено ✓ — применится в приложении';
  } catch (e) {
    msg.className = 'msg err';
    msg.textContent = 'Ошибка: ' + e.message;
  }
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === 'panel-' + name));
}

async function loadLeads() {
  const body = document.getElementById('leadsBody');
  try {
    const leads = await api('/api/admin/leads');
    body.innerHTML = leads.map((l) => `
      <tr>
        <td>${new Date(l.createdAt).toLocaleString('ru-RU')}</td>
        <td>${l.type}</td>
        <td>${escapeHtml(l.name)}</td>
        <td>${escapeHtml(l.phone)}</td>
        <td>${escapeHtml(l.message || '')}</td>
        <td>
          <select onchange="updateStatus('${l.id}', this.value)">
            <option value="new" ${l.status === 'new' ? 'selected' : ''}>новая</option>
            <option value="contacted" ${l.status === 'contacted' ? 'selected' : ''}>связались</option>
            <option value="done" ${l.status === 'done' ? 'selected' : ''}>завершена</option>
          </select>
        </td>
        <td style="white-space:nowrap;">
          <span class="reg-link" onclick="regOpen('${l.id}')">Зарегистрировать</span>
          <span class="del" onclick="deleteLead('${l.id}')">Удалить</span>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="7">Пока нет заявок</td></tr>';
    leadsCache = leads;
  } catch (e) {
    body.innerHTML = `<tr><td colspan="7">Ошибка: ${e.message}</td></tr>`;
  }
}

async function updateStatus(id, status) {
  await api('/api/admin/leads/' + id, { method: 'PATCH', body: JSON.stringify({ status }) });
}

async function deleteLead(id) {
  if (!confirm('Удалить заявку?')) return;
  await api('/api/admin/leads/' + id, { method: 'DELETE' });
  loadLeads();
}

/* ---------- Регистрация родителя прямо из заявки ---------- */
// Админ нажимает «Зарегистрировать» — создаётся аккаунт (users), профиль
// родителя (parents) и, если указано, ребёнок (students). Заявка закрывается,
// а логин с паролем показываются, чтобы передать их родителю.
let leadsCache = [];
let regLeadId = null;
let regStudents = []; // все дети из БД — для списка выбора

// Простой пароль, который легко продиктовать по телефону.
function genPassword() {
  return 'ayala' + Math.floor(1000 + Math.random() * 9000);
}

async function regOpen(leadId) {
  const lead = leadsCache.find((l) => l.id === leadId);
  if (!lead) return;
  regLeadId = leadId;

  const parts = String(lead.name || '').trim().split(/\s+/);
  document.getElementById('regFrom').textContent =
    `По заявке: ${lead.name || '—'} · ${lead.phone || '—'}`;
  document.getElementById('reg-phone').value = lead.phone || '';
  document.getElementById('reg-pass').value = genPassword();
  document.getElementById('reg-firstname').value = parts[0] || '';
  document.getElementById('reg-surname').value = parts.slice(1).join(' ');
  document.getElementById('reg-child-firstname').value = '';
  document.getElementById('reg-child-surname').value = '';
  document.getElementById('reg-new-box').style.display = 'none';
  document.getElementById('reg-new-toggle').textContent = '+ Добавить нового ребёнка';

  const msg = document.getElementById('regMsg');
  msg.className = 'msg';
  msg.textContent = '';
  document.getElementById('regCred').style.display = 'none';
  document.getElementById('regSubmit').disabled = false;

  // Список групп для выпадающего списка.
  const sel = document.getElementById('reg-group');
  sel.innerHTML = '<option value="">— без группы —</option>';
  try {
    const groups = await api('/api/groups');
    sel.innerHTML += groups.map((g) => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('');
  } catch (e) {
    /* без групп тоже можно зарегистрировать */
  }
  sel.onchange = regRenderKids; // при смене группы список детей пересобирается

  // Дети для выбора.
  try {
    regStudents = await api('/api/students');
  } catch (e) {
    regStudents = [];
  }
  regRenderKids();

  document.getElementById('regModal').classList.add('on');
}

// Список детей: по выбранной группе (или все, если группа не выбрана).
// Ребёнок, уже привязанный к другому родителю, показывается, но не выбирается.
function regRenderKids() {
  const box = document.getElementById('reg-kids');
  const groupId = document.getElementById('reg-group').value;
  const list = groupId
    ? regStudents.filter((s) => String(s.group_id) === String(groupId))
    : regStudents;

  if (!list.length) {
    box.innerHTML = `<div class="kid-empty">${
      groupId ? 'В этой группе пока нет детей' : 'Детей в базе пока нет'
    }</div>`;
    return;
  }

  box.innerHTML = list
    .map((s) => {
      const taken = !!s.parent_id;
      const who = taken && s.parent ? `${s.parent.firstname} ${s.parent.surname}` : '';
      return `
      <label class="kid-item ${taken ? 'taken' : ''}">
        <input type="checkbox" value="${s.id}" ${taken ? 'disabled' : ''}>
        <span>
          <div class="nm">${escapeHtml(s.firstname + ' ' + s.surname)}</div>
          <div class="gr">${
            taken
              ? 'уже привязан: ' + escapeHtml(who)
              : escapeHtml(s.group ? s.group.name : 'без группы')
          }</div>
        </span>
      </label>`;
    })
    .join('');
}

function regToggleNewChild() {
  const box = document.getElementById('reg-new-box');
  const link = document.getElementById('reg-new-toggle');
  const show = box.style.display === 'none';
  box.style.display = show ? 'block' : 'none';
  link.textContent = show ? '− Скрыть нового ребёнка' : '+ Добавить нового ребёнка';
  if (!show) {
    document.getElementById('reg-child-firstname').value = '';
    document.getElementById('reg-child-surname').value = '';
  }
}

function regClose() {
  document.getElementById('regModal').classList.remove('on');
  regLeadId = null;
}

async function regSubmit() {
  const msg = document.getElementById('regMsg');
  const btn = document.getElementById('regSubmit');
  msg.className = 'msg';
  msg.textContent = '';

  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-pass').value.trim();
  const firstname = document.getElementById('reg-firstname').value.trim();
  const surname = document.getElementById('reg-surname').value.trim();
  const groupId = document.getElementById('reg-group').value;
  const childFirst = document.getElementById('reg-child-firstname').value.trim();
  const childLast = document.getElementById('reg-child-surname').value.trim();

  if (!phone || !password || !firstname || !surname) {
    msg.className = 'msg err';
    msg.textContent = 'Заполните телефон, пароль, имя и фамилию';
    return;
  }

  btn.disabled = true;
  try {
    // 1) аккаунт
    const user = await api('/api/users', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phone, password, role: 'parent' }),
    });
    // 2) профиль родителя
    const parent = await api('/api/parents', {
      method: 'POST',
      body: JSON.stringify({
        firstname,
        surname,
        user_id: user.id,
        group_id: groupId ? Number(groupId) : null,
      }),
    });
    // 3) привязываем выбранных из списка детей к этому родителю
    const chosen = [...document.querySelectorAll('#reg-kids input:checked')].map((c) => Number(c.value));
    for (const studentId of chosen) {
      await api('/api/students/' + studentId, {
        method: 'PUT',
        body: JSON.stringify({
          parent_id: parent.id,
          ...(groupId ? { group_id: Number(groupId) } : {}),
        }),
      });
    }

    // 4) новый ребёнок — если админ ввёл его вручную
    if (childFirst) {
      await api('/api/students', {
        method: 'POST',
        body: JSON.stringify({
          firstname: childFirst,
          surname: childLast || surname,
          parent_id: parent.id,
          group_id: groupId ? Number(groupId) : null,
        }),
      });
    }
    // 5) заявку закрываем
    if (regLeadId) {
      await api('/api/admin/leads/' + regLeadId, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'done' }),
      });
    }

    // Показываем данные для входа — их нужно передать родителю.
    const cred = document.getElementById('regCred');
    cred.innerHTML =
      `<b>Готово! Передайте родителю данные для входа:</b>` +
      `<div>Телефон: ${escapeHtml(user.phone_number)}</div>` +
      `<div>Пароль: ${escapeHtml(password)}</div>`;
    cred.style.display = 'block';
    const kidsCount = chosen.length + (childFirst ? 1 : 0);
    msg.className = 'msg ok';
    msg.textContent = kidsCount
      ? `Родитель зарегистрирован ✓ · детей привязано: ${kidsCount}`
      : 'Родитель зарегистрирован ✓';
    btn.disabled = true;

    await loadLeads();
    if (typeof dbLoad === 'function' && dbState) dbLoad();
  } catch (e) {
    msg.className = 'msg err';
    msg.textContent = 'Ошибка: ' + e.message;
    btn.disabled = false;
  }
}

/* ---------- База данных (users/groups/parents/students/tutors) ---------- */
const DB_ENTITIES = {
  users: {
    label: 'Пользователи',
    fields: [
      { key: 'phone_number', label: 'Телефон', type: 'text', required: true },
      { key: 'password', label: 'Пароль', type: 'text', required: true, optionalOnEdit: true, placeholderEdit: 'оставьте пустым, чтобы не менять' },
      { key: 'role', label: 'Роль', type: 'select', options: [['parent', 'Родитель'], ['tutor', 'Воспитатель'], ['admin', 'Админ']] },
    ],
    columns: [
      { label: 'ID', get: (r) => r.id },
      { label: 'Телефон', get: (r) => escapeHtml(r.phone_number) },
      { label: 'Роль', get: (r) => `<span class="badge-role ${r.role}">${escapeHtml(r.role)}</span>` },
      { label: 'Создан', get: (r) => new Date(r.created_at).toLocaleDateString('ru-RU') },
    ],
  },
  groups: {
    label: 'Группы',
    fields: [{ key: 'name', label: 'Название', type: 'text', required: true }],
    columns: [
      { label: 'ID', get: (r) => r.id },
      { label: 'Название', get: (r) => escapeHtml(r.name) },
      { label: 'Детей', get: (r) => (r._count ? r._count.students : '—') },
      { label: 'Родителей', get: (r) => (r._count ? r._count.parents : '—') },
      { label: 'Воспитателей', get: (r) => (r._count ? r._count.tutors : '—') },
    ],
  },
  parents: {
    label: 'Родители',
    fields: [
      { key: 'firstname', label: 'Имя', type: 'text', required: true },
      { key: 'surname', label: 'Фамилия', type: 'text', required: true },
      { key: 'user_id', label: 'Аккаунт (пользователь)', type: 'ref', ref: 'users', required: true, optLabel: (u) => `${u.phone_number} (${u.role})` },
      { key: 'group_id', label: 'Группа', type: 'ref', ref: 'groups', optLabel: (g) => g.name },
    ],
    columns: [
      { label: 'ID', get: (r) => r.id },
      { label: 'ФИО', get: (r) => escapeHtml(r.firstname + ' ' + r.surname) },
      { label: 'Группа', get: (r) => escapeHtml(r.group ? r.group.name : '—') },
      { label: 'Аккаунт', get: (r) => escapeHtml(r.user ? r.user.phone_number : '—') },
    ],
  },
  students: {
    label: 'Дети',
    fields: [
      { key: 'firstname', label: 'Имя', type: 'text', required: true },
      { key: 'surname', label: 'Фамилия', type: 'text', required: true },
      { key: 'parent_id', label: 'Родитель', type: 'ref', ref: 'parents', optLabel: (p) => `${p.firstname} ${p.surname}` },
      { key: 'group_id', label: 'Группа', type: 'ref', ref: 'groups', optLabel: (g) => g.name },
    ],
    columns: [
      { label: 'ID', get: (r) => r.id },
      { label: 'ФИО', get: (r) => escapeHtml(r.firstname + ' ' + r.surname) },
      { label: 'Родитель', get: (r) => escapeHtml(r.parent ? r.parent.firstname + ' ' + r.parent.surname : '—') },
      { label: 'Группа', get: (r) => escapeHtml(r.group ? r.group.name : '—') },
    ],
  },
  tutors: {
    label: 'Воспитатели',
    fields: [
      { key: 'firstname', label: 'Имя', type: 'text', required: true },
      { key: 'surname', label: 'Фамилия', type: 'text', required: true },
      { key: 'user_id', label: 'Аккаунт (пользователь)', type: 'ref', ref: 'users', required: true, optLabel: (u) => `${u.phone_number} (${u.role})` },
      { key: 'group_id', label: 'Группа', type: 'ref', ref: 'groups', optLabel: (g) => g.name },
    ],
    columns: [
      { label: 'ID', get: (r) => r.id },
      { label: 'ФИО', get: (r) => escapeHtml(r.firstname + ' ' + r.surname) },
      { label: 'Группа', get: (r) => escapeHtml(r.group ? r.group.name : '—') },
      { label: 'Аккаунт', get: (r) => escapeHtml(r.user ? r.user.phone_number : '—') },
    ],
  },
};

const dbState = { entity: 'users', editId: null, items: [], refs: { users: [], groups: [], parents: [], tutors: [] } };

function dbInit() {
  const nav = document.getElementById('dbNav');
  nav.innerHTML = Object.keys(DB_ENTITIES)
    .map((k) => `<div class="subtab" data-e="${k}" onclick="dbSwitch('${k}')">${DB_ENTITIES[k].label}</div>`)
    .join('');
  dbSwitch('users');
}

function dbSwitch(entity) {
  dbState.entity = entity;
  document.querySelectorAll('#dbNav .subtab').forEach((el) => el.classList.toggle('active', el.dataset.e === entity));
  dbResetForm();
  dbLoad();
}

// Загружает справочники для выпадающих списков (users/groups/parents).
async function dbLoadRefs() {
  const need = new Set();
  DB_ENTITIES[dbState.entity].fields.forEach((f) => { if (f.type === 'ref') need.add(f.ref); });
  await Promise.all([...need].map(async (r) => {
    try { dbState.refs[r] = await api('/api/' + r); } catch (e) { dbState.refs[r] = []; }
  }));
}

async function dbLoad() {
  await dbLoadRefs();
  dbRenderForm();
  const cfg = DB_ENTITIES[dbState.entity];
  const head = document.getElementById('dbHead');
  const body = document.getElementById('dbBody');
  head.innerHTML = '<tr>' + cfg.columns.map((c) => `<th>${c.label}</th>`).join('') + '<th></th></tr>';
  try {
    const items = await api('/api/' + dbState.entity);
    dbState.items = items;
    body.innerHTML = items.map((r) => `
      <tr>
        ${cfg.columns.map((c) => `<td>${c.get(r)}</td>`).join('')}
        <td>
          <span class="edit-link" onclick="dbEdit(${r.id})">Изменить</span>
          <span class="del" onclick="dbDelete(${r.id})">Удалить</span>
        </td>
      </tr>`).join('') || `<tr><td colspan="${cfg.columns.length + 1}">Пока нет записей</td></tr>`;
  } catch (e) {
    body.innerHTML = `<tr><td colspan="${cfg.columns.length + 1}">Ошибка: ${e.message}</td></tr>`;
  }
}

function dbRenderForm(values) {
  const cfg = DB_ENTITIES[dbState.entity];
  const v = values || {};
  const editing = dbState.editId != null;
  document.getElementById('dbFormTitle').textContent = editing ? 'Изменить запись #' + dbState.editId : 'Добавить запись';
  document.getElementById('dbCancel').style.display = editing ? 'inline-block' : 'none';
  document.getElementById('dbFields').innerHTML = cfg.fields.map((f) => {
    const val = v[f.key] != null ? v[f.key] : '';
    if (f.type === 'select') {
      return field(f, `<select id="dbf-${f.key}">${f.options.map(([ov, ol]) => `<option value="${ov}" ${String(val) === ov ? 'selected' : ''}>${ol}</option>`).join('')}</select>`);
    }
    if (f.type === 'ref') {
      const opts = (dbState.refs[f.ref] || []).map((o) => `<option value="${o.id}" ${String(val) === String(o.id) ? 'selected' : ''}>${escapeHtml(f.optLabel(o))}</option>`).join('');
      const empty = f.required ? '' : '<option value="">— не выбрано —</option>';
      return field(f, `<select id="dbf-${f.key}">${empty}${opts}</select>`);
    }
    const ph = editing && f.placeholderEdit ? f.placeholderEdit : f.label;
    return field(f, `<input type="text" id="dbf-${f.key}" value="${editing && f.optionalOnEdit ? '' : escapeAttr(val)}" placeholder="${ph}">`);
  }).join('');
}

function field(f, inner) {
  return `<div class="db-field"><label>${f.label}${f.required ? ' *' : ''}</label>${inner}</div>`;
}

function dbResetForm() {
  dbState.editId = null;
  dbRenderForm();
  const msg = document.getElementById('dbMsg');
  msg.className = 'msg';
  msg.textContent = '';
}

function dbEdit(id) {
  const rec = dbState.items.find((r) => r.id === id);
  if (!rec) return;
  dbState.editId = id;
  dbRenderForm(rec);
}

async function dbSave() {
  const cfg = DB_ENTITIES[dbState.entity];
  const msg = document.getElementById('dbMsg');
  msg.className = 'msg';
  msg.textContent = '';
  const editing = dbState.editId != null;
  const payload = {};
  for (const f of cfg.fields) {
    const el = document.getElementById('dbf-' + f.key);
    let val = el ? el.value : '';
    if (f.type === 'text') val = val.trim();
    // пароль при редактировании: пустой — не отправляем
    if (editing && f.optionalOnEdit && !val) continue;
    if (f.required && !val) {
      msg.className = 'msg err';
      msg.textContent = 'Заполните поле: ' + f.label;
      return;
    }
    if (f.type === 'ref') payload[f.key] = val === '' ? null : Number(val);
    else payload[f.key] = val;
  }
  try {
    if (editing) {
      await api('/api/' + dbState.entity + '/' + dbState.editId, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/api/' + dbState.entity, { method: 'POST', body: JSON.stringify(payload) });
    }
    dbState.editId = null;
    await dbLoad();
    msg.className = 'msg ok';
    msg.textContent = 'Сохранено ✓';
  } catch (e) {
    msg.className = 'msg err';
    msg.textContent = 'Ошибка: ' + e.message;
  }
}

async function dbDelete(id) {
  if (!confirm('Удалить запись #' + id + '?')) return;
  try {
    await api('/api/' + dbState.entity + '/' + id, { method: 'DELETE' });
    await dbLoad();
  } catch (e) {
    alert('Ошибка: ' + e.message);
  }
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/* ---------- Даму картасы (карта развития ребёнка / ИКР НОБД) ---------- */
const dcState = { catalog: null, levels: [], marks: {}, readonly: false };

async function dcInit() {
  try {
    const [meta, students] = await Promise.all([api('/api/devcards/meta'), api('/api/students')]);
    dcState.levels = meta.levels;
    const gsel = document.getElementById('dc-group');
    gsel.innerHTML = meta.ageGroups.map((g) => `<option value="${g.key}">${escapeHtml(g.label)}</option>`).join('');
    const ssel = document.getElementById('dc-student');
    ssel.innerHTML = '<option value="">— баланы таңдаңыз —</option>' +
      students.map((s) => `<option value="${s.id}">${escapeHtml(s.firstname + ' ' + s.surname)}${s.group ? ' · ' + escapeHtml(s.group.name) : ''}</option>`).join('');
  } catch (e) {
    document.getElementById('dc-body').innerHTML = `<div class="dc-empty">Қате: ${escapeHtml(e.message)}</div>`;
  }
}

async function dcLoadCard() {
  const studentId = document.getElementById('dc-student').value;
  const ageGroup = document.getElementById('dc-group').value;
  const body = document.getElementById('dc-body');
  dcSetMsg('', '');
  if (!studentId) {
    body.innerHTML = '<div class="dc-empty">Баланы таңдаңыз.</div>';
    return;
  }
  try {
    const data = await api(`/api/devcards/student/${studentId}?age_group=${ageGroup}`);
    dcState.catalog = data.catalog;
    dcState.levels = data.levels;
    dcState.marks = (data.card && data.card.marks) || {};
    document.getElementById('dc-period').value = (data.card && data.card.period) || '';
    document.getElementById('dc-note').value = (data.card && data.card.note) || '';
    dcRender();
  } catch (e) {
    body.innerHTML = `<div class="dc-empty">Қате: ${escapeHtml(e.message)}</div>`;
  }
}

function dcRender() {
  const body = document.getElementById('dc-body');
  if (!dcState.catalog) {
    body.innerHTML = '<div class="dc-empty">Баланы таңдаңыз.</div>';
    return;
  }
  body.innerHTML = dcState.catalog.areas.map((area) => `
    <div class="dc-area">
      <h4>${escapeHtml(area.label)}</h4>
      ${area.skills.map((sk) => dcSkillRow(sk)).join('')}
    </div>`).join('');
}

function dcSkillRow(sk) {
  const current = dcState.marks[sk.no] || '';
  const buttons = dcState.levels.map((lv) => {
    const on = current === lv.key ? ` on-${lv.key}` : '';
    return `<span class="dc-lv${on}" onclick="dcPick(${sk.no}, '${lv.key}')">${escapeHtml(lv.label)}</span>`;
  }).join('');
  return `
    <div class="dc-skill">
      <span class="no">${sk.no}</span>
      <span class="txt">${escapeHtml(sk.text)}</span>
      <span class="dc-levels">${buttons}</span>
    </div>`;
}

// Клик по уровню: выбрать или снять (повторный клик).
function dcPick(no, level) {
  if (dcState.marks[no] === level) delete dcState.marks[no];
  else dcState.marks[no] = level;
  dcRender();
}

async function dcSave() {
  const studentId = document.getElementById('dc-student').value;
  const ageGroup = document.getElementById('dc-group').value;
  if (!studentId) return dcSetMsg('err', 'Алдымен баланы таңдаңыз');
  const payload = {
    age_group: ageGroup,
    period: document.getElementById('dc-period').value.trim(),
    note: document.getElementById('dc-note').value.trim(),
    marks: dcState.marks,
  };
  try {
    await api(`/api/devcards/student/${studentId}`, { method: 'PUT', body: JSON.stringify(payload) });
    dcSetMsg('ok', 'Сақталды ✓');
  } catch (e) {
    dcSetMsg('err', 'Қате: ' + e.message);
  }
}

function dcSetMsg(kind, text) {
  const msg = document.getElementById('dc-msg');
  msg.className = 'msg' + (kind ? ' ' + kind : '');
  msg.textContent = text;
}

/* ---------- Журнал платежей ---------- */
const PAY_STATUS = {
  pending: 'Ожидает',
  paid: 'Оплачено',
  canceled: 'Отменён',
};

async function loadPayments() {
  const body = document.getElementById('paymentsBody');
  try {
    const items = await api('/api/admin/payments');
    body.innerHTML = items.map((p) => `
      <tr>
        <td>${new Date(p.createdAt).toLocaleString('ru-RU')}</td>
        <td>${escapeHtml(p.name || '—')}</td>
        <td>${escapeHtml(p.phone || '—')}</td>
        <td><strong>${escapeHtml(p.amount)}</strong></td>
        <td>${escapeHtml(p.method)}</td>
        <td>
          <select onchange="updatePaymentStatus('${p.id}', this.value)">
            <option value="pending" ${p.status === 'pending' ? 'selected' : ''}>Ожидает</option>
            <option value="paid" ${p.status === 'paid' ? 'selected' : ''}>Оплачено</option>
            <option value="canceled" ${p.status === 'canceled' ? 'selected' : ''}>Отменён</option>
          </select>
        </td>
        <td><span class="del" onclick="deletePayment('${p.id}')">Удалить</span></td>
      </tr>
    `).join('') || '<tr><td colspan="7">Пока нет платежей</td></tr>';
  } catch (e) {
    body.innerHTML = `<tr><td colspan="7">Ошибка: ${e.message}</td></tr>`;
  }
}

async function updatePaymentStatus(id, status) {
  await api('/api/admin/payments/' + id, { method: 'PATCH', body: JSON.stringify({ status }) });
}

async function deletePayment(id) {
  if (!confirm('Удалить запись о платеже?')) return;
  await api('/api/admin/payments/' + id, { method: 'DELETE' });
  loadPayments();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

if (TOKEN) {
  showApp().catch(() => logout());
}
