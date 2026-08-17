const express = require('express');
const wrap = require('../../lib/asyncHandler');
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const c = require('./devcards.controller');

const router = express.Router();

// Заполнять карту могут воспитатель и админ. Родитель — только просмотр.
const canEdit = [authenticate, requireRole('tutor', 'admin')];

// Справочные данные (доступны всем авторизованным).
router.get('/meta', authenticate, wrap(c.meta));
router.get('/catalog/:ageGroup', authenticate, wrap(c.catalog));

// Карта конкретного ребёнка.
router.get('/student/:studentId', authenticate, wrap(c.view)); // просмотр (родитель — свой ребёнок)
router.put('/student/:studentId', canEdit, wrap(c.save)); // заполнение (воспитатель/админ)

module.exports = router;
