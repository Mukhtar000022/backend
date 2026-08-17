/* Просмотр переписки «воспитатель ↔ родитель» администратором.
 * Только чтение: админ видит диалоги, но не пишет в них. */
let chatsItems = [];
let chatsOpenId = null;

function chatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function chatsLoad() {
  const box = document.getElementById('chatsList');
  box.innerHTML = '<div class="dc-empty">Жүктелуде…</div>';
  try {
    chatsItems = await api('/api/chat/admin/conversations');
  } catch (e) {
    box.innerHTML = `<div class="dc-empty">Ошибка: ${escapeHtml(e.message)}</div>`;
    return;
  }
  chatsRenderList();
}

function chatsRenderList() {
  const box = document.getElementById('chatsList');
  if (!chatsItems.length) {
    box.innerHTML = '<div class="dc-empty">Әзірге жазысу жоқ</div>';
    return;
  }
  box.innerHTML = chatsItems.map((c) => `
    <div class="chat-row${chatsOpenId === c.id ? ' on' : ''}" onclick="chatsOpen(${c.id})">
      <b>${escapeHtml(c.tutor.firstname + ' ' + c.tutor.surname)} ↔ ${escapeHtml(c.parent.firstname + ' ' + c.parent.surname)}</b>
      <small>Тәрбиеші ↔ ата-ана · ${c.messages_count} хабарлама</small>
      ${c.last_message
        ? `<div class="last">${escapeHtml(c.last_message.text)}</div>
           <small>${chatTime(c.last_message.created_at)}</small>`
        : '<div class="last">— әлі жазылмаған —</div>'}
    </div>`).join('');
}

async function chatsOpen(id) {
  chatsOpenId = id;
  chatsRenderList();
  const view = document.getElementById('chatsView');
  view.innerHTML = '<div class="dc-empty">Жүктелуде…</div>';
  try {
    const data = await api(`/api/chat/admin/conversations/${id}/messages?limit=100`);
    const { conversation: conv, messages } = data;
    const head = `<div class="chat-head">${escapeHtml(conv.tutor.firstname + ' ' + conv.tutor.surname)}
                  <span style="color:var(--muted);font-weight:600;"> ↔ </span>
                  ${escapeHtml(conv.parent.firstname + ' ' + conv.parent.surname)}</div>`;

    const body = messages.length
      ? messages.map((m) => {
          const isTutor = m.sender_role === 'tutor';
          const who = isTutor ? conv.tutor : conv.parent;
          return `<div class="msg-bubble ${isTutor ? 'msg-tutor' : 'msg-parent'}">
                    <div class="who">${escapeHtml(who.firstname)} · ${isTutor ? 'тәрбиеші' : 'ата-ана'}</div>
                    ${escapeHtml(m.text)}
                    <div class="tm">${chatTime(m.created_at)}</div>
                  </div>`;
        }).join('')
      : '<div class="dc-empty">Хабарламалар жоқ</div>';

    view.innerHTML = head + body;
    view.scrollTop = view.scrollHeight;
  } catch (e) {
    view.innerHTML = `<div class="dc-empty">Ошибка: ${escapeHtml(e.message)}</div>`;
  }
}
