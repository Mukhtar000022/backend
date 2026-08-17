const express = require('express');
const wrap = require('../../lib/asyncHandler');
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const c = require('./lessons.controller');

const router = express.Router();

// Управлять расписанием могут воспитатель и админ.
const canEdit = [authenticate, requireRole('tutor', 'admin')];

router.get('/', authenticate, wrap(c.list));
router.get('/my', authenticate, wrap(c.my)); // расписание своей группы
router.get('/:id', authenticate, wrap(c.getById));
router.post('/', canEdit, wrap(c.create));
router.put('/:id', canEdit, wrap(c.update));
router.delete('/:id', canEdit, wrap(c.remove));

module.exports = router;
