const repo = require('./attendance.repo');
const scope = require('../../lib/scope');

// "2026-11-10" -> Date (полночь UTC) или null.
function toDate(v) {
  if (!v) return null;
  const s = String(v).length === 10 ? String(v) + 'T00:00:00.000Z' : String(v);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

module.exports = {
  toDate,

  // Отметки по уроку на дату. Родитель видит только своих детей,
  // воспитатель — только свою группу (фильтр из lib/scope.js).
  listByLessonDate: async (user, lessonId, dateStr) => {
    const allowed = await scope.attendanceWhere(user);
    const date = toDate(dateStr);
    const where = { ...allowed };
    if (lessonId) where.lesson_id = Number(lessonId);
    if (date) where.date = date;
    return repo.findMany(where);
  },

  // Отметить одного ученика (доступ к ребёнку и уроку проверяется).
  mark: async (user, { lesson_id, student_id, date, present, note }) => {
    await scope.assertLessonAccess(user, lesson_id);
    await scope.assertStudentAccess(user, student_id, 'write');
    return repo.upsert({
      lesson_id: Number(lesson_id),
      student_id: Number(student_id),
      date: toDate(date),
      present: present !== false,
      note: typeof note === 'string' ? note : '',
    });
  },

  // Отметить сразу всю группу: records = [{ student_id, present, note }].
  markMany: async (user, { lesson_id, date, records }) => {
    await scope.assertLessonAccess(user, lesson_id);
    const d = toDate(date);
    const out = [];
    for (const r of Array.isArray(records) ? records : []) {
      await scope.assertStudentAccess(user, r.student_id, 'write');
      out.push(
        await repo.upsert({
          lesson_id: Number(lesson_id),
          student_id: Number(r.student_id),
          date: d,
          present: r.present !== false,
          note: typeof r.note === 'string' ? r.note : '',
        }),
      );
    }
    return out;
  },

  remove: async (user, id) => {
    const rec = await repo.findById(id);
    if (rec) await scope.assertStudentAccess(user, rec.student_id, 'write');
    await repo.remove(id);
    return { ok: true };
  },
};
