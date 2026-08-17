const service = require('./tutors.service');

module.exports = {
  list: async (req, res) => res.json(await service.list()),

  // Профиль текущего воспитателя (по токену): его группа и дети группы.
  getMine: async (req, res) => {
    if (!req.user || !req.user.sub) return res.status(400).json({ error: 'Нет данных пользователя' });
    const tutor = await service.getByUserId(req.user.sub);
    if (!tutor) return res.status(404).json({ error: 'Профиль воспитателя не найден' });
    res.json(tutor);
  },

  getById: async (req, res) => {
    const item = await service.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Воспитатель не найден' });
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
