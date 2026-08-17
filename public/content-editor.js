/* Визуальный редактор контента приложения (без JSON).
 * Формы с выбором иконки/цвета/эмодзи + живое превью «как в приложении».
 * Использует api() и escapeHtml()/escapeAttr() из app.js. Экспортирует window.ce. */
const ce = (function () {
  // Каталог иконок: value — то, что хранится и понимает приложение; e — эмодзи для превью.
  const ICONS = [
    { v: 'clipboard-list', e: '📋', l: 'Программа / список' },
    { v: 'books', e: '📚', l: 'Книги / предметы' },
    { v: 'calendar', e: '📅', l: 'Календарь / расписание' },
    { v: 'run', e: '🏃', l: 'Движение / моторика' },
    { v: 'heart', e: '❤️', l: 'Сердце / эмоции' },
    { v: 'clock', e: '🕘', l: 'Часы / режим' },
    { v: 'soup', e: '🍲', l: 'Питание' },
    { v: 'ball', e: '⚽', l: 'Мяч / спорт' },
    { v: 'notebook', e: '📔', l: 'Тетрадь / памятка' },
    { v: 'coin', e: '🪙', l: 'Оплата / цены' },
    { v: 'palette', e: '🎨', l: 'Рисование' },
    { v: 'music', e: '🎵', l: 'Музыка' },
    { v: 'abc', e: '🔤', l: 'Язык / буквы' },
    { v: 'music-star', e: '🌟', l: 'Танцы / звезда' },
    { v: 'chess', e: '♟️', l: 'Шахматы / логика' },
    { v: 'star', e: '⭐', l: 'Звезда' },
    { v: 'sun', e: '☀️', l: 'Солнце' },
    { v: 'pencil', e: '✏️', l: 'Карандаш' },
    { v: 'globe', e: '🌍', l: 'Мир / окружение' },
    { v: 'puzzle', e: '🧩', l: 'Пазл / логика' },
  ];
  // Палитра дизайна (совпадает с цветами приложения).
  const COLORS = [
    { v: 'orange', hex: '#F6A623', l: 'Оранжевый' },
    { v: 'green', hex: '#3DBE7A', l: 'Зелёный' },
    { v: 'yellow', hex: '#F5C93B', l: 'Жёлтый' },
    { v: 'purple', hex: '#9B6BD8', l: 'Фиолетовый' },
    { v: 'pink', hex: '#EA6A9B', l: 'Розовый' },
    { v: 'blue', hex: '#4A97E0', l: 'Синий' },
    { v: 'mint', hex: '#4FC5C0', l: 'Мятный' },
    { v: 'rose', hex: '#E86A6A', l: 'Красный' },
  ];

  const iconEmoji = (v) => (ICONS.find((i) => i.v === v) || ICONS[0]).e;
  const colorHex = (v) => (COLORS.find((c) => c.v === v) || COLORS[0]).hex;

  const SECTIONS = {
    home: {
      kind: 'object',
      fields: [
        { key: 'heroEmoji', label: 'Эмодзи (крупный значок сверху)', type: 'emoji' },
        { key: 'heroText', label: 'Приветственный текст', type: 'textarea' },
      ],
    },
    contacts: {
      kind: 'object',
      fields: [
        { key: 'name', label: 'Название', type: 'text' },
        { key: 'city', label: 'Город', type: 'text' },
        { key: 'phones', label: 'Телефоны', type: 'stringlist' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'address', label: 'Адрес', type: 'text' },
        { key: 'instagram', label: 'Instagram (ссылка/ник)', type: 'text' },
        { key: 'facebook', label: 'Facebook (ссылка)', type: 'text' },
        { key: 'whatsapp', label: 'WhatsApp (номер/ссылка)', type: 'text' },
      ],
    },
  };

  let data = {};

  function init(content) {
    data = {
      home: content.home && typeof content.home === 'object' ? content.home : { heroEmoji: '🎈', heroText: '' },
      contacts: content.contacts && typeof content.contacts === 'object' ? content.contacts : {},
    };
    Object.keys(SECTIONS).forEach(render);
  }

  function render(section) {
    renderForm(section);
    renderPreview(section);
  }

  /* --------------------------- Формы --------------------------- */
  function renderForm(section) {
    const cfg = SECTIONS[section];
    const box = document.getElementById('ce-form-' + section);
    if (!box) return;
    if (cfg.kind === 'object') box.innerHTML = cfg.fields.map((f) => objField(section, f)).join('');
    else if (cfg.kind === 'cards') box.innerHTML = cardsForm(section, cfg);
    else if (cfg.kind === 'tiles') box.innerHTML = tilesForm(section, cfg);
  }

  function objField(section, f) {
    const v = data[section][f.key];
    if (f.type === 'textarea') {
      return row(f.label, `<textarea oninput="ce.setField('${section}','${f.key}',this.value)">${escapeHtml(v || '')}</textarea>`);
    }
    if (f.type === 'emoji') {
      return row(f.label, `<input type="text" class="ce-emoji-in" value="${escapeAttr(v || '')}" oninput="ce.setField('${section}','${f.key}',this.value)">`);
    }
    if (f.type === 'stringlist') {
      const arr = Array.isArray(v) ? v : [];
      const items = arr.map((s, i) => `
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <input type="text" value="${escapeAttr(s)}" oninput="ce.setListStr('${section}','${f.key}',${i},this.value)" style="flex:1;">
          <button class="ce-mini rm" onclick="ce.removeListStr('${section}','${f.key}',${i})">✕</button>
        </div>`).join('');
      return row(f.label, `${items}<button class="ce-add" onclick="ce.addListStr('${section}','${f.key}')">+ Добавить</button>`);
    }
    return row(f.label, `<input type="text" value="${escapeAttr(v || '')}" oninput="ce.setField('${section}','${f.key}',this.value)">`);
  }

  function row(label, inner) {
    return `<div class="ce-row"><label>${escapeHtml(label)}</label>${inner}</div>`;
  }

  function cardsForm(section, cfg) {
    const list = data[section];
    const cards = list.map((c, i) => `
      <div class="ce-card">
        <div class="ce-card-head">
          <span class="n">Карточка ${i + 1}</span><span class="sp"></span>
          <button class="ce-mini" onclick="ce.moveCard('${section}',${i},-1)" title="Выше">↑</button>
          <button class="ce-mini" onclick="ce.moveCard('${section}',${i},1)" title="Ниже">↓</button>
          <button class="ce-mini rm" onclick="ce.removeCard('${section}',${i})">Удалить</button>
        </div>
        <div class="ce-grid">
          <div class="ce-row full"><label>Заголовок</label><input type="text" value="${escapeAttr(c.title || '')}" oninput="ce.setCardField('${section}',${i},'title',this.value)"></div>
          <div class="ce-row full"><label>Описание</label><input type="text" value="${escapeAttr(c.desc || '')}" oninput="ce.setCardField('${section}',${i},'desc',this.value)"></div>
          <div class="ce-row ${cfg.color ? '' : 'full'}"><label>Иконка</label>${iconSelect(section, i, c.icon)}</div>
          ${cfg.color ? `<div class="ce-row"><label>Цвет</label>${swatches(section, i, c.color)}</div>` : ''}
        </div>
      </div>`).join('');
    return cards + `<button class="ce-add" onclick="ce.addCard('${section}')">+ Добавить карточку</button>`;
  }

  function tilesForm(section, cfg) {
    const list = data[section];
    const tiles = list.map((t, i) => `
      <div class="ce-card">
        <div class="ce-card-head">
          <span class="n">Плитка ${i + 1}</span><span class="sp"></span>
          <button class="ce-mini" onclick="ce.moveCard('${section}',${i},-1)">↑</button>
          <button class="ce-mini" onclick="ce.moveCard('${section}',${i},1)">↓</button>
          <button class="ce-mini rm" onclick="ce.removeCard('${section}',${i})">Удалить</button>
        </div>
        <div class="ce-grid">
          <div class="ce-row"><label>Эмодзи</label><input type="text" class="ce-emoji-in" value="${escapeAttr(t.emoji || '')}" oninput="ce.setCardField('${section}',${i},'emoji',this.value)"></div>
          <div class="ce-row"><label>Цвет фона</label>${swatches(section, i, t.color)}</div>
        </div>
      </div>`).join('');
    return tiles + `<button class="ce-add" onclick="ce.addCard('${section}')">+ Добавить плитку</button>`;
  }

  function iconSelect(section, i, current) {
    const opts = ICONS.map((ic) => `<option value="${ic.v}" ${ic.v === current ? 'selected' : ''}>${ic.e}  ${escapeHtml(ic.l)}</option>`).join('');
    return `<select onchange="ce.setCardField('${section}',${i},'icon',this.value)">${opts}</select>`;
  }

  function swatches(section, i, current) {
    return `<div class="ce-pick">` + COLORS.map((c) =>
      `<span class="ce-swatch ${c.v === current ? 'on' : ''}" style="background:${c.hex}" title="${escapeHtml(c.l)}" onclick="ce.pickColor('${section}',${i},'${c.v}')"></span>`
    ).join('') + `</div>`;
  }

  /* --------------------------- Превью --------------------------- */
  function renderPreview(section) {
    const box = document.getElementById('ce-prev-' + section);
    if (!box) return;
    const cfg = SECTIONS[section];
    if (section === 'home') {
      const d = data.home;
      box.innerHTML = `<div class="ph-hero"><div class="em">${escapeHtml(d.heroEmoji || '🎈')}</div><div class="tx">${escapeHtml(d.heroText || '')}</div></div>`;
    } else if (section === 'contacts') {
      const d = data.contacts;
      const phones = (Array.isArray(d.phones) ? d.phones : []).filter(Boolean);
      box.innerHTML = `<div class="ph-contacts">
        <div class="nm">${escapeHtml(d.name || 'Название')}</div>
        ${d.city ? `<div class="rw"><span>📍</span>${escapeHtml(d.city)}</div>` : ''}
        ${phones.map((p) => `<div class="rw"><span>📞</span>${escapeHtml(p)}</div>`).join('')}
        ${d.email ? `<div class="rw"><span>✉️</span>${escapeHtml(d.email)}</div>` : ''}
        ${d.address ? `<div class="rw"><span>🏠</span>${escapeHtml(d.address)}</div>` : ''}
        ${d.instagram ? `<div class="rw"><span>📸</span>${escapeHtml(d.instagram)}</div>` : ''}
        ${d.whatsapp ? `<div class="rw"><span>💬</span>${escapeHtml(d.whatsapp)}</div>` : ''}
      </div>`;
    } else if (cfg.kind === 'cards') {
      box.innerHTML = data[section].map((c) => {
        const hex = cfg.color ? colorHex(c.color) : '#ED7A4E';
        return `<div class="ph-card" style="border-left-color:${hex}">
          <div class="ic" style="background:${hex}22">${escapeHtml(iconEmoji(c.icon))}</div>
          <div><div class="tt">${escapeHtml(c.title || 'Заголовок')}</div><div class="ds">${escapeHtml(c.desc || '')}</div></div>
        </div>`;
      }).join('') || emptyHint();
    } else if (cfg.kind === 'tiles') {
      box.innerHTML = `<div class="ph-tiles">` + data[section].map((t) =>
        `<div class="ph-tile" style="background:${colorHex(t.color)}22">${escapeHtml(t.emoji || '🖼️')}</div>`
      ).join('') + `</div>` || emptyHint();
    }
  }

  function emptyHint() {
    return '<div style="text-align:center;color:#a98876;font-size:12px;font-weight:700;padding:30px 0;">Пока пусто — добавьте карточку</div>';
  }

  /* --------------------------- Изменения --------------------------- */
  // Текстовые поля: обновляем данные и только превью (чтобы не терять курсор).
  function setField(section, key, value) {
    data[section][key] = value;
    renderPreview(section);
  }
  function setCardField(section, i, key, value) {
    data[section][i][key] = value;
    renderPreview(section);
  }
  function setListStr(section, key, i, value) {
    data[section][key][i] = value;
    renderPreview(section);
  }
  function addListStr(section, key) {
    if (!Array.isArray(data[section][key])) data[section][key] = [];
    data[section][key].push('');
    render(section);
  }
  function removeListStr(section, key, i) {
    data[section][key].splice(i, 1);
    render(section);
  }
  // Выбор цвета/иконки: перерисовываем форму (подсветка) и превью.
  function pickColor(section, i, color) {
    data[section][i].color = color;
    render(section);
  }
  function newId(prefix) {
    return prefix + '-' + Math.random().toString(36).slice(2, 7);
  }
  function addCard(section) {
    const cfg = SECTIONS[section];
    if (cfg.kind === 'tiles') {
      data[section].push({ id: newId(cfg.prefix), emoji: '🎈', color: COLORS[0].v });
    } else {
      const card = { id: newId(cfg.prefix), icon: ICONS[0].v, title: '', desc: '' };
      if (cfg.color) card.color = COLORS[0].v;
      data[section].push(card);
    }
    render(section);
  }
  function removeCard(section, i) {
    data[section].splice(i, 1);
    render(section);
  }
  function moveCard(section, i, dir) {
    const list = data[section];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    render(section);
  }

  /* --------------------------- Сохранение --------------------------- */
  async function save(section) {
    const msg = document.getElementById('msg-' + section);
    msg.className = 'msg';
    msg.textContent = '';
    try {
      await api('/api/admin/content/' + section, { method: 'PUT', body: JSON.stringify(data[section]) });
      msg.className = 'msg ok';
      msg.textContent = 'Сохранено ✓ — применится в приложении';
    } catch (e) {
      msg.className = 'msg err';
      msg.textContent = 'Ошибка: ' + e.message;
    }
  }

  return {
    init, save, setField, setCardField, setListStr, addListStr, removeListStr,
    pickColor, addCard, removeCard, moveCard,
  };
})();
window.ce = ce;
