const express = require('express');
const wrap = require('../../lib/asyncHandler');
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const c = require('./attendance.controller');

const router = express.Router();

// Отмечать посещаемость могут воспитатель и админ.
const canEdit = [authenticate, requireRole('tutor', 'admin')];

router.get('/', authenticate, wrap(c.list));
router.post('/bulk', canEdit, wrap(c.markMany)); // до POST '/'
router.post('/', canEdit, wrap(c.mark));
router.delete('/:id', canEdit, wrap(c.remove));

module.exports = router;
