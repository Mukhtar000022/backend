const express = require('express');
const wrap = require('../../lib/asyncHandler');
const { authenticate, requireAdmin } = require('../../middleware/auth.middleware');
const c = require('./chat.controller');

const router = express.Router();

// Админ-панель: просмотр переписки воспитателей с родителями (только чтение).
// Объявляем до '/conversations/:id', иначе 'admin' попадёт в :id.
router.get('/admin/conversations', requireAdmin, wrap(c.adminConversations));
router.get('/admin/conversations/:id/messages', requireAdmin, wrap(c.adminMessages));

// Чат доступен воспитателю и родителю; участие в диалоге проверяется в сервисе.
router.get('/conversations', authenticate, wrap(c.conversations));
router.get('/contacts', authenticate, wrap(c.contacts));
router.post('/conversations', authenticate, wrap(c.open));
router.get('/conversations/:id/messages', authenticate, wrap(c.messages));
router.post('/conversations/:id/messages', authenticate, wrap(c.send));
router.post('/conversations/:id/read', authenticate, wrap(c.read));

module.exports = router;
