// Middleware авторизации. Пропускает мастер-пароль (админ-панель) или валидный токен.
const authService = require('../modules/auth/auth.service');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ayala2026';

function getToken(req) {
  const h = req.headers['authorization'] || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

function authenticate(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Требуется авторизация' });
  if (token === ADMIN_PASSWORD) {
    req.user = { role: 'admin', admin: true };
    return next();
  }
  const payload = authService.verify(token);
  if (!payload) return res.status(401).json({ error: 'Неверный или просроченный токен' });
  req.user = payload;
  return next();
}

// Ограничение по ролям. Мастер-пароль (admin) проходит всегда.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Требуется авторизация' });
    if (req.user.admin || roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Недостаточно прав' });
  };
}

// Только мастер-пароль администратора (для админ-панели).
function requireAdmin(req, res, next) {
  const token = getToken(req);
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Неверный пароль или сессия истекла' });
  }
  req.user = { role: 'admin', admin: true };
  next();
}

const adminOnly = [authenticate, requireRole('admin')];

module.exports = { authenticate, requireRole, requireAdmin, adminOnly, ADMIN_PASSWORD };
