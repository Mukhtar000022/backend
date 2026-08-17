const service = require('./chat.service');
const hub = require('../../realtime/hub');

module.exports = {
  // Список диалогов текущего пользователя (с непрочитанными).
  conversations: async (req, res) => res.json(await service.listConversations(req.user)),

  // С кем можно начать переписку (своя группа).
  contacts: async (req, res) => res.json(await service.listContacts(req.user)),

  // Открыть/создать диалог: { peer_id } — id родителя (для воспитателя) или воспитателя (для родителя).
  open: async (req, res) => {
    const { peer_id } = req.body || {};
    res.json(await service.openWith(req.user, peer_id));
  },

  // История сообщений: ?limit=50&before=<id>
  messages: async (req, res) => {
    const { limit, before } = req.query;
    res.json(await service.listMessages(req.user, req.params.id, { limit, before }));
  },

  // Отправка через REST (запасной путь, если WebSocket недоступен).
  // Доставку получателю всё равно делаем через WebSocket — чат остаётся realtime.
  send: async (req, res) => {
    const { message, recipients } = await service.send(req.user, req.params.id, (req.body || {}).text);
    hub.sendToUsers(recipients, {
      type: 'message',
      conversation_id: message.conversation_id,
      message,
    });
    res.status(201).json(message);
  },

  // --- Админ-панель: просмотр переписки (только чтение) ---
  adminConversations: async (req, res) =>
    res.json(await service.listAllConversations(req.query.group_id)),

  adminMessages: async (req, res) => {
    const { limit, before } = req.query;
    res.json(await service.listMessagesAsAdmin(req.params.id, { limit, before }));
  },

  // Пометить входящие прочитанными.
  read: async (req, res) => {
    const { count, readerUserId, peerUserId } = await service.markRead(req.user, req.params.id);
    hub.sendToUsers([peerUserId, readerUserId], {
      type: 'read',
      conversation_id: Number(req.params.id),
      by_user_id: readerUserId,
      count,
    });
    res.json({ ok: true, count });
  },
};
