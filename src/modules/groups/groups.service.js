const repo = require('./groups.repo');
const scope = require('../../lib/scope');
const httpError = require('../../lib/httpError');

module.exports = {
  list: () => repo.findMany(),

  // Свою группу (со списком детей) может открыть воспитатель этой группы —
  // это нужно приложению для отметки посещаемости. Чужую — только админ.
  getByIdScoped: async (user, id) => {
    const s = await scope.resolve(user);
    if (s.kind !== 'admin') {
      if (s.kind !== 'tutor') throw httpError(403, 'Недостаточно прав');
      if (!s.groupId || Number(id) !== s.groupId) throw httpError(403, 'Бұл сіздің тобыңыз емес');
    }
    return repo.findById(id);
  },

  getById: (id) => repo.findById(id),
  create: ({ name }) => repo.create({ name }),
  update: (id, data) => repo.update(id, data),
  remove: async (id) => {
    await repo.remove(id);
    return { ok: true };
  },
};
