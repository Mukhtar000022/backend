const express = require('express');
const wrap = require('../../lib/asyncHandler');
const { authenticate } = require('../../middleware/auth.middleware');
const controller = require('./auth.controller');

const router = express.Router();

// Регистрация только через админа (см. модуль users). Публичного /register нет.
router.post('/login', wrap(controller.login));
router.get('/me', authenticate, controller.me);

module.exports = router;
