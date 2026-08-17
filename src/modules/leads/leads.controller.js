const service = require('./leads.service');

module.exports = {
  create: async (req, res) => {
    const { name, phone } = req.body || {};
    if (!name || !phone) return res.status(400).json({ error: 'Укажите имя и телефон' });
    const lead = await service.create(req.body);
    res.status(201).json({ ok: true, lead });
  },

  list: async (req, res) => res.json(await service.list()),

  update: async (req, res) => {
    try {
      const lead = await service.update(req.params.id, req.body || {});
      res.json({ ok: true, lead });
    } catch (e) {
      res.status(404).json({ error: 'Заявка не найдена' });
    }
  },

  remove: async (req, res) => {
    try {
      res.json(await service.remove(req.params.id));
    } catch (e) {
      res.status(404).json({ error: 'Заявка не найдена' });
    }
  },
};
