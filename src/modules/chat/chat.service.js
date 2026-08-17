// Логика чата «воспитатель ↔ родитель».
// Общаться могут только участники одной группы: воспитатель группы и родитель
// ребёнка из этой же группы. Доступ к диалогу — только его участникам.
const repo = require('./chat.repo');
const scope = require('../../lib/scope');
const httpError = require('../../lib/httpError');

const MAX_TEXT = 2000;

// Кто я в чате: { role, tutorId|parentId, groupId, userId }.
async function me(user) {
  const s = await scope.resolve(user);
  if (s.kind === 'tutor') {
    if (!s.tutorId) throw httpError(403, 'Тәрбиеші профилі толтырылмаған');
    return { role: 'tutor', tutorId: s.tutorId, groupId: s.groupId, userId: Number(user.sub) };
  }
  if (s.kind === 'parent') {
    if (!s.parentId) throw httpError(403, 'Ата-ана профилі толтырылмаған');
    return { role: 'parent', parentId: s.parentId, groupId: s.groupId, userId: Number(user.sub) };
  }
  // Мастер-пароль админ-панели не привязан к профилю — участником чата быть не может.
  throw httpError(403, 'Чат тек тәрбиеші мен ата-анаға арналған');
}

// Проверяет, что пользователь — участник диалога. Возвращает { conv, mine, peerUserId }.
async function assertParticipant(user, conversationId) {
  const mine = await me(user);
  const conv = await repo.findConversation(conversationId);
  if (!conv) throw httpError(404, 'Диалог табылмады');

  const isTutor = mine.role === 'tutor' && conv.tutor_id === mine.tutorId;
  const isParent = mine.role === 'parent' && conv.parent_id === mine.parentId;
  if (!isTutor && !isParent) throw httpError(403, 'Бұл диалогқа кіру рұқсаты жоқ');

  const peerUserId = isTutor ? conv.parent.user_id : conv.tutor.user_id;
  return { conv, mine, peerUserId };
}

// Приводит диалог к виду для приложения: собеседник + последнее сообщение + непрочитанные.
async function shapeConversation(conv, mine) {
  const peer = mine.role === 'tutor' ? conv.parent : conv.tutor;
  const [last, unread] = await Promise.all([
    repo.lastMessageOf(conv.id),
    repo.countUnread(conv.id, mine.userId),
  ]);
  return {
    id: conv.id,
    peer: {
      id: peer.id,
      user_id: peer.user_id,
      firstname: peer.firstname,
      surname: peer.surname,
      role: mine.role === 'tutor' ? 'parent' : 'tutor',
    },
    last_message: last
      ? { id: last.id, text: last.text, created_at: last.created_at, sender_user_id: last.sender_user_id }
      : null,
    unread,
    last_message_at: conv.last_message_at,
  };
}

module.exports = {
  me,
  assertParticipant,

  // Список диалогов текущего пользователя.
  listConversations: async (user) => {
    const mine = await me(user);
    const convs =
      mine.role === 'tutor' ? await repo.findByTutor(mine.tutorId) : await repo.findByParent(mine.parentId);
    return Promise.all(convs.map((c) => shapeConversation(c, mine)));
  },

  // Полный список собеседников: воспитателю — все родители его группы,
  // родителю — воспитатели его группы. Отдаём всех, даже если переписка уже
  // начата: приложение показывает единый список, из которого выбирают, кому писать.
  listContacts: async (user) => {
    const mine = await me(user);
    if (!mine.groupId) return [];
    const rows =
      mine.role === 'tutor' ? await repo.parentsOfGroup(mine.groupId) : await repo.tutorsOfGroup(mine.groupId);
    return rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      firstname: r.firstname,
      surname: r.surname,
      role: mine.role === 'tutor' ? 'parent' : 'tutor',
      // Чей это родитель — подпись в списке у воспитателя.
      children: (r.students || []).map((s) => `${s.firstname} ${s.surname}`),
    }));
  },

  // Открыть (или создать) диалог с собеседником из своей группы.
  openWith: async (user, peerId) => {
    const mine = await me(user);
    if (!peerId) throw httpError(400, 'Сұхбаттасты таңдаңыз');
    if (!mine.groupId) throw httpError(403, 'Сізге топ тағайындалмаған');

    // Собеседник обязан быть из той же группы.
    const allowed =
      mine.role === 'tutor'
        ? await repo.parentsOfGroup(mine.groupId)
        : await repo.tutorsOfGroup(mine.groupId);
    if (!allowed.some((r) => r.id === Number(peerId))) {
      throw httpError(403, 'Бұл адаммен жазысуға рұқсат жоқ');
    }

    const tutorId = mine.role === 'tutor' ? mine.tutorId : Number(peerId);
    const parentId = mine.role === 'parent' ? mine.parentId : Number(peerId);
    const conv = (await repo.findPair(tutorId, parentId)) || (await repo.createPair(tutorId, parentId));
    return shapeConversation(conv, mine);
  },

  // История сообщений (свежие первыми → отдаём в хронологическом порядке).
  listMessages: async (user, conversationId, opts) => {
    await assertParticipant(user, conversationId);
    const rows = await repo.findMessages(conversationId, opts);
    return rows.reverse();
  },

  // Отправка. Возвращает сообщение и кому его разослать по WebSocket.
  send: async (user, conversationId, rawText) => {
    const { mine, peerUserId } = await assertParticipant(user, conversationId);
    const text = String(rawText == null ? '' : rawText).trim();
    if (!text) throw httpError(400, 'Хабарлама бос');
    if (text.length > MAX_TEXT) throw httpError(400, `Хабарлама тым ұзын (${MAX_TEXT} таңбадан аспауы керек)`);

    const message = await repo.createMessage({
      conversationId,
      senderUserId: mine.userId,
      senderRole: mine.role,
      text,
    });
    return { message, recipients: [mine.userId, peerUserId] };
  },

  /* ---------------- Просмотр переписки администратором ----------------
   * Админ в чат не пишет — только читает, чтобы видеть общение
   * воспитателей с родителями. Доступ закрыт мастер-паролем панели. */

  // Все диалоги сада: кто с кем, сколько сообщений, последнее сообщение.
  listAllConversations: async (groupId) => {
    const convs = await repo.findAllConversations(groupId);
    return Promise.all(
      convs.map(async (c) => {
        const [last, total] = await Promise.all([repo.lastMessageOf(c.id), repo.countMessages(c.id)]);
        return {
          id: c.id,
          tutor: { id: c.tutor.id, firstname: c.tutor.firstname, surname: c.tutor.surname },
          parent: { id: c.parent.id, firstname: c.parent.firstname, surname: c.parent.surname },
          group_id: c.tutor.group_id || c.parent.group_id || null,
          messages_count: total,
          last_message: last ? { text: last.text, created_at: last.created_at, sender_role: last.sender_role } : null,
          last_message_at: c.last_message_at,
        };
      }),
    );
  },

  // История конкретного диалога для админа (в хронологическом порядке).
  listMessagesAsAdmin: async (conversationId, opts) => {
    const conv = await repo.findConversation(conversationId);
    if (!conv) throw httpError(404, 'Диалог табылмады');
    const rows = await repo.findMessages(conversationId, opts);
    return {
      conversation: {
        id: conv.id,
        tutor: { id: conv.tutor.id, firstname: conv.tutor.firstname, surname: conv.tutor.surname, user_id: conv.tutor.user_id },
        parent: { id: conv.parent.id, firstname: conv.parent.firstname, surname: conv.parent.surname, user_id: conv.parent.user_id },
      },
      messages: rows.reverse(),
    };
  },

  // Отметить входящие прочитанными; собеседнику уходит уведомление.
  markRead: async (user, conversationId) => {
    const { mine, peerUserId } = await assertParticipant(user, conversationId);
    const count = await repo.markRead(conversationId, mine.userId);
    return { count, readerUserId: mine.userId, peerUserId };
  },
};
