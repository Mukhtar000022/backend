const { prisma } = require('../../../db');

const include = { student: true };

module.exports = {
  findMany: (where = {}) => prisma.attendance.findMany({ where, include, orderBy: { id: 'asc' } }),
  findByLessonDate: (lessonId, date) =>
    prisma.attendance.findMany({ where: { lesson_id: Number(lessonId), date }, include, orderBy: { id: 'asc' } }),
  findById: (id) => prisma.attendance.findUnique({ where: { id: Number(id) }, include }),

  // Одна отметка на (урок, ученик, дата) — обновляем, если уже есть.
  upsert: ({ lesson_id, student_id, date, present, note }) =>
    prisma.attendance.upsert({
      where: { lesson_id_student_id_date: { lesson_id, student_id, date } },
      update: { present, note },
      create: { lesson_id, student_id, date, present, note },
      include,
    }),

  remove: (id) => prisma.attendance.delete({ where: { id: Number(id) } }),
};
