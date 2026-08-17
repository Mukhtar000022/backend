const service = require('./auth.service');

module.exports = {
  login: async (req, res) => {
    const { phone_number, password, role } = req.body || {};
    if (!phone_number || !password) {
      return res.status(400).json({ error: 'Телефон мен құпиясөзді енгізіңіз' });
    }
    const result = await service.login(phone_number, password, role);
    if (!result) {
      return res.status(401).json({ error: 'Телефон, құпиясөз немесе рөл қате' });
    }
    res.json(result);
  },

  me: (req, res) => res.json({ user: req.user }),
};
