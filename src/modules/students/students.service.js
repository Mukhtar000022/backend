const repo = require('./students.repo');
const scope = require('../../lib/scope');

function normalize(data) {
  const out = { ...data };
  if ('parent_id' in out) out.parent_id = out.parent_id == null || out.parent_id === '' ? null : Number(out.parent_id);
  if ('group_id' in out) out.group_id = out.group_id == null || out.group_id === '' ? null : Number(out.group_id);
  return out;
}

module.exports = {
  // Родитель видит только своих детей, воспитатель — только свою группу.
  list: async (user) => repo.findMany(await scope.studentWhere(user)),

  // Доступ к конкретному ребёнку проверяется по роли.
  getById: async (user, id) => {
    await scope.assertStudentAccess(user, id, 'read');
    return repo.findById(id);
  },
  create: ({ firstname, surname, parent_id, group_id }) =>
    repo.create(normalize({ firstname, surname, parent_id, group_id })),
  update: (id, data) => repo.update(id, normalize(data)),
  remove: async (id) => {
    await repo.remove(id);
    return { ok: true };
  },
};
