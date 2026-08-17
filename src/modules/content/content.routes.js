const express = require('express');
const wrap = require('../../lib/asyncHandler');
const { requireAdmin } = require('../../middleware/auth.middleware');
const c = require('./content.controller');

const router = express.Router();

router.get('/content', wrap(c.getContent));
router.post('/admin/logo', requireAdmin, wrap(c.uploadLogo));
router.delete('/admin/logo', requireAdmin, wrap(c.removeLogo));
router.put('/admin/content/:section', requireAdmin, wrap(c.updateSection));

module.exports = router;
