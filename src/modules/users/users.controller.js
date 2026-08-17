// Контроллер: разбор запроса, вызов сервиса, формирование ответа.
const service = require('./users.service');

module.exports = {
  list: async (req, res) => res.json(await service.list()),

  getById: async (req, res) => {
    const user = await service.getById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  },

  create: async (req, res) => {
    const { phone_number, password } = req.body || {};
    if (!phone_number || !password) {
      return res.status(400).json({ error: 'Укажите телефон и пароль' });
    }
    res.status(201).json(await service.create(req.body));
  },

  update: async (req, res) => res.json(await service.update(req.params.id, req.body || {})),

  remove: async (req, res) => res.json(await service.remove(req.params.id)),
};
