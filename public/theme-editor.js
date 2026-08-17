/* Редактор цветов приложения. Значения уходят в раздел «theme» контента,
 * мобильное приложение забирает их при запуске (mobile-app/src/theme.ts). */
const themeEditor = (function () {
  // Ключи и значения по умолчанию должны совпадать с mobile-app/src/theme.ts
  const FIELDS = [
    { key: 'primary', label: 'Основной (кнопки, акценты)', def: '#D85A30' },
    { key: 'primaryDark', label: 'Тёмный акцент (заголовки)', def: '#993C1D' },
    { key: 'bg', label: 'Фон экрана', def: '#FFF7F3' },
    { key: 'heroBg', label: 'Фон карточек-плиток', def: '#FAECE7' },
    { key: 'text', label: 'Основной текст', def: '#3a2a22' },
    { key: 'muted', label: 'Второстепенный текст', def: '#b08573' },
    { key: 'border', label: 'Границы', def: '#f1e4dd' },
    { key: 'navInactive', label: 'Неактивное меню', def: '#c2a99d' },
  ];

  let current = {};

  function defaults() {
    const out = {};
    FIELDS.forEach((f) => (out[f.key] = f.def));
    return out;
  }

  function init(theme) {
    current = Object.assign(defaults(), theme && typeof theme === 'object' ? theme : {});
    render();
  }

  function render() {
    document.getElementById('themeForm').innerHTML = FIELDS.map((f) => `
      <div class="ce-row">
        <label>${f.label}</label>
        <div style="display:flex;gap:10px;align-items:center;">
          <input type="color" id="tc-${f.key}" value="${current[f.key]}" style="width:52px;height:42px;padding:2px;border-radius:10px;border:1.5px solid var(--border);background:#fff;cursor:pointer;"
                 oninput="themeEditor.set('${f.key}', this.value, 'color')">
          <input type="text" id="tt-${f.key}" value="${current[f.key]}" style="flex:1;"
                 oninput="themeEditor.set('${f.key}', this.value, 'text')">
        </div>
      </div>`).join('');
    preview();
  }

  // Форму НЕ перерисовываем при правке: перерисовка закрывает палитру
  // (нативный диалог выбора цвета) и сбивает курсор в текстовом поле.
  // Обновляем только парное поле и превью.
  function set(key, value, from) {
    current[key] = value;
    const pair = from === 'color' ? document.getElementById('tt-' + key) : document.getElementById('tc-' + key);
    if (pair) {
      // В <input type="color"> можно писать только корректный #RRGGBB.
      if (from === 'text') {
        if (/^#[0-9a-f]{6}$/i.test(String(value).trim())) pair.value = value.trim();
      } else {
        pair.value = value;
      }
    }
    preview();
  }

  function preview() {
    const c = current;
    document.getElementById('themePreview').innerHTML = `
      <div style="background:${c.bg};border-radius:14px;padding:14px;min-height:390px;">
        <div style="font-size:15px;font-weight:800;color:${c.text};">Сәлем, Айгүл!</div>
        <div style="font-size:11px;color:${c.muted};margin-top:2px;">Айсұлтан · Күншуақ тобы</div>

        <div style="background:${c.primary};border-radius:16px;padding:14px;margin-top:12px;">
          <div style="font-size:9px;letter-spacing:.8px;color:rgba(255,255,255,.85);font-weight:800;">БҮГІН БАҚШАДА</div>
          <div style="font-size:16px;font-weight:800;color:#fff;margin-top:6px;">Күні тамаша өтті!</div>
          <div style="display:flex;gap:6px;margin-top:10px;">
            ${['Көңілді', '1 с 40 м', '3/3'].map((v) =>
              `<div style="flex:1;background:rgba(255,255,255,.18);border-radius:10px;padding:7px;">
                 <div style="font-size:11px;color:#fff;font-weight:800;">${v}</div></div>`).join('')}
          </div>
          <div style="background:#fff;border-radius:11px;padding:9px;text-align:center;margin-top:10px;
                      font-size:11.5px;font-weight:800;color:${c.primaryDark};">Толық есепті ашу</div>
        </div>

        <div style="display:flex;gap:9px;margin-top:11px;">
          <div style="flex:1;background:${c.heroBg};border-radius:12px;padding:11px;">
            <div style="font-size:12px;font-weight:800;color:${c.text};">Ас мәзірі</div>
            <div style="font-size:10px;color:${c.muted};margin-top:2px;">Сорпа, палау</div>
          </div>
          <div style="flex:1;background:${c.heroBg};border-radius:12px;padding:11px;">
            <div style="font-size:12px;font-weight:800;color:${c.text};">Төлем</div>
            <div style="font-size:10px;color:${c.muted};margin-top:2px;">24 500 ₸</div>
          </div>
        </div>

        <div style="background:#fff;border:1px solid ${c.border};border-radius:12px;padding:12px;margin-top:11px;">
          <div style="font-size:12px;font-weight:800;color:${c.primaryDark};">Күн тәртібі</div>
          ${[['08:00', 'Қабылдау'], ['12:15', 'Түскі ас']].map(([tm, tt]) =>
            `<div style="display:flex;gap:9px;padding-top:8px;">
               <span style="font-size:11px;font-weight:800;color:${c.primary};">${tm}</span>
               <span style="font-size:11.5px;color:${c.text};font-weight:700;">${tt}</span></div>`).join('')}
        </div>

        <div style="display:flex;gap:14px;justify-content:space-around;background:#fff;border-top:1px solid ${c.border};
                    border-radius:0 0 12px 12px;padding:10px;margin-top:14px;">
          <span style="font-size:10px;font-weight:800;color:${c.primary};">Басты</span>
          <span style="font-size:10px;font-weight:800;color:${c.navInactive};">Чат</span>
          <span style="font-size:10px;font-weight:800;color:${c.navInactive};">Профиль</span>
        </div>
      </div>`;
  }

  async function save() {
    const msg = document.getElementById('msg-theme');
    msg.className = 'msg';
    msg.textContent = '';
    const bad = Object.entries(current).find(([, v]) => !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v).trim()));
    if (bad) {
      msg.className = 'msg err';
      msg.textContent = 'Цвет должен быть в формате #RRGGBB: ' + bad[0];
      return;
    }
    try {
      await api('/api/admin/content/theme', { method: 'PUT', body: JSON.stringify(current) });
      msg.className = 'msg ok';
      msg.textContent = 'Сохранено ✓ — применится в приложении при следующем запуске';
    } catch (e) {
      msg.className = 'msg err';
      msg.textContent = 'Ошибка: ' + e.message;
    }
  }

  function reset() {
    current = defaults();
    render();
  }

  return { init, set, save, reset };
})();

window.themeEditor = themeEditor;
function themeSave() { themeEditor.save(); }
function themeReset() { themeEditor.reset(); }
