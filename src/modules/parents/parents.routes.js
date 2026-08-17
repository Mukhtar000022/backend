const express = require('express');
const wrap = require('../../lib/asyncHandler');
const { authenticate, adminOnly } = require('../../middleware/auth.middleware');
const c = require('./parents.controller');

const router = express.Router();

// Свой профиль (с детьми) доступен самому родителю — используется приложением.
router.get('/me', authenticate, wrap(c.getMine)); // до '/:id', иначе 'me' примут за id

// Чужие профили родителей — только администратор.
router.get('/', adminOnly, wrap(c.list));
router.get('/:id', adminOnly, wrap(c.getById));
router.post('/', adminOnly, wrap(c.create));
router.put('/:id', adminOnly, wrap(c.update));
router.delete('/:id', adminOnly, wrap(c.remove));

module.exports = router;
