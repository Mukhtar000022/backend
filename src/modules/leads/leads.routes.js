const express = require('express');
const wrap = require('../../lib/asyncHandler');
const { requireAdmin } = require('../../middleware/auth.middleware');
const c = require('./leads.controller');

const router = express.Router();

router.post('/leads', wrap(c.create)); // публичная заявка из приложения
router.get('/admin/leads', requireAdmin, wrap(c.list));
router.patch('/admin/leads/:id', requireAdmin, wrap(c.update));
router.delete('/admin/leads/:id', requireAdmin, wrap(c.remove));

module.exports = router;
