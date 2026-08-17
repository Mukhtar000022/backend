const service = require('./students.service');

module.exports = {
  list: async (req, res) => res.json(await service.list(req.user)),
  getById: async (req, res) => {
    const item = await service.getById(req.user, req.params.id);
    if (!item) return res.status(404).json({ error: 'Ребёнок не найден' });
    res.json(item);
  },
  create: async (req, res) => {
    const { firstname, surname } = req.body || {};
    if (!firstname || !surname) {
      return res.status(400).json({ error: 'Укажите имя и фамилию' });
    }
    res.status(201).json(await service.create(req.body));
  },
  update: async (req, res) => res.json(await service.update(req.params.id, req.body || {})),
  remove: async (req, res) => res.json(await service.remove(req.params.id)),
};
