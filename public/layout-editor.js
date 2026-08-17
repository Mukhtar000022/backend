/* Порядок блоков на главном экране родителя.
 * Админ перетаскивает панели — приложение показывает их в этом порядке
 * (см. mobile-app/src/screens/ParentHomeScreen.tsx). */
const layoutEditor = (function () {
  // Ключи должны совпадать с BLOCKS в ParentHomeScreen.
  const BLOCKS = [
    { key: 'report', label: 'Бүгін бақшада (есеп)', hint: 'Көңіл-күй, ұйқы, тамақ' },
    { key: 'menu', label: 'Ас мәзірі', hint: '5 тамақ' },
    { key: 'routine', label: 'Күн тәртібі', hint: 'Уақыт кестесі' },
    { key: 'photos', label: 'Суреттер', hint: 'Күннің фотолары' },
    { key: 'tutor', label: 'Тәрбиешімен байланыс', hint: 'Чатқа сілтеме' },
  ];

  const DEFAULT_ORDER = BLOCKS.map((b) => b.key);

  let order = DEFAULT_ORDER.slice();
  let hidden = [];
  let dragKey = null;

  const meta = (key) => BLOCKS.find((b) => b.key === key) || { key, label: key, hint: '' };

  function init(layout) {
    const saved = layout && Array.isArray(layout.order) ? layout.order.filter((k) => DEFAULT_ORDER.includes(k)) : [];
    // Новые блоки, которых нет в сохранённом порядке, добавляем в конец.
    order = saved.concat(DEFAULT_ORDER.filter((k) => !saved.includes(k)));
    hidden = layout && Array.isArray(layout.hidden) ? layout.hidden.filter((k) => DEFAULT_ORDER.includes(k)) : [];
    render();
  }

  function render() {
    document.getElementById('layoutList').innerHTML = order.map((key, i) => {
      const b = meta(key);
      const off = hidden.includes(key);
      return `
        <div class="lay-item${off ? ' off' : ''}" draggable="true"
             ondragstart="layoutEditor.dragStart('${key}')"
             ondragover="event.preventDefault()"
             ondrop="layoutEditor.drop('${key}')">
          <span class="lay-grip">⋮⋮</span>
          <div class="lay-txt">
            <b>${escapeHtml(b.label)}</b>
            <small>${escapeHtml(b.hint)}</small>
          </div>
          <div class="lay-btns">
            <button title="Жоғары" onclick="layoutEditor.move(${i},-1)" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button title="Төмен" onclick="layoutEditor.move(${i},1)" ${i === order.length - 1 ? 'disabled' : ''}>↓</button>
            <button title="${off ? 'Көрсету' : 'Жасыру'}" onclick="layoutEditor.toggle('${key}')">${off ? '🚫' : '👁'}</button>
          </div>
        </div>`;
    }).join('');
    preview();
  }

  function dragStart(key) {
    dragKey = key;
  }

  function drop(overKey) {
    if (!dragKey || dragKey === overKey) return;
    const from = order.indexOf(dragKey);
    const to = order.indexOf(overKey);
    order.splice(to, 0, order.splice(from, 1)[0]);
    dragKey = null;
    render();
  }

  function move(index, delta) {
    const to = index + delta;
    if (to < 0 || to >= order.length) return;
    order.splice(to, 0, order.splice(index, 1)[0]);
    render();
  }

  function toggle(key) {
    hidden = hidden.includes(key) ? hidden.filter((k) => k !== key) : hidden.concat(key);
    render();
  }

  // Превью — упрощённый телефон с блоками в выбранном порядке.
  function preview() {
    const box = document.getElementById('layoutPreview');
    if (!box) return;
    const card = (title, body) =>
      `<div style="background:#fff;border:1px solid #f1e4dd;border-radius:12px;padding:11px;margin-top:9px;">
         <div style="font-size:12px;font-weight:800;color:#993C1D;">${title}</div>
         <div style="font-size:10.5px;color:#b08573;margin-top:3px;">${body}</div>
       </div>`;

    const views = {
      report: `<div style="background:#D85A30;border-radius:14px;padding:12px;margin-top:9px;">
                 <div style="font-size:9px;color:rgba(255,255,255,.85);font-weight:800;">БҮГІН БАҚШАДА</div>
                 <div style="font-size:14px;font-weight:800;color:#fff;margin-top:5px;">Күні тамаша өтті!</div>
               </div>`,
      menu: card('Ас мәзірі', 'Ботқа · Сорпа · Көже'),
      routine: card('Күн тәртібі', '08:00 Қабылдау · 12:15 Түскі ас'),
      photos: card('Суреттер', '3 фото'),
      tutor: card('Тәрбиеші', 'Хабарласу'),
    };

    box.innerHTML = order.filter((k) => !hidden.includes(k)).map((k) => views[k] || '').join('')
      || '<div class="dc-empty">Барлық блок жасырылған</div>';
  }

  async function save() {
    const msg = document.getElementById('msg-layout');
    msg.className = 'msg';
    msg.textContent = '';
    try {
      await api('/api/admin/content/layout', {
        method: 'PUT',
        body: JSON.stringify({ order, hidden }),
      });
      msg.className = 'msg ok';
      msg.textContent = 'Сохранено ✓ — родители увидят при следующем открытии';
    } catch (e) {
      msg.className = 'msg err';
      msg.textContent = 'Ошибка: ' + e.message;
    }
  }

  function reset() {
    order = DEFAULT_ORDER.slice();
    hidden = [];
    render();
  }

  return { init, dragStart, drop, move, toggle, save, reset, BLOCKS };
})();

window.layoutEditor = layoutEditor;
function layoutSave() { layoutEditor.save(); }
function layoutReset() { layoutEditor.reset(); }
