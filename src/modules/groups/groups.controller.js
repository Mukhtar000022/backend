const service = require('./groups.service');

module.exports = {
  list: async (req, res) => res.json(await service.list()),
  getById: async (req, res) => {
    const item = await service.getByIdScoped(req.user, req.params.id);
    if (!item) return res.status(404).json({ error: 'Группа не найдена' });
    res.json(item);
  },
  create: async (req, res) => {
    if (!req.body || !req.body.name) return res.status(400).json({ error: 'Укажите название группы' });
    res.status(201).json(await service.create(req.body));
  },
  update: async (req, res) => res.json(await service.update(req.params.id, req.body || {})),
  remove: async (req, res) => res.json(await service.remove(req.params.id)),
};
