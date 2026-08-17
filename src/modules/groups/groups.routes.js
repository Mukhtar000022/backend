const express = require('express');
const wrap = require('../../lib/asyncHandler');
const { authenticate, adminOnly } = require('../../middleware/auth.middleware');
const c = require('./groups.controller');

const router = express.Router();

// Список всех групп — только администратор.
router.get('/', adminOnly, wrap(c.list));

// Одну группу может открыть админ или воспитатель этой группы
// (приложению нужен состав группы для отметки посещаемости).
router.get('/:id', authenticate, wrap(c.getById));
router.post('/', adminOnly, wrap(c.create));
router.put('/:id', adminOnly, wrap(c.update));
router.delete('/:id', adminOnly, wrap(c.remove));

module.exports = router;
