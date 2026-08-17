// Область видимости данных для текущего пользователя.
//
//   админ        — все данные;
//   воспитатель  — только своя группа (её дети, уроки, посещаемость, карты);
//   родитель     — только свои дети.
//
// Работает напрямую с Prisma, чтобы не создавать циклических зависимостей
// между модулями. Используется в контроллерах перед выдачей данных.
const { prisma } = require('../../db');
const httpError = require('./httpError');

// Ничего не совпадёт — безопасный фильтр, когда доступных записей нет
// (например, у воспитателя ещё не назначена группа).
const NOTHING = { id: { in: [] } };

// Определяет роль и привязки текущего пользователя.
async function resolve(user) {
  if (!user) throw httpError(401, 'Требуется авторизация');

  // Мастер-пароль админ-панели или роль admin.
  if (user.admin || user.role === 'admin') return { kind: 'admin' };

  if (user.role === 'tutor') {
    const t = user.sub
      ? await prisma.tutor.findUnique({ where: { user_id: Number(user.sub) }, select: { id: true, group_id: true } })
      : null;
    return { kind: 'tutor', tutorId: t ? t.id : null, groupId: t ? t.group_id : null };
  }

  if (user.role === 'parent') {
    const p = user.sub
      ? await prisma.parent.findUnique({
          where: { user_id: Number(user.sub) },
          select: { id: true, group_id: true, students: { select: { id: true } } },
        })
      : null;
    return {
      kind: 'parent',
      parentId: p ? p.id : null,
      groupId: p ? p.group_id : null,
      studentIds: p ? p.students.map((s) => s.id) : [],
    };
  }

  throw httpError(403, 'Недостаточно прав');
}

// Prisma-фильтр по таблице students: какие дети видны пользователю.
async function studentWhere(user) {
  const s = await resolve(user);
  if (s.kind === 'admin') return {};
  if (s.kind === 'tutor') return s.groupId ? { group_id: s.groupId } : NOTHING;
  return s.studentIds.length ? { id: { in: s.studentIds } } : NOTHING;
}

// Prisma-фильтр по таблицам со связью group_id (уроки и т.п.).
async function groupWhere(user) {
  const s = await resolve(user);
  if (s.kind === 'admin') return {};
  return s.groupId ? { group_id: s.groupId } : NOTHING;
}

// Prisma-фильтр по таблице attendance (через связанного ребёнка).
async function attendanceWhere(user) {
  const s = await resolve(user);
  if (s.kind === 'admin') return {};
  if (s.kind === 'tutor') return s.groupId ? { student: { group_id: s.groupId } } : NOTHING;
  return s.studentIds.length ? { student_id: { in: s.studentIds } } : NOTHING;
}

// Проверяет доступ к конкретному ребёнку. Возвращает { student, scope }.
// mode = 'read' | 'write': родителю запись запрещена всегда.
async function assertStudentAccess(user, studentId, mode = 'read') {
  const s = await resolve(user);
  const student = await prisma.student.findUnique({
    where: { id: Number(studentId) },
    select: { id: true, firstname: true, surname: true, parent_id: true, group_id: true },
  });
  if (!student) throw httpError(404, 'Бала табылмады');

  if (s.kind === 'admin') return { student, scope: s };

  if (s.kind === 'tutor') {
    if (!s.groupId || student.group_id !== s.groupId) {
      throw httpError(403, 'Бұл бала сіздің тобыңызда емес');
    }
    return { student, scope: s };
  }

  // Родитель: только свои дети и только чтение.
  if (mode === 'write') throw httpError(403, 'Ата-анаға өзгертуге рұқсат жоқ');
  if (!s.parentId || student.parent_id !== s.parentId) {
    throw httpError(403, 'Бұл баланың деректерін көру рұқсаты жоқ');
  }
  return { student, scope: s };
}

// Проверяет, что урок относится к доступной пользователю группе.
async function assertLessonAccess(user, lessonId) {
  const s = await resolve(user);
  const lesson = await prisma.lesson.findUnique({
    where: { id: Number(lessonId) },
    select: { id: true, group_id: true },
  });
  if (!lesson) throw httpError(404, 'Сабақ табылмады');
  if (s.kind === 'admin') return { lesson, scope: s };
  if (!s.groupId || lesson.group_id !== s.groupId) {
    throw httpError(403, 'Бұл сабақ сіздің тобыңызға тиесілі емес');
  }
  return { lesson, scope: s };
}

module.exports = {
  resolve,
  studentWhere,
  groupWhere,
  attendanceWhere,
  assertStudentAccess,
  assertLessonAccess,
};
