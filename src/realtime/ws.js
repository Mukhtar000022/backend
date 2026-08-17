// WebSocket-сервер realtime-чата. Подключается к тому же HTTP-серверу
// (см. server.js), путь /ws.
//
// Авторизация: токен передаётся в query — ws://host:4000/ws?token=... .
// Мобильные клиенты не умеют слать произвольные заголовки в WebSocket,
// поэтому именно query, а не Authorization.
//
// Протокол (JSON в обе стороны):
//   клиент → сервер: { type: 'send',   conversation_id, text }
//                    { type: 'read',   conversation_id }
//                    { type: 'typing', conversation_id, on }
//                    { type: 'ping' }
//   сервер → клиент: { type: 'ready',   user_id }
//                    { type: 'message', conversation_id, message }
//                    { type: 'read',    conversation_id, by_user_id, count }
//                    { type: 'typing',  conversation_id, user_id, on }
//                    { type: 'error',   error }
//                    { type: 'pong' }
const { WebSocketServer } = require('ws');
const authService = require('../modules/auth/auth.service');
const chatService = require('../modules/chat/chat.service');
const hub = require('./hub');

const HEARTBEAT_MS = 30000;

function tokenFromRequest(req) {
  try {
    const url = new URL(req.url, 'http://localhost');
    return url.searchParams.get('token') || '';
  } catch (e) {
    return '';
  }
}

function send(ws, payload) {
  if (ws.readyState === 1) ws.send(JSON.stringify(payload));
}

function attach(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const payload = authService.verify(tokenFromRequest(req));
    if (!payload || !payload.sub) {
      send(ws, { type: 'error', error: 'Требуется авторизация' });
      ws.close(4001, 'unauthorized');
      return;
    }

    const user = { sub: payload.sub, role: payload.role, phone_number: payload.phone_number };
    ws.userId = Number(payload.sub);
    ws.isAlive = true;
    hub.add(ws.userId, ws);
    send(ws, { type: 'ready', user_id: ws.userId });

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch (e) {
        return send(ws, { type: 'error', error: 'Некорректный формат' });
      }

      try {
        if (msg.type === 'ping') return send(ws, { type: 'pong' });

        if (msg.type === 'send') {
          const { message, recipients } = await chatService.send(user, msg.conversation_id, msg.text);
          // Отправителю тоже — чтобы сообщение появилось на всех его устройствах.
          hub.sendToUsers(recipients, {
            type: 'message',
            conversation_id: message.conversation_id,
            message,
          });
          return;
        }

        if (msg.type === 'read') {
          const { count, readerUserId, peerUserId } = await chatService.markRead(user, msg.conversation_id);
          hub.sendToUsers([peerUserId, readerUserId], {
            type: 'read',
            conversation_id: Number(msg.conversation_id),
            by_user_id: readerUserId,
            count,
          });
          return;
        }

        if (msg.type === 'typing') {
          // «Печатает…» — только собеседнику и без сохранения в БД.
          const { peerUserId } = await chatService.assertParticipant(user, msg.conversation_id);
          hub.sendToUsers([peerUserId], {
            type: 'typing',
            conversation_id: Number(msg.conversation_id),
            user_id: ws.userId,
            on: !!msg.on,
          });
          return;
        }

        send(ws, { type: 'error', error: 'Неизвестный тип: ' + msg.type });
      } catch (e) {
        send(ws, { type: 'error', error: e.message || 'Ошибка' });
      }
    });

    ws.on('close', () => hub.remove(ws.userId, ws));
    ws.on('error', () => hub.remove(ws.userId, ws));
  });

  // Пинг раз в 30 с — чтобы отваливались «мёртвые» соединения (мобильная сеть).
  const timer = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      try {
        ws.ping();
      } catch (e) {
        /* игнорируем */
      }
    });
  }, HEARTBEAT_MS);
  wss.on('close', () => clearInterval(timer));

  return wss;
}

module.exports = { attach };
