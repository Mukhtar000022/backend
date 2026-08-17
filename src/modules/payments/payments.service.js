const repo = require('./payments.repo');

const STATUSES = ['pending', 'paid', 'canceled'];

module.exports = {
  STATUSES,

  create: ({ amount, name, phone, method, note }) =>
    repo.create({
      amount: amount.trim(),
      name: typeof name === 'string' ? name.trim() : '',
      phone: typeof phone === 'string' ? phone.trim() : '',
      method: typeof method === 'string' && method.trim() ? method.trim() : 'kaspi',
      note: typeof note === 'string' ? note.trim() : '',
      status: 'pending',
    }),

  list: () => repo.findMany(),

  update: (id, body) => {
    const data = {};
    if (STATUSES.includes(body.status)) data.status = body.status;
    if (typeof body.note === 'string') data.note = body.note;
    return repo.update(id, data);
  },

  remove: async (id) => {
    await repo.remove(id);
    return { ok: true };
  },
};
