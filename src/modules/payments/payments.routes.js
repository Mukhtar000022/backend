const express = require('express');
const wrap = require('../../lib/asyncHandler');
const { requireAdmin } = require('../../middleware/auth.middleware');
const c = require('./payments.controller');

const router = express.Router();

router.post('/payments', wrap(c.create)); // фиксация платежа из приложения
router.get('/admin/payments', requireAdmin, wrap(c.list));
router.patch('/admin/payments/:id', requireAdmin, wrap(c.update));
router.delete('/admin/payments/:id', requireAdmin, wrap(c.remove));

module.exports = router;
