const express = require('express');
const wrap = require('../../lib/asyncHandler');
const { adminOnly } = require('../../middleware/auth.middleware');
const c = require('./users.controller');

const router = express.Router();

// Управление аккаунтами — только администратор.
router.get('/', adminOnly, wrap(c.list));
router.get('/:id', adminOnly, wrap(c.getById));
router.post('/', adminOnly, wrap(c.create));
router.put('/:id', adminOnly, wrap(c.update));
router.delete('/:id', adminOnly, wrap(c.remove));

module.exports = router;
