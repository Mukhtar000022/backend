const repo = require('./parents.repo');

// Приводит внешние ключи к числу или null.
function normalize(data) {
  const out = { ...data };
  if ('user_id' in out) out.user_id = Number(out.user_id);
  if ('group_id' in out) out.group_id = out.group_id == null || out.group_id === '' ? null : Number(out.group_id);
  return out;
}

module.exports = {
  list: () => repo.findMany(),
  getById: (id) => repo.findById(id),
  getByUserId: (userId) => repo.findByUserId(userId),
  create: ({ firstname, surname, user_id, group_id }) =>
    repo.create(normalize({ firstname, surname, user_id, group_id })),
  update: (id, data) => repo.update(id, normalize(data)),
  remove: async (id) => {
    await repo.remove(id);
    return { ok: true };
  },
};
