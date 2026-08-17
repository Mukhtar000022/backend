const express = require('express');
const wrap = require('../../lib/asyncHandler');
const { authenticate, adminOnly } = require('../../middleware/auth.middleware');
const c = require('./students.controller');

const router = express.Router();

// Список и просмотр — с фильтром по роли (см. lib/scope.js):
// родитель видит только своих детей, воспитатель — только свою группу.
router.get('/', authenticate, wrap(c.list));
router.get('/:id', authenticate, wrap(c.getById));

// Создание/изменение/удаление детей — только администратор.
router.post('/', adminOnly, wrap(c.create));
router.put('/:id', adminOnly, wrap(c.update));
router.delete('/:id', adminOnly, wrap(c.remove));

module.exports = router;
