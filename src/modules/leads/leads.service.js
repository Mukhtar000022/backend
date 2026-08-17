const repo = require('./leads.repo');

module.exports = {
  create: ({ type, name, phone, message }) =>
    repo.create({
      type: type || 'consultation',
      name,
      phone,
      message: message || '',
      status: 'new',
    }),

  list: () => repo.findMany(),

  update: (id, body) => {
    const data = {};
    if (typeof body.status === 'string') data.status = body.status;
    if (typeof body.name === 'string') data.name = body.name;
    if (typeof body.phone === 'string') data.phone = body.phone;
    if (typeof body.message === 'string') data.message = body.message;
    return repo.update(id, data);
  },

  remove: async (id) => {
    await repo.remove(id);
    return { ok: true };
  },
};
