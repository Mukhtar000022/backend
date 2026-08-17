const { prisma } = require('../../../db');

// Собеседники нужны в каждом ответе, чтобы приложение показывало имя и роль.
const withPeers = {
  tutor: { select: { id: true, firstname: true, surname: true, user_id: true, group_id: true } },
  parent: { select: { id: true, firstname: true, surname: true, user_id: true, group_id: true } },
};

module.exports = {
  findConversation: (id) =>
    prisma.conversation.findUnique({ where: { id: Number(id) }, include: withPeers }),

  findPair: (tutorId, parentId) =>
    prisma.conversation.findUnique({
      where: { tutor_id_parent_id: { tutor_id: Number(tutorId), parent_id: Number(parentId) } },
      include: withPeers,
    }),

  createPair: (tutorId, parentId) =>
    prisma.conversation.create({
      data: { tutor_id: Number(tutorId), parent_id: Number(parentId) },
      include: withPeers,
    }),

  // Диалоги воспитателя / родителя, свежие сверху.
  findByTutor: (tutorId) =>
    prisma.conversation.findMany({
      where: { tutor_id: Number(tutorId) },
      include: withPeers,
      orderBy: { last_message_at: 'desc' },
    }),

  findByParent: (parentId) =>
    prisma.conversation.findMany({
      where: { parent_id: Number(parentId) },
      include: withPeers,
      orderBy: { last_message_at: 'desc' },
    }),

  // История: последние сообщения (before — для подгрузки вверх).
  findMessages: (conversationId, { limit = 50, before } = {}) =>
    prisma.message.findMany({
      where: {
        conversation_id: Number(conversationId),
        ...(before ? { id: { lt: Number(before) } } : {}),
      },
      orderBy: { id: 'desc' },
      take: Math.min(Number(limit) || 50, 100),
    }),

  lastMessageOf: (conversationId) =>
    prisma.message.findFirst({
      where: { conversation_id: Number(conversationId) },
      orderBy: { id: 'desc' },
    }),

  // Непрочитанные для пользователя — те, что писал не он.
  countUnread: (conversationId, userId) =>
    prisma.message.count({
      where: {
        conversation_id: Number(conversationId),
        sender_user_id: { not: Number(userId) },
        read_at: null,
      },
    }),

  // Создаём сообщение и двигаем диалог наверх списка.
  createMessage: async ({ conversationId, senderUserId, senderRole, text }) => {
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversation_id: Number(conversationId),
          sender_user_id: Number(senderUserId),
          sender_role: senderRole,
          text,
        },
      }),
      prisma.conversation.update({
        where: { id: Number(conversationId) },
        data: { last_message_at: new Date() },
      }),
    ]);
    return message;
  },

  // Отмечает прочитанными чужие сообщения диалога. Возвращает число обновлённых.
  markRead: async (conversationId, userId) => {
    const res = await prisma.message.updateMany({
      where: {
        conversation_id: Number(conversationId),
        sender_user_id: { not: Number(userId) },
        read_at: null,
      },
      data: { read_at: new Date() },
    });
    return res.count;
  },

  // Все родители группы — полный список «кому написать» у воспитателя.
  // Родитель попадает в список, если он привязан к группе ИЛИ его ребёнок
  // числится в этой группе (у части родителей group_id может быть не заполнен).
  parentsOfGroup: (groupId) =>
    prisma.parent.findMany({
      where: {
        OR: [
          { group_id: Number(groupId) },
          { students: { some: { group_id: Number(groupId) } } },
        ],
      },
      select: {
        id: true,
        firstname: true,
        surname: true,
        user_id: true,
        // Дети именно этой группы — воспитателю удобно видеть, чей это родитель.
        students: {
          where: { group_id: Number(groupId) },
          select: { firstname: true, surname: true },
          orderBy: { firstname: 'asc' },
        },
      },
      orderBy: [{ surname: 'asc' }, { firstname: 'asc' }],
    }),

  // --- Просмотр переписки администратором (только чтение) ---
  // Все диалоги сада, свежие сверху; ?group_id= — фильтр по группе.
  findAllConversations: (groupId) =>
    prisma.conversation.findMany({
      where: groupId
        ? { OR: [{ tutor: { group_id: Number(groupId) } }, { parent: { group_id: Number(groupId) } }] }
        : {},
      include: withPeers,
      orderBy: { last_message_at: 'desc' },
      take: 200,
    }),

  countMessages: (conversationId) =>
    prisma.message.count({ where: { conversation_id: Number(conversationId) } }),

  // Воспитатели группы (для родителя).
  tutorsOfGroup: (groupId) =>
    prisma.tutor.findMany({
      where: { group_id: Number(groupId) },
      select: { id: true, firstname: true, surname: true, user_id: true },
      orderBy: { firstname: 'asc' },
    }),
};
