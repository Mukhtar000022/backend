const express = require('express');
const wrap = require('../../lib/asyncHandler');
const { authenticate, adminOnly } = require('../../middleware/auth.middleware');
const c = require('./tutors.controller');

const router = express.Router();

// Свой профиль (группа + её дети) — используется приложением воспитателя.
router.get('/me', authenticate, wrap(c.getMine)); // до '/:id'

// Список и управление воспитателями — только администратор.
router.get('/', adminOnly, wrap(c.list));
router.get('/:id', adminOnly, wrap(c.getById));
router.post('/', adminOnly, wrap(c.create));
router.put('/:id', adminOnly, wrap(c.update));
router.delete('/:id', adminOnly, wrap(c.remove));

module.exports = router;
