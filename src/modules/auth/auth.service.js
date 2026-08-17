// Логика аутентификации: подпись/проверка токена (HMAC-SHA256) и вход.
const crypto = require('crypto');
const usersService = require('../users/users.service');

const SECRET = process.env.JWT_SECRET || 'ayala-dev-secret-change-me';
const TOKEN_TTL = 60 * 60 * 24 * 7; // 7 дней

function sign(payload, ttl = TOKEN_TTL) {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttl };
  const data = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verify(token) {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
  } catch (e) {
    return null;
  }
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

// Вход по телефону+паролю. role — необязательное ограничение ('tutor' | 'parent').
// Возвращает { token, user } или null.
async function login(phone_number, password, role) {
  const user = await usersService.verifyCredentials(phone_number, password);
  if (!user) return null;
  if (role && user.role !== role) return null; // выбранная на входе роль не совпала
  const token = sign({ sub: user.id, role: user.role, phone_number: user.phone_number });
  return { token, user };
}

module.exports = { sign, verify, login };
