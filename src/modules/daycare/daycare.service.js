// Жизнь группы: распорядок дня, меню, ежедневный отчёт и фото.
// Заполняет воспитатель своей группы. Родитель только смотрит и только
// то, что относится к его ребёнку (проверки — через lib/scope.js).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repo = require('./daycare.repo');
const scope = require('../../lib/scope');
const httpError = require('../../lib/httpError');

const MOODS = ['happy', 'calm', 'sad', 'sick'];
const UPLOAD_DIR = path.join(__dirname, '..', '..', '..', 'uploads');
const MAX_PHOTO_BYTES = 6 * 1024 * 1024; // 6 МБ на снимок

// «2026-08-03» → Date (полночь UTC). Без даты — сегодня.
function toDate(v) {
  const s = v ? String(v) : new Date().toISOString().slice(0, 10);
  const d = new Date(s.length === 10 ? s + 'T00:00:00.000Z' : s);
  if (isNaN(d.getTime())) throw httpError(400, 'Күні қате (YYYY-MM-DD форматы керек)');
  return d;
}

// Группа текущего пользователя: у воспитателя своя, у родителя — группа
// ребёнка. Админ работает с любой группой, но обязан указать её явно
// (?group_id=) — так админ-панель ведёт распорядок и меню любой группы.
async function myGroup(user, groupId) {
  const s = await scope.resolve(user);
  if (s.kind === 'admin') {
    if (!groupId) throw httpError(400, 'Топты таңдаңыз (group_id)');
    return { ...s, groupId: Number(groupId), tutorId: null };
  }
  if (!s.groupId) throw httpError(403, 'Сізге топ тағайындалмаған');
  return s;
}

// Күн тәртібі мен ас мәзірін тек әкімші толтырады. Тәрбиеші оларды
// қосымшада тек көреді (өзгерте алмайды).
function assertAdmin(s, what) {
  if (s.kind !== 'admin') throw httpError(403, `${what} тек әкімші толтырады`);
}

// Отчёт по ребёнку и фото по-прежнему заполняет воспитатель.
function assertCanEdit(s, what) {
  if (s.kind !== 'tutor' && s.kind !== 'admin') throw httpError(403, `${what} тәрбиеші толтырады`);
}

// «2026-08-10» → номер дня недели 1..7 (1 = понедельник).
function weekdayOf(date) {
  const js = date.getUTCDay(); // 0 = воскресенье
  return js === 0 ? 7 : js;
}

// Список дней, на которые сохраняем распорядок. Пусто — «күн сайын» (0).
function parseWeekdays(input) {
  if (!Array.isArray(input) || input.length === 0) return [0];
  const days = [...new Set(input.map(Number).filter((d) => d >= 1 && d <= 7))];
  return days.length ? days.sort((a, b) => a - b) : [0];
}

// Ребёнок родителя (первый, если их несколько — конкретный берём по student_id).
async function parentChild(user, studentId) {
  const s = await scope.resolve(user);
  if (s.kind !== 'parent') return null;
  if (studentId) {
    await scope.assertStudentAccess(user, studentId, 'read');
    return Number(studentId);
  }
  return s.studentIds[0] || null;
}

// Ас мәзірі — 5 тамақ: таңғы, екінші таңғы, түскі, бесін, кешкі ас.
const MEALS = ['breakfast', 'breakfast2', 'lunch', 'snack', 'dinner'];

function shapeMenu(row) {
  const out = {};
  for (const key of MEALS) out[key] = row ? row[key] || '' : '';
  return out;
}

function shapeReport(row) {
  if (!row) return null;
  return {
    student_id: row.student_id,
    date: row.date,
    mood: row.mood,
    sleep_minutes: row.sleep_minutes,
    meals_eaten: row.meals_eaten,
    meals_total: row.meals_total,
    note: row.note,
  };
}

module.exports = {
  MOODS,
  toDate,

  /* ------------------------- Күн тәртібі ------------------------- */
  // ?weekday=1..7 — распорядок конкретного дня (плюс пункты «күн сайын»).
  // Без weekday возвращаем весь набор — так админ-панель видит все дни.
  getRoutine: async (user, groupId, weekday) => {
    const s = await myGroup(user, groupId);
    return repo.routineOf(s.groupId, weekday ? Number(weekday) : null);
  },

  // Один набор пунктов сохраняется сразу на все отмеченные дни недели.
  saveRoutine: async (user, items, groupId, weekdays) => {
    const s = await myGroup(user, groupId);
    assertAdmin(s, 'Күн тәртібін');
    const days = parseWeekdays(weekdays);
    const clean = (Array.isArray(items) ? items : [])
      .filter((it) => it && String(it.title || '').trim())
      .map((it) => ({
        time: String(it.time || '').trim().slice(0, 10),
        title: String(it.title).trim().slice(0, 200),
        subtitle: String(it.subtitle || '').trim().slice(0, 200),
      }));
    // «Күн сайын» и конкретные дни вместе не уживаются: выбрав дни, очищаем
    // общий набор, иначе пункты задвоятся в приложении.
    const toClear = days.includes(0) ? [0, 1, 2, 3, 4, 5, 6, 7] : days.concat(0);
    await repo.replaceRoutine(s.groupId, clean, days, toClear);
    return repo.routineOf(s.groupId);
  },

  /* --------------------------- Ас мәзірі --------------------------- */
  getMenu: async (user, dateStr, groupId) => {
    const s = await myGroup(user, groupId);
    return shapeMenu(await repo.menuOf(s.groupId, toDate(dateStr)));
  },

  saveMenu: async (user, body) => {
    const s = await myGroup(user, body.group_id);
    assertAdmin(s, 'Ас мәзірін');
    const data = {};
    for (const key of MEALS) data[key] = String(body[key] || '').trim().slice(0, 300);
    return shapeMenu(await repo.upsertMenu(s.groupId, toDate(body.date), data));
  },

  /* ----------------------- Күнделікті есеп ----------------------- */
  // Отчёты всей группы за дату — экран воспитателя.
  getGroupReports: async (user, dateStr) => {
    const s = await myGroup(user);
    if (s.kind !== 'tutor') throw httpError(403, 'Тек тәрбиешіге қолжетімді');
    const date = toDate(dateStr);
    const [students, reports] = await Promise.all([
      repo.studentsOfGroup(s.groupId),
      repo.reportsOfGroup(s.groupId, date),
    ]);
    const byStudent = new Map(reports.map((r) => [r.student_id, r]));
    return students.map((st) => ({ student: st, report: shapeReport(byStudent.get(st.id)) }));
  },

  // Отчёт по одному ребёнку. Родитель — только по своему.
  getReport: async (user, studentId, dateStr) => {
    await scope.assertStudentAccess(user, studentId, 'read');
    return shapeReport(await repo.reportOf(studentId, toDate(dateStr)));
  },

  saveReport: async (user, body) => {
    const { student_id: studentId } = body || {};
    if (!studentId) throw httpError(400, 'Баланы таңдаңыз');
    const { scope: s } = await scope.assertStudentAccess(user, studentId, 'write');

    const mood = MOODS.includes(body.mood) ? body.mood : '';
    const data = {
      mood,
      sleep_minutes: Math.max(0, Math.min(720, Number(body.sleep_minutes) || 0)),
      meals_eaten: Math.max(0, Math.min(10, Number(body.meals_eaten) || 0)),
      meals_total: Math.max(1, Math.min(10, Number(body.meals_total) || MEALS.length)),
      note: String(body.note || '').trim().slice(0, 500),
      tutor_id: s.kind === 'tutor' ? s.tutorId : null,
    };
    return shapeReport(await repo.upsertReport(studentId, toDate(body.date), data));
  },

  /* ---------------------------- Суреттер ---------------------------- */
  getPhotos: async (user, dateStr) => {
    const s = await myGroup(user);
    return repo.photosOf(s.groupId, dateStr ? toDate(dateStr) : null);
  },

  // Фото приходит как base64 (data:image/jpeg;base64,...) — так обходимся
  // без multipart и лишних зависимостей. Файл кладём в backend/uploads.
  addPhoto: async (user, body) => {
    const s = await myGroup(user);
    if (s.kind !== 'tutor') throw httpError(403, 'Суретті тәрбиеші жүктейді');

    const raw = String((body && body.data) || '');
    const m = raw.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/);
    const base64 = m ? m[2] : raw;
    const ext = m ? (m[1] === 'jpeg' ? 'jpg' : m[1]) : 'jpg';
    if (!base64) throw httpError(400, 'Сурет жіберілмеді');

    const buf = Buffer.from(base64, 'base64');
    if (!buf.length) throw httpError(400, 'Сурет бүлінген');
    if (buf.length > MAX_PHOTO_BYTES) throw httpError(400, 'Сурет тым үлкен (6 МБ дейін)');

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);

    return repo.createPhoto({
      group_id: s.groupId,
      date: toDate(body.date),
      url: '/uploads/' + name,
      caption: String((body && body.caption) || '').trim().slice(0, 200),
      tutor_id: s.tutorId,
    });
  },

  removePhoto: async (user, id) => {
    const s = await myGroup(user);
    if (s.kind !== 'tutor') throw httpError(403, 'Суретті тәрбиеші өшіреді');
    const photo = await repo.photoById(id);
    if (!photo) throw httpError(404, 'Сурет табылмады');
    if (photo.group_id !== s.groupId) throw httpError(403, 'Бұл сурет сіздің тобыңыздікі емес');

    // Файл удаляем вместе с записью; если его уже нет — не страшно.
    try {
      fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(photo.url)));
    } catch (e) {
      /* файла нет — продолжаем */
    }
    await repo.removePhoto(id);
    return { ok: true };
  },

  /* ------------------- Главный экран одним запросом ------------------- */
  // Родителю: его ребёнок, отчёт за день, меню, фото, распорядок.
  // Воспитателю: группа, дети с отчётами, меню, фото, распорядок.
  home: async (user, dateStr, studentId) => {
    const s = await myGroup(user);
    const date = toDate(dateStr);
    const [group, routine, menuRow, photos, tutors] = await Promise.all([
      repo.groupById(s.groupId),
      // На главном экране показываем распорядок именно этого дня недели.
      repo.routineOf(s.groupId, weekdayOf(date)),
      repo.menuOf(s.groupId, date),
      repo.photosOf(s.groupId, date),
      repo.tutorsOfGroup(s.groupId),
    ]);

    const base = {
      role: s.kind,
      date: date.toISOString().slice(0, 10),
      group: group ? { id: group.id, name: group.name } : null,
      routine,
      menu: shapeMenu(menuRow),
      photos,
      tutors,
    };

    if (s.kind === 'parent') {
      const childId = await parentChild(user, studentId);
      if (!childId) return { ...base, child: null, report: null };
      const [child, report] = await Promise.all([
        repo.studentsOfGroup(s.groupId).then((list) => list.find((x) => x.id === childId) || null),
        repo.reportOf(childId, date),
      ]);
      return { ...base, child, report: shapeReport(report) };
    }

    const [students, reports] = await Promise.all([
      repo.studentsOfGroup(s.groupId),
      repo.reportsOfGroup(s.groupId, date),
    ]);
    const byStudent = new Map(reports.map((r) => [r.student_id, r]));
    return {
      ...base,
      students: students.map((st) => ({ ...st, report: shapeReport(byStudent.get(st.id)) })),
    };
  },
};
