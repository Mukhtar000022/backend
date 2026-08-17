const { prisma } = require('../../../db');

module.exports = {
  // --- Күн тәртібі (распорядок дня группы) ---
  // weekday: 1..7 — конкретный день; пункты с weekday=0 действуют каждый день.
  // Без weekday возвращаем весь распорядок группы (нужно админ-панели).
  routineOf: (groupId, weekday) =>
    prisma.routineItem.findMany({
      where: {
        group_id: Number(groupId),
        ...(weekday ? { weekday: { in: [0, Number(weekday)] } } : {}),
      },
      orderBy: [{ weekday: 'asc' }, { order_no: 'asc' }, { time: 'asc' }],
    }),

  // Распорядок выбранных дней заменяем целиком — так проще держать порядок
  // пунктов. Дни, которые админ не отметил, остаются нетронутыми.
  // clearDays — что удалить перед записью (обычно выбранные дни + общий набор).
  replaceRoutine: (groupId, items, weekdays, clearDays) =>
    prisma.$transaction([
      prisma.routineItem.deleteMany({
        where: { group_id: Number(groupId), weekday: { in: clearDays || weekdays } },
      }),
      prisma.routineItem.createMany({
        // Один и тот же набор пунктов сохраняем для каждого выбранного дня.
        data: weekdays.flatMap((weekday) =>
          items.map((it, i) => ({
            group_id: Number(groupId),
            weekday,
            time: it.time,
            title: it.title,
            subtitle: it.subtitle || '',
            order_no: i,
          })),
        ),
      }),
    ]),

  // --- Ас мәзірі (меню на дату) ---
  menuOf: (groupId, date) =>
    prisma.menu.findUnique({ where: { group_id_date: { group_id: Number(groupId), date } } }),

  upsertMenu: (groupId, date, data) =>
    prisma.menu.upsert({
      where: { group_id_date: { group_id: Number(groupId), date } },
      update: data,
      create: { group_id: Number(groupId), date, ...data },
    }),

  // --- Күнделікті есеп (отчёт по ребёнку) ---
  reportOf: (studentId, date) =>
    prisma.dailyReport.findUnique({
      where: { student_id_date: { student_id: Number(studentId), date } },
    }),

  reportsOfGroup: (groupId, date) =>
    prisma.dailyReport.findMany({
      where: { date, student: { group_id: Number(groupId) } },
      include: { student: { select: { id: true, firstname: true, surname: true } } },
    }),

  upsertReport: (studentId, date, data) =>
    prisma.dailyReport.upsert({
      where: { student_id_date: { student_id: Number(studentId), date } },
      update: data,
      create: { student_id: Number(studentId), date, ...data },
    }),

  // --- Суреттер (фото группы) ---
  photosOf: (groupId, date) =>
    prisma.photo.findMany({
      where: { group_id: Number(groupId), ...(date ? { date } : {}) },
      orderBy: { id: 'desc' },
      take: 60,
    }),

  createPhoto: (data) => prisma.photo.create({ data }),
  photoById: (id) => prisma.photo.findUnique({ where: { id: Number(id) } }),
  removePhoto: (id) => prisma.photo.delete({ where: { id: Number(id) } }),

  // --- Вспомогательное ---
  studentsOfGroup: (groupId) =>
    prisma.student.findMany({
      where: { group_id: Number(groupId) },
      select: { id: true, firstname: true, surname: true },
      orderBy: { firstname: 'asc' },
    }),

  tutorsOfGroup: (groupId) =>
    prisma.tutor.findMany({
      where: { group_id: Number(groupId) },
      select: { id: true, firstname: true, surname: true },
    }),

  groupById: (groupId) => prisma.group.findUnique({ where: { id: Number(groupId) } }),
};
