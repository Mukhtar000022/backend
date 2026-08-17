const express = require('express');
const wrap = require('../../lib/asyncHandler');
const { requireAdmin } = require('../../middleware/auth.middleware');
const c = require('./settings.controller');

const router = express.Router();

router.get('/settings', wrap(c.getSettings));
router.put('/admin/settings', requireAdmin, wrap(c.updateSettings));

module.exports = router;
