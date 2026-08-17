const repo = require('./lessons.repo');
const parentsService = require('../parents/parents.service');
const tutorsService = require('../tutors/tutors.service');
const scope = require('../../lib/scope');
const httpError = require('../../lib/httpError');

const STATUSES = ['planned', 'conducted', 'canceled'];

// Приводит поля к нужным типам.
function normalize(data) {
  const out = { ...data };
  if ('group_id' in out) out.group_id = Number(out.group_id);
  if ('tutor_id' in out) out.tutor_id = out.tutor_id == null || out.tutor_id === '' ? null : Number(out.tutor_id);
  if ('weekday' in out) out.weekday = Number(out.weekday);
  if ('order_no' in out) out.order_no = Number(out.order_no);
  if ('status' in out && !STATUSES.includes(out.status)) delete out.status;
  return out;
}

// Определяет группу текущего пользователя (для «своего» расписания).
async function groupIdOfUser(user) {
  if (!user || !user.sub) return null;
  if (user.role === 'tutor') {
    const t = await tutorsService.getByUserId(user.sub);
    return t ? t.group_id : null;
  }
  if (user.role === 'parent') {
    const p = await parentsService.getByUserId(user.sub);
    return p ? p.group_id : null;
  }
  return null;
}

module.exports = {
  STATUSES,

  // Список с учётом роли: воспитатель/родитель видят только свою группу.
  list: async (user, groupId) => {
    const where = await scope.groupWhere(user);
    if (groupId) {
      // Явный фильтр по группе разрешён только внутри своей области видимости.
      const gid = Number(groupId);
      if (where.group_id !== undefined && where.group_id !== gid) return [];
      if (where.id) return []; // область пуста (группа не назначена)
      return repo.findMany({ group_id: gid });
    }
    return repo.findMany(where);
  },

  getById: async (user, id) => {
    await scope.assertLessonAccess(user, id);
    return repo.findById(id);
  },

  // Расписание группы текущего пользователя (каждая группа — только своё).
  listForUser: async (user) => {
    if (user && user.admin) return repo.findMany({});
    const groupId = await groupIdOfUser(user);
    return groupId ? repo.findByGroup(groupId) : [];
  },

  // Воспитатель ведёт расписание только своей группы.
  create: async (user, data) => {
    const s = await scope.resolve(user);
    const body = normalize(data);
    if (s.kind !== 'admin') {
      if (!s.groupId) throw httpError(403, 'Сізге топ тағайындалмаған');
      body.group_id = s.groupId; // игнорируем чужой group_id из запроса
    }
    return repo.create(body);
  },

  update: async (user, id, data) => {
    await scope.assertLessonAccess(user, id);
    const s = await scope.resolve(user);
    const body = normalize(data);
    if (s.kind !== 'admin') delete body.group_id; // нельзя перенести урок в другую группу
    return repo.update(id, body);
  },

  remove: async (user, id) => {
    await scope.assertLessonAccess(user, id);
    await repo.remove(id);
    return { ok: true };
  },
};
