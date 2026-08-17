const service = require('./payments.service');

module.exports = {
  create: async (req, res) => {
    const { amount } = req.body || {};
    if (!amount || typeof amount !== 'string') {
      return res.status(400).json({ error: 'Не указана сумма' });
    }
    const payment = await service.create(req.body);
    res.status(201).json({ ok: true, payment });
  },

  list: async (req, res) => res.json(await service.list()),

  update: async (req, res) => {
    try {
      const payment = await service.update(req.params.id, req.body || {});
      res.json({ ok: true, payment });
    } catch (e) {
      res.status(404).json({ error: 'Платёж не найден' });
    }
  },

  remove: async (req, res) => {
    try {
      res.json(await service.remove(req.params.id));
    } catch (e) {
      res.status(404).json({ error: 'Платёж не найден' });
    }
  },
};
