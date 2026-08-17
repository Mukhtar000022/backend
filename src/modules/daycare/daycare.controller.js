const service = require('./daycare.service');

module.exports = {
  // Всё для главного экрана одним запросом: ?date=YYYY-MM-DD&student_id=
  home: async (req, res) => res.json(await service.home(req.user, req.query.date, req.query.student_id)),

  // Күн тәртібі (?group_id= — для админ-панели, ?weekday=1..7 — день недели)
  getRoutine: async (req, res) =>
    res.json(await service.getRoutine(req.user, req.query.group_id, req.query.weekday)),
  saveRoutine: async (req, res) => {
    const body = req.body || {};
    // weekdays: [1,2,3…] — на какие дни сохранить набор; пусто = «күн сайын».
    res.json(await service.saveRoutine(req.user, body.items, body.group_id, body.weekdays));
  },

  // Ас мәзірі
  getMenu: async (req, res) => res.json(await service.getMenu(req.user, req.query.date, req.query.group_id)),
  saveMenu: async (req, res) => res.json(await service.saveMenu(req.user, req.body || {})),

  // Күнделікті есеп
  groupReports: async (req, res) => res.json(await service.getGroupReports(req.user, req.query.date)),
  getReport: async (req, res) => {
    const { student_id: studentId, date } = req.query;
    if (!studentId) return res.status(400).json({ error: 'student_id керек' });
    res.json(await service.getReport(req.user, studentId, date));
  },
  saveReport: async (req, res) => res.json(await service.saveReport(req.user, req.body || {})),

  // Суреттер
  getPhotos: async (req, res) => res.json(await service.getPhotos(req.user, req.query.date)),
  addPhoto: async (req, res) => res.status(201).json(await service.addPhoto(req.user, req.body || {})),
  removePhoto: async (req, res) => res.json(await service.removePhoto(req.user, req.params.id)),
};
