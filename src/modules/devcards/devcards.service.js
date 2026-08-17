const repo = require('./devcards.repo');
const catalog = require('./devcards.catalog');
const scope = require('../../lib/scope');
const httpError = require('../../lib/httpError');

// Приводит карту из БД к виду для фронта: оценки как { [skill_no]: level }.
function shapeCard(card) {
  if (!card) return null;
  const marks = {};
  for (const m of card.marks) marks[m.skill_no] = m.level;
  return {
    id: card.id,
    student_id: card.student_id,
    age_group: card.age_group,
    period: card.period,
    note: card.note,
    filled_by: card.filled_by,
    tutor: card.tutor ? { id: card.tutor.id, firstname: card.tutor.firstname, surname: card.tutor.surname } : null,
    updated_at: card.updated_at,
    marks,
  };
}

module.exports = {
  // --- Справочник навыков ---
  levels: () => catalog.LEVELS,
  ageGroups: () => catalog.GROUP_KEYS.map((k) => ({ key: k, label: catalog.GROUPS[k].label })),
  catalogFor: (ageGroup) => catalog.catalogFor(ageGroup),

  // --- Просмотр (родитель — только своего ребёнка) ---
  // Возвращает карту(ы) ребёнка + справочник. Если age_group не задан —
  // отдаёт все карты ребёнка.
  view: async (user, studentId, ageGroup) => {
    // Родитель — только свои дети, воспитатель — только своя группа.
    await scope.assertStudentAccess(user, studentId, 'read');
    const student = await repo.student(studentId);
    if (!student) throw httpError(404, 'Бала табылмады');

    const result = {
      student: { id: student.id, firstname: student.firstname, surname: student.surname, group: student.group },
      levels: catalog.LEVELS,
      ageGroups: catalog.GROUP_KEYS.map((k) => ({ key: k, label: catalog.GROUPS[k].label })),
    };

    if (ageGroup) {
      if (!catalog.GROUPS[ageGroup]) throw httpError(400, 'Жас тобы қате: ' + ageGroup);
      result.catalog = catalog.catalogFor(ageGroup);
      result.card = shapeCard(await repo.findCard(studentId, ageGroup));
    } else {
      const cards = await repo.findCardsByStudent(studentId);
      result.cards = cards.map(shapeCard);
    }
    return result;
  },

  // --- Заполнение (только воспитатель/админ) ---
  save: async (user, studentId, body) => {
    const { age_group: ageGroup, period = '', note = '', marks = {} } = body || {};

    if (!catalog.GROUPS[ageGroup]) throw httpError(400, 'Жас тобын таңдаңыз (kishi | ortangy | eresek)');

    // Воспитатель заполняет карты только детей своей группы.
    const { scope: userScope } = await scope.assertStudentAccess(user, studentId, 'write');

    // Валидация оценок по каталогу выбранной группы.
    const allowedSkills = catalog.skillNumbers(ageGroup);
    const normalizedMarks = [];
    for (const [rawNo, level] of Object.entries(marks)) {
      const skillNo = Number(rawNo);
      if (!allowedSkills.has(skillNo)) throw httpError(400, `Дағды нөмірі қате: ${rawNo}`);
      if (level && !catalog.LEVEL_KEYS.includes(level)) throw httpError(400, `Деңгей қате: ${level}`);
      normalizedMarks.push({ skill_no: skillNo, level: level || '' });
    }

    // Кто заполнил: у воспитателя — его tutor.id (у админа остаётся null).
    const filledBy = userScope.kind === 'tutor' ? userScope.tutorId : null;

    const card = await repo.saveCard({
      studentId,
      ageGroup,
      period: String(period),
      note: String(note),
      filledBy,
      marks: normalizedMarks,
    });
    return shapeCard(card);
  },
};
