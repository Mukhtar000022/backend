const service = require('./lessons.service');

const REQUIRED = ['group_id', 'subject', 'weekday', 'order_no', 'start_time', 'end_time'];

module.exports = {
  // Список в пределах своей области видимости; ?group_id=X — уточнение.
  list: async (req, res) => res.json(await service.list(req.user, req.query.group_id)),

  // Расписание группы текущего пользователя.
  my: async (req, res) => res.json(await service.listForUser(req.user)),

  getById: async (req, res) => {
    const item = await service.getById(req.user, req.params.id);
    if (!item) return res.status(404).json({ error: 'Урок не найден' });
    res.json(item);
  },

  create: async (req, res) => {
    const body = req.body || {};
    // Воспитателю group_id указывать не нужно — подставляется его группа.
    const isAdmin = req.user && (req.user.admin || req.user.role === 'admin');
    for (const f of REQUIRED) {
      if (f === 'group_id' && !isAdmin) continue;
      if (body[f] === undefined || body[f] === '') {
        return res.status(400).json({ error: 'Заполните поле: ' + f });
      }
    }
    res.status(201).json(await service.create(req.user, body));
  },

  update: async (req, res) => res.json(await service.update(req.user, req.params.id, req.body || {})),

  remove: async (req, res) => res.json(await service.remove(req.user, req.params.id)),
};
