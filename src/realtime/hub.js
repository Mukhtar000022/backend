// Реестр живых WebSocket-соединений: user_id → его сокеты
// (у одного пользователя может быть несколько устройств/вкладок).
//
// Отдельный модуль, чтобы и WebSocket-сервер, и REST-контроллеры могли
// разослать событие, не завися друг от друга.

const clients = new Map(); // userId(number) -> Set<WebSocket>

function add(userId, ws) {
  const id = Number(userId);
  if (!clients.has(id)) clients.set(id, new Set());
  clients.get(id).add(ws);
}

function remove(userId, ws) {
  const id = Number(userId);
  const set = clients.get(id);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) clients.delete(id);
}

function isOnline(userId) {
  return clients.has(Number(userId));
}

// Отправляет payload указанным пользователям. Дубликаты в списке игнорируются.
// exceptSocket — не слать обратно в сокет-отправитель (если он уже отрисовал).
function sendToUsers(userIds, payload, exceptSocket = null) {
  const data = JSON.stringify(payload);
  const seen = new Set();
  for (const raw of userIds) {
    const id = Number(raw);
    if (seen.has(id)) continue;
    seen.add(id);
    const set = clients.get(id);
    if (!set) continue;
    for (const ws of set) {
      if (ws === exceptSocket) continue;
      if (ws.readyState === 1) {
        // 1 = OPEN
        try {
          ws.send(data);
        } catch (e) {
          /* соединение отвалилось — уберётся в обработчике close */
        }
      }
    }
  }
}

module.exports = { add, remove, isOnline, sendToUsers, clients };
