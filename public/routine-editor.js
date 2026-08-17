/* Күн тәртібі и ас мәзірі группы в админ-панели.
 * То же самое воспитатель заполняет в приложении — данные общие. */
let rtItems = [];

// Дни недели: набор пунктов сохраняется сразу на все отмеченные дни.
const RT_WEEKDAYS = [
  { n: 1, label: 'Дүйсенбі', short: 'Дс' },
  { n: 2, label: 'Сейсенбі', short: 'Сс' },
  { n: 3, label: 'Сәрсенбі', short: 'Ср' },
  { n: 4, label: 'Бейсенбі', short: 'Бс' },
  { n: 5, label: 'Жұма', short: 'Жм' },
  { n: 6, label: 'Сенбі', short: 'Сб' },
  { n: 7, label: 'Жексенбі', short: 'Жк' },
];

// По умолчанию — рабочая неделя.
let rtDays = [1, 2, 3, 4, 5];

// Ас мәзірі — 5 приёмов пищи (порядок как в форме и предпросмотре).
const RT_MEALS = [
  { key: 'breakfast', label: 'Таңғы' },
  { key: 'breakfast2', label: 'Екінші таңғы' },
  { key: 'lunch', label: 'Түскі' },
  { key: 'snack', label: 'Бесін' },
  { key: 'dinner', label: 'Кешкі' },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function routineInit() {
  const sel = document.getElementById('rt-group');
  document.getElementById('rt-date').value = todayStr();
  try {
    const groups = await api('/api/groups');
    sel.innerHTML = groups.map((g) => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('')
      || '<option value="">— групп пока нет —</option>';
  } catch (e) {
    sel.innerHTML = '<option value="">— не удалось загрузить —</option>';
  }
  routineLoad();
}

// Показываем распорядок первого отмеченного дня — его же и правим.
async function routineLoad() {
  const groupId = document.getElementById('rt-group').value;
  if (!groupId) return;
  const day = rtDays.length ? rtDays[0] : 0;
  try {
    const all = await api(`/api/daycare/routine?group_id=${groupId}&weekday=${day}`);
    rtItems = all.map((it) => ({ time: it.time, title: it.title, subtitle: it.subtitle }));
  } catch (e) {
    rtItems = [];
  }
  routineDaysRender();
  routineRender();
  routineLoadMenu();
}

function routineDaysRender() {
  const box = document.getElementById('rt-days');
  if (!box) return;
  box.innerHTML = RT_WEEKDAYS.map((d) => `
    <button type="button" class="rt-day${rtDays.includes(d.n) ? ' on' : ''}"
            onclick="routineToggleDay(${d.n})" title="${d.label}">${d.short}</button>`).join('') +
    `<button type="button" class="rt-day all" onclick="routineAllDays()">Барлық күн</button>`;
}

function routineToggleDay(n) {
  rtDays = rtDays.includes(n) ? rtDays.filter((d) => d !== n) : rtDays.concat(n).sort((a, b) => a - b);
  routineDaysRender();
  routineLoad(); // подтягиваем распорядок выбранного дня
}

function routineAllDays() {
  rtDays = [1, 2, 3, 4, 5, 6, 7];
  routineDaysRender();
  routineLoad();
}

async function routineLoadMenu() {
  const groupId = document.getElementById('rt-group').value;
  const date = document.getElementById('rt-date').value || todayStr();
  if (!groupId) return;
  try {
    const m = await api(`/api/daycare/menu?group_id=${groupId}&date=${date}`);
    RT_MEALS.forEach((meal) => {
      document.getElementById('rt-' + meal.key).value = m[meal.key] || '';
    });
  } catch (e) {
    /* меню на эту дату ещё нет */
  }
  routinePreview();
}

function routineRender() {
  document.getElementById('rt-items').innerHTML = rtItems.map((it, i) => `
    <div class="rt-item">
      <div>
        <label>Уақыты</label>
        <input type="text" value="${escapeAttr(it.time || '')}" placeholder="08:00"
               oninput="routineSet(${i},'time',this.value)">
      </div>
      <div>
        <label>Атауы</label>
        <input type="text" value="${escapeAttr(it.title || '')}" placeholder="Қабылдау, таңғы жаттығу"
               oninput="routineSet(${i},'title',this.value)">
      </div>
      <button class="rt-del" onclick="routineRemove(${i})">✕</button>
      <div class="full">
        <label>Нақтылау</label>
        <input type="text" value="${escapeAttr(it.subtitle || '')}" placeholder="Спорт залы"
               oninput="routineSet(${i},'subtitle',this.value)">
      </div>
    </div>`).join('') || '<div class="dc-empty">Пункттер жоқ — «+ Пункт қосу» батырмасын басыңыз.</div>';
  routinePreview();
}

// Текстовые правки не перерисовывают форму — иначе сбивается курсор.
function routineSet(i, key, value) {
  rtItems[i][key] = value;
  routinePreview();
}

function routineAdd() {
  rtItems.push({ time: '', title: '', subtitle: '' });
  routineRender();
}

function routineRemove(i) {
  rtItems.splice(i, 1);
  routineRender();
}

function routinePreview() {
  const rows = rtItems
    .filter((it) => (it.title || '').trim())
    .map((it) => `<div class="ph-routine">
        <div class="tm">${escapeHtml(it.time || '—')}</div>
        <div class="tt">${escapeHtml(it.title)}</div>
        ${it.subtitle ? `<div class="st">${escapeHtml(it.subtitle)}</div>` : ''}
      </div>`).join('');

  document.getElementById('rt-preview').innerHTML =
    `<div style="font-size:14px;font-weight:800;color:#993C1D;margin-bottom:10px;">Күн тәртібі</div>` +
    (rows || '<div class="dc-empty">Әзірге бос</div>') +
    `<div style="font-size:14px;font-weight:800;color:#993C1D;margin:16px 0 8px;">Ас мәзірі</div>
     <div class="ph-contacts">${RT_MEALS.map((meal) => {
       const value = (document.getElementById('rt-' + meal.key) || {}).value || '';
       return `<div class="rw"><span>${meal.label}</span>${escapeHtml(value || '—')}</div>`;
     }).join('')}</div>`;
}

async function routineSave() {
  const msg = document.getElementById('msg-routine');
  const groupId = document.getElementById('rt-group').value;
  const date = document.getElementById('rt-date').value || todayStr();
  msg.className = 'msg';
  msg.textContent = '';
  if (!groupId) {
    msg.className = 'msg err';
    msg.textContent = 'Сначала выберите группу';
    return;
  }
  if (!rtDays.length) {
    msg.className = 'msg err';
    msg.textContent = 'Отметьте хотя бы один день недели';
    return;
  }
  try {
    await api('/api/daycare/routine', {
      method: 'PUT',
      body: JSON.stringify({ group_id: Number(groupId), items: rtItems, weekdays: rtDays }),
    });
    const menuBody = { group_id: Number(groupId), date };
    RT_MEALS.forEach((meal) => {
      menuBody[meal.key] = document.getElementById('rt-' + meal.key).value.trim();
    });
    await api('/api/daycare/menu', { method: 'PUT', body: JSON.stringify(menuBody) });
    const days = rtDays.map((n) => (RT_WEEKDAYS.find((d) => d.n === n) || {}).short).join(', ');
    msg.className = 'msg ok';
    msg.textContent = `Сохранено ✓ — распорядок записан на дни: ${days}`;
  } catch (e) {
    msg.className = 'msg err';
    msg.textContent = 'Ошибка: ' + e.message;
  }
}
