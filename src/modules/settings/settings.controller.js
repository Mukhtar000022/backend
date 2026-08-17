const service = require('./settings.service');

module.exports = {
  getSettings: async (req, res) => res.json(await service.getSettings()),

  updateSettings: async (req, res) => {
    const incoming = (req.body && req.body.payment) || {};
    const settings = await service.updateSettings(incoming);
    res.json({ ok: true, settings });
  },
};
