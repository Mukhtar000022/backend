const { prisma } = require('../../../db');

const withMarks = { marks: true, tutor: true };

module.exports = {
  // Карта ребёнка в конкретной возрастной группе (с оценками).
  findCard: (studentId, ageGroup) =>
    prisma.devCard.findUnique({
      where: { student_id_age_group: { student_id: Number(studentId), age_group: ageGroup } },
      include: withMarks,
    }),

  // Все карты ребёнка (по всем группам).
  findCardsByStudent: (studentId) =>
    prisma.devCard.findMany({
      where: { student_id: Number(studentId) },
      include: withMarks,
      orderBy: { age_group: 'asc' },
    }),

  student: (studentId) =>
    prisma.student.findUnique({ where: { id: Number(studentId) }, include: { group: true, parent: true } }),

  // Создаёт/обновляет карту вместе с оценками в одной транзакции.
  // marks: [{ skill_no, level }]. Пустой level — оценка удаляется.
  saveCard: async ({ studentId, ageGroup, period, note, filledBy, marks }) => {
    return prisma.$transaction(async (tx) => {
      const card = await tx.devCard.upsert({
        where: { student_id_age_group: { student_id: Number(studentId), age_group: ageGroup } },
        update: { period, note, filled_by: filledBy },
        create: { student_id: Number(studentId), age_group: ageGroup, period, note, filled_by: filledBy },
      });

      for (const m of marks) {
        if (!m.level) {
          await tx.devMark.deleteMany({ where: { card_id: card.id, skill_no: m.skill_no } });
          continue;
        }
        await tx.devMark.upsert({
          where: { card_id_skill_no: { card_id: card.id, skill_no: m.skill_no } },
          update: { level: m.level },
          create: { card_id: card.id, skill_no: m.skill_no, level: m.level },
        });
      }

      return tx.devCard.findUnique({ where: { id: card.id }, include: withMarks });
    });
  },
};
