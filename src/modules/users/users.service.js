// Бизнес-логика пользователей: хэширование пароля, скрытие пароля в ответах.
const repo = require('./users.repo');
const { hashPassword, verifyPassword } = require('../../lib/password');
const { normalizePhone } = require('../../lib/phone');
const httpError = require('../../lib/httpError');

const ROLES = ['admin', 'tutor', 'parent'];

function publicUser(u) {
  if (!u) return u;
  const { password, ...rest } = u;
  return rest;
}

async function list() {
  return (await repo.findMany()).map(publicUser);
}

async function getById(id) {
  return publicUser(await repo.findById(id));
}

async function create({ phone_number, password, role }) {
  const phone = normalizePhone(phone_number);
  if (!phone) throw httpError(400, 'Телефон нөмірі қате. Мысалы: +7(701) 234-56-78');
  const user = await repo.create({
    phone_number: phone,
    password: hashPassword(password),
    role: ROLES.includes(role) ? role : 'parent',
  });
  return publicUser(user);
}

async function update(id, data) {
  const patch = { ...data };
  if (patch.password) patch.password = hashPassword(patch.password);
  else delete patch.password;
  if (patch.role && !ROLES.includes(patch.role)) delete patch.role;
  if ('phone_number' in patch) {
    const phone = normalizePhone(patch.phone_number);
    if (!phone) throw httpError(400, 'Телефон нөмірі қате. Мысалы: +7(701) 234-56-78');
    patch.phone_number = phone;
  }
  return publicUser(await repo.update(id, patch));
}

async function remove(id) {
  await repo.remove(id);
  return { ok: true };
}

// Для авторизации: проверяет телефон+пароль, возвращает publicUser или null.
// Телефон нормализуем, чтобы найти запись независимо от формата ввода.
async function verifyCredentials(phone_number, password) {
  const phone = normalizePhone(phone_number) || phone_number;
  const user = await repo.findByPhone(phone);
  if (!user || !verifyPassword(password, user.password)) return null;
  return publicUser(user);
}

module.exports = { list, getById, create, update, remove, verifyCredentials, publicUser, ROLES };
