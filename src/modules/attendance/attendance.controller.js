const service = require('./attendance.service');

module.exports = {
  // ?lesson_id=&date=YYYY-MM-DD — в пределах своей области видимости.
  list: async (req, res) => res.json(await service.listByLessonDate(req.user, req.query.lesson_id, req.query.date)),

  // Отметить одного ученика.
  mark: async (req, res) => {
    const { lesson_id, student_id, date } = req.body || {};
    if (!lesson_id || !student_id || !date) {
      return res.status(400).json({ error: 'Укажите lesson_id, student_id и date' });
    }
    if (!service.toDate(date)) return res.status(400).json({ error: 'Неверная дата (нужен формат YYYY-MM-DD)' });
    res.status(201).json(await service.mark(req.user, req.body));
  },

  // Отметить весь класс: { lesson_id, date, records: [{student_id, present}] }.
  markMany: async (req, res) => {
    const { lesson_id, date, records } = req.body || {};
    if (!lesson_id || !date || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Укажите lesson_id, date и массив records' });
    }
    if (!service.toDate(date)) return res.status(400).json({ error: 'Неверная дата (нужен формат YYYY-MM-DD)' });
    res.status(201).json({ ok: true, saved: await service.markMany(req.user, req.body) });
  },

  remove: async (req, res) => res.json(await service.remove(req.user, req.params.id)),
};
