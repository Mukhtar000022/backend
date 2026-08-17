const service = require('./parents.service');

module.exports = {
  list: async (req, res) => res.json(await service.list()),

  // Профиль текущего родителя (по токену): его дети и группа.
  getMine: async (req, res) => {
    if (!req.user || !req.user.sub) return res.status(400).json({ error: 'Нет данных пользователя' });
    const parent = await service.getByUserId(req.user.sub);
    if (!parent) return res.status(404).json({ error: 'Профиль родителя не найден' });
    res.json(parent);
  },

  getById: async (req, res) => {
    const item = await service.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Родитель не найден' });
    res.json(item);
  },
  create: async (req, res) => {
    const { firstname, surname, user_id } = req.body || {};
    if (!firstname || !surname || !user_id) {
      return res.status(400).json({ error: 'Укажите имя, фамилию и аккаунт (user_id)' });
    }
    res.status(201).json(await service.create(req.body));
  },
  update: async (req, res) => res.json(await service.update(req.params.id, req.body || {})),
  remove: async (req, res) => res.json(await service.remove(req.params.id)),
};
