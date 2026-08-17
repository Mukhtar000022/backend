/* Мобильное приложение «Аяла Kids»: выбор роли → вход по телефону → панель.
 * Ролей две: родитель (только просмотр) и воспитатель (заполняет карту).
 * Администратор работает в отдельной панели бэкенда (/admin). */

const API = '';
let TOKEN = localStorage.getItem('ayala_token') || '';
let ROLE = localStorage.getItem('ayala_role') || '';

const ROLES = {
  parent: { title: 'Родитель', icon: '👨‍👩‍👧', bg: 'var(--parent-bg)', fg: 'var(--parent)' },
  tutor: { title: 'Воспитатель', icon: '🎓', bg: 'var(--tutor-bg)', fg: 'var(--tutor)' },
};

function api(path, opts = {}) {
  opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  if (TOKEN) opts.headers['Authorization'] = 'Bearer ' + TOKEN;
  return fetch(API + path, opts).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Ошибка запроса');
    return data;
  });
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
  window.scrollTo(0, 0);
}

/* ---------------- Информация о детском саде (публичный /api/content) ---------------- */
async function loadKindergarten() {
  const box = document.getElementById('kg-info');
  try {
    const c = await api('/api/content');
    const k = c.contacts || {};
    const home = c.home || {};
    if (k.name) document.getElementById('kg-title').textContent = k.name.replace(/^Детский сад\s*/i, '');
    const phones = (Array.isArray(k.phones) ? k.phones : []).filter(Boolean);
    const counts = [
      c.education && c.education.length ? `${c.education.length} направлений обучения` : '',
      c.courses && c.courses.length ? `${c.courses.length} кружков` : '',
    ].filter(Boolean);

    box.innerHTML = `
      <div class="nm">${esc(k.name || 'Детский сад')}</div>
      ${home.heroText ? `<div class="hero">${esc(home.heroText)}</div>` : ''}
      <div class="rows">
        ${k.city ? `<div class="r"><i>📍</i><span>${esc(k.city)}</span></div>` : ''}
        ${k.address ? `<div class="r"><i>🏠</i><span>${esc(k.address)}</span></div>` : ''}
        ${phones.map((p) => `<div class="r"><i>📞</i><a href="tel:${esc(p.replace(/[^\d+]/g, ''))}">${esc(p)}</a></div>`).join('')}
        ${k.email ? `<div class="r"><i>✉️</i><a href="mailto:${esc(k.email)}">${esc(k.email)}</a></div>` : ''}
      </div>
      ${counts.length ? `<div class="tags">${counts.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}`;
  } catch (e) {
    box.innerHTML = `<div class="hero">Информация о детском саде недоступна: ${esc(e.message)}</div>`;
  }
}

/* ---------------- Выбор роли и вход ---------------- */
function pickRole(role) {
  ROLE = role;
  const r = ROLES[role];
  const ic = document.getElementById('lg-ic');
  ic.textContent = r.icon;
  ic.style.background = r.bg;
  ic.style.color = r.fg;
  document.getElementById('lg-title').textContent = 'Вход: ' + r.title;
  document.getElementById('lg-msg').textContent = '';
  document.getElementById('lg-pass').value = '';
  show('s-login');
  setTimeout(() => document.getElementById('lg-phone').focus(), 120);
}

// Маска ввода: превращает набранные цифры в +7(7XX) XXX-XX-XX.
function maskPhone(raw) {
  let d = String(raw).replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  const p = d.slice(1); // без кода страны
  let out = '+7';
  if (p.length) out += '(' + p.slice(0, 3);
  if (p.length >= 3) out += ')';
  if (p.length > 3) out += ' ' + p.slice(3, 6);
  if (p.length > 6) out += '-' + p.slice(6, 8);
  if (p.length > 8) out += '-' + p.slice(8, 10);
  return out;
}

document.getElementById('lg-phone').addEventListener('input', (e) => {
  const digits = e.target.value.replace(/\D/g, '');
  e.target.value = digits ? maskPhone(digits) : '';
});

async function doLogin() {
  const phone = document.getElementById('lg-phone').value.trim();
  const password = document.getElementById('lg-pass').value;
  const msg = document.getElementById('lg-msg');
  const btn = document.getElementById('lg-btn');
  msg.className = 'msg err';
  msg.textContent = '';
  if (!phone || !password) {
    msg.textContent = 'Введите номер телефона и пароль';
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Входим…';
  try {
    // role передаём на сервер — он не пустит с чужой ролью.
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phone, password, role: ROLE }),
    });
    TOKEN = res.token;
    localStorage.setItem('ayala_token', TOKEN);
    localStorage.setItem('ayala_role', ROLE);
    await openPanel();
  } catch (e) {
    msg.textContent = e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Войти';
  }
}

function logout() {
  TOKEN = '';
  ROLE = '';
  localStorage.removeItem('ayala_token');
  localStorage.removeItem('ayala_role');
  // Сбрасываем кэш, чтобы следующий вход не увидел данные прошлого пользователя.
  tutorMe = null;
  tutorTabName = 'kids';
  att.lessons = null;
  att.lessonId = null;
  att.present = {};
  att.date = todayISO();
  document.getElementById('lg-phone').value = '';
  document.getElementById('lg-pass').value = '';
  show('s-roles');
}

async function openPanel() {
  if (ROLE === 'parent') return openParent();
  if (ROLE === 'tutor') return openTutor();
  logout();
}

/* ---------------- Панель родителя: только просмотр ---------------- */
async function openParent() {
  show('s-parent');
  const body = document.getElementById('pp-body');
  body.innerHTML = '<div class="empty">Загрузка…</div>';
  try {
    const me = await api('/api/parents/me');
    document.getElementById('pp-name').textContent = `${me.firstname} ${me.surname}`;
    const kids = me.students || [];
    if (!kids.length) {
      body.innerHTML = '<div class="empty">К вашему профилю пока не привязан ребёнок.<br>Обратитесь к администратору детского сада.</div>';
      return;
    }
    body.innerHTML = `<div class="sect-lbl">Мои дети</div>` + kids.map((k) => kidRow(k, me.group)).join('');
  } catch (e) {
    body.innerHTML = `<div class="empty">Ошибка: ${esc(e.message)}</div>`;
  }
}

function kidRow(k, group) {
  const initials = (k.firstname || '?').slice(0, 1) + (k.surname || '').slice(0, 1);
  return `<button class="kid" onclick="openCard(${k.id}, '${esc(k.firstname + ' ' + k.surname)}')">
    <span class="av">${esc(initials)}</span>
    <span><div class="nm">${esc(k.firstname + ' ' + k.surname)}</div>
      <div class="gr">${esc(group ? group.name : 'Группа не указана')} · карта развития</div></span>
    <span class="ar">›</span>
  </button>`;
}

/* ---------------- Панель воспитателя: карта развития + посещаемость ---------------- */
let tutorMe = null;
let tutorTabName = 'kids';

async function openTutor() {
  show('s-tutor');
  const body = document.getElementById('tp-body');
  body.innerHTML = '<div class="empty">Загрузка…</div>';
  try {
    tutorMe = await api('/api/tutors/me');
    document.getElementById('tp-name').textContent = `${tutorMe.firstname} ${tutorMe.surname}`;
    document.getElementById('tp-group').textContent =
      tutorMe.group ? 'Группа: ' + tutorMe.group.name : 'Группа не назначена';
    tutorTab(tutorTabName);
  } catch (e) {
    body.innerHTML = `<div class="empty">Ошибка: ${esc(e.message)}</div>`;
  }
}

function tutorTab(name) {
  tutorTabName = name;
  document.getElementById('tp-tabs').style.display = '';
  document.querySelectorAll('#tp-tabs .gchip').forEach((c) => c.classList.toggle('on', c.dataset.t === name));
  if (name === 'att') renderAttendance();
  else renderTutorKids();
}

function renderTutorKids() {
  const body = document.getElementById('tp-body');
  const kids = (tutorMe.group && tutorMe.group.students) || [];
  if (!kids.length) {
    body.innerHTML = '<div class="empty">В вашей группе пока нет детей.<br>Добавит администратор детского сада.</div>';
    return;
  }
  body.innerHTML = `<div class="sect-lbl">Дети группы — ${kids.length}</div>` +
    kids.map((k) => kidRow(k, tutorMe.group)).join('');
}

/* ---------------- Посещаемость (заполняет воспитатель) ---------------- */
// present[student_id] = true/false. Урок берём из расписания своей группы
// на выбранный день недели.
const att = { date: todayISO(), lessonId: null, lessons: null, present: {} };

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 1=Пн … 6=Сб (как в расписании); воскресенье → 0, занятий нет.
function weekdayOf(iso) {
  return new Date(iso + 'T00:00:00').getDay();
}

async function renderAttendance() {
  const body = document.getElementById('tp-body');
  const kids = (tutorMe.group && tutorMe.group.students) || [];
  if (!tutorMe.group) {
    body.innerHTML = '<div class="empty">Вам ещё не назначена группа.<br>Обратитесь к администратору.</div>';
    return;
  }
  if (!kids.length) {
    body.innerHTML = '<div class="empty">В вашей группе пока нет детей.</div>';
    return;
  }
  body.innerHTML = '<div class="empty">Загрузка расписания…</div>';
  try {
    if (att.lessons === null) att.lessons = await api('/api/lessons/my');
    const wd = weekdayOf(att.date);
    const todays = att.lessons.filter((l) => l.weekday === wd);
    // Если выбранный урок не из этого дня — берём первый доступный.
    if (!todays.some((l) => l.id === att.lessonId)) att.lessonId = todays.length ? todays[0].id : null;

    // Подтягиваем уже сохранённые отметки на этот урок и дату.
    att.present = {};
    if (att.lessonId) {
      const saved = await api(`/api/attendance?lesson_id=${att.lessonId}&date=${att.date}`);
      saved.forEach((r) => { att.present[r.student_id] = r.present; });
    }
    // Кто не отмечен — по умолчанию «пришёл».
    kids.forEach((k) => { if (att.present[k.id] === undefined) att.present[k.id] = true; });

    drawAttendance(todays, kids);
  } catch (e) {
    body.innerHTML = `<div class="empty">Ошибка: ${esc(e.message)}</div>`;
  }
}

function drawAttendance(todays, kids) {
  const body = document.getElementById('tp-body');
  const nPresent = kids.filter((k) => att.present[k.id]).length;
  const WD = ['Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі'];

  body.innerHTML = `
    <div class="att-head">
      <div class="fld">
        <label>Күні — ${esc(WD[weekdayOf(att.date)])}</label>
        <input type="date" id="att-date" value="${esc(att.date)}" onchange="setAttDate(this.value)">
      </div>
      <div class="fld">
        <label>Сабақ</label>
        ${todays.length
          ? `<select id="att-lesson" onchange="setAttLesson(this.value)">
               ${todays.map((l) => `<option value="${l.id}" ${l.id === att.lessonId ? 'selected' : ''}>
                  ${esc(l.order_no + '. ' + l.subject + ' · ' + l.start_time + '–' + l.end_time)}</option>`).join('')}
             </select>`
          : `<div class="note" style="margin:0;">Бұл күнге сабақ жоспарланмаған. Кестені әкімші немесе сіз қосасыз.</div>`}
      </div>
    </div>

    ${todays.length ? `
      <div class="att-sum">
        <span class="p">Келді: ${nPresent}</span>
        <span class="a">Келмеді: ${kids.length - nPresent}</span>
      </div>
      ${kids.map((k) => attRow(k)).join('')}
      <div class="savebar">
        <button class="btn" onclick="saveAttendance()">Қатысуды сақтау</button>
        <div class="msg" id="att-msg"></div>
      </div>` : ''}`;
}

function attRow(k) {
  const on = att.present[k.id];
  const initials = (k.firstname || '?').slice(0, 1) + (k.surname || '').slice(0, 1);
  return `<div class="arow">
    <span class="av">${esc(initials)}</span>
    <span class="nm">${esc(k.firstname + ' ' + k.surname)}</span>
    <span class="tgl">
      <button class="yes ${on ? 'on' : ''}" onclick="setPresent(${k.id}, true)">Келді</button>
      <button class="no ${on ? '' : 'on'}" onclick="setPresent(${k.id}, false)">Келмеді</button>
    </span>
  </div>`;
}

function setAttDate(v) {
  att.date = v || todayISO();
  renderAttendance();
}

function setAttLesson(id) {
  att.lessonId = Number(id);
  renderAttendance();
}

function setPresent(studentId, value) {
  att.present[studentId] = value;
  const kids = (tutorMe.group && tutorMe.group.students) || [];
  drawAttendance(att.lessons.filter((l) => l.weekday === weekdayOf(att.date)), kids);
}

async function saveAttendance() {
  const msg = document.getElementById('att-msg');
  msg.className = 'msg';
  msg.textContent = '';
  const kids = (tutorMe.group && tutorMe.group.students) || [];
  try {
    await api('/api/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({
        lesson_id: att.lessonId,
        date: att.date,
        records: kids.map((k) => ({ student_id: k.id, present: !!att.present[k.id] })),
      }),
    });
    msg.className = 'msg ok';
    msg.textContent = 'Сақталды ✓';
  } catch (e) {
    msg.className = 'msg err';
    msg.textContent = 'Қате: ' + e.message;
  }
}

/* ---------------- Карта развития ---------------- */
// Родитель видит её только для чтения, воспитатель — с возможностью изменить.
const card = { studentId: null, name: '', ageGroup: 'kishi', groups: [], levels: [], catalog: null, marks: {} };

async function openCard(studentId, name, ageGroup) {
  card.studentId = studentId;
  card.name = name;
  if (ageGroup) card.ageGroup = ageGroup;
  const tabs = document.getElementById('tp-tabs');
  if (tabs) tabs.style.display = 'none'; // на экране карты вкладки не нужны
  const body = document.getElementById(ROLE === 'tutor' ? 'tp-body' : 'pp-body');
  body.innerHTML = '<div class="empty">Загрузка карты…</div>';
  try {
    const d = await api(`/api/devcards/student/${studentId}?age_group=${card.ageGroup}`);
    card.groups = d.ageGroups || [];
    card.levels = d.levels || [];
    card.catalog = d.catalog;
    card.marks = (d.card && d.card.marks) || {};
    card.period = (d.card && d.card.period) || '';
    renderCard();
  } catch (e) {
    body.innerHTML = `<div class="empty">Ошибка: ${esc(e.message)}
      <br><br><button class="gchip" onclick="openPanel()">← Назад</button></div>`;
  }
}

function renderCard() {
  const editable = ROLE === 'tutor';
  const body = document.getElementById(editable ? 'tp-body' : 'pp-body');
  const filled = Object.keys(card.marks).length;
  const total = card.catalog ? card.catalog.areas.reduce((n, a) => n + a.skills.length, 0) : 0;

  body.innerHTML = `
    <button class="back" onclick="openPanel()">← К списку детей</button>
    <div class="card" style="margin-bottom:16px;">
      <div class="tl" style="font-size:16px;font-weight:800;">${esc(card.name)}</div>
      <div class="sb" style="font-size:12.5px;color:var(--muted);font-weight:600;margin-top:4px;">
        Индивидуальная карта развития (НОБД)
      </div>
      <div style="margin-top:10px;">
        <span class="pill">Заполнено ${filled} из ${total}</span>
        ${card.period ? ` <span class="tag" style="font-size:11.5px;color:var(--muted);font-weight:800;">${esc(card.period)}</span>` : ''}
      </div>
      ${editable ? `<div class="fld" style="margin:14px 0 0;">
        <label>Аралық күні (период оценки)</label>
        <input type="text" id="dc-period" value="${esc(card.period)}" placeholder="Мыс.: 2026 қаңтар">
      </div>` : ''}
    </div>

    <div class="dcbar">
      ${card.groups.map((g) => `<button class="gchip ${g.key === card.ageGroup ? 'on' : ''}"
          onclick="switchGroup('${g.key}')">${esc(g.label)}</button>`).join('')}
    </div>

    <div class="${editable ? '' : 'ro'}">
      ${card.catalog ? card.catalog.areas.map((a) => `
        <div class="area">
          <h4>${esc(a.label)}</h4>
          ${a.skills.map((s) => skillBlock(s, editable)).join('')}
        </div>`).join('') : ''}
    </div>

    ${editable ? `<div class="savebar">
      <button class="btn" onclick="saveCard()">Сохранить карту</button>
      <div class="msg" id="dc-msg"></div>
    </div>` : `<div class="note" style="margin-top:4px;">
      Карту заполняет воспитатель группы. Здесь она доступна только для просмотра.
    </div>`}`;
}

function skillBlock(s, editable) {
  const cur = card.marks[s.no] || '';
  const lvls = card.levels.map((lv) => {
    const on = cur === lv.key ? ` on-${lv.key}` : '';
    const click = editable ? ` onclick="pickLevel(${s.no},'${lv.key}')"` : '';
    return `<span class="lv${on}"${click}>${esc(lv.label)}</span>`;
  }).join('');
  return `<div class="sk">
    <div class="hd"><span class="no">${s.no}</span><span class="tx">${esc(s.text)}</span></div>
    <div class="lvls">${lvls}</div>
  </div>`;
}

function switchGroup(key) {
  card.ageGroup = key;
  openCard(card.studentId, card.name, key);
}

// Повторный тап по выбранному уровню снимает отметку.
function pickLevel(no, level) {
  if (card.marks[no] === level) delete card.marks[no];
  else card.marks[no] = level;
  const period = document.getElementById('dc-period');
  if (period) card.period = period.value;
  renderCard();
}

async function saveCard() {
  const msg = document.getElementById('dc-msg');
  const periodEl = document.getElementById('dc-period');
  msg.className = 'msg';
  msg.textContent = '';
  try {
    await api(`/api/devcards/student/${card.studentId}`, {
      method: 'PUT',
      body: JSON.stringify({
        age_group: card.ageGroup,
        period: periodEl ? periodEl.value.trim() : card.period,
        marks: card.marks,
      }),
    });
    msg.className = 'msg ok';
    msg.textContent = 'Сохранено ✓';
  } catch (e) {
    msg.className = 'msg err';
    msg.textContent = 'Ошибка: ' + e.message;
  }
}

/* ---------------- Старт ---------------- */
loadKindergarten();
if (TOKEN && ROLES[ROLE]) {
  // Проверяем, что токен ещё жив, иначе возвращаемся к выбору роли.
  api('/api/auth/me').then(openPanel).catch(logout);
}
