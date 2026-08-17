// Сборка всех модульных роутеров под префиксом /api (см. server.js).
const express = require('express');
const { ADMIN_PASSWORD } = require('./middleware/auth.middleware');

const router = express.Router();

router.get('/health', (req, res) => res.json({ ok: true }));

// Вход в админ-панель по мастер-паролю (возвращает его же как токен).
router.post('/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) return res.json({ token: ADMIN_PASSWORD });
  res.status(401).json({ error: 'Неверный пароль' });
});

// Доменные модули с собственным префиксом.
router.use('/auth', require('./modules/auth/auth.routes'));
router.use('/users', require('./modules/users/users.routes'));
router.use('/groups', require('./modules/groups/groups.routes'));
router.use('/parents', require('./modules/parents/parents.routes'));
router.use('/students', require('./modules/students/students.routes'));
router.use('/tutors', require('./modules/tutors/tutors.routes'));
router.use('/lessons', require('./modules/lessons/lessons.routes'));
router.use('/attendance', require('./modules/attendance/attendance.routes'));
router.use('/devcards', require('./modules/devcards/devcards.routes'));
router.use('/chat', require('./modules/chat/chat.routes'));
router.use('/daycare', require('./modules/daycare/daycare.routes'));

// Модули со смешанными public/admin путями (монтируются в корень /api).
router.use(require('./modules/content/content.routes'));
router.use(require('./modules/settings/settings.routes'));
router.use(require('./modules/leads/leads.routes'));
router.use(require('./modules/payments/payments.routes'));

module.exports = router;
