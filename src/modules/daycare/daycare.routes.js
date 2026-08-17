const express = require('express');
const wrap = require('../../lib/asyncHandler');
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const c = require('./daycare.controller');

const router = express.Router();

// Заполняют только воспитатель и админ; область (своя группа) проверяется в сервисе.
const canEdit = [authenticate, requireRole('tutor', 'admin')];

// Главный экран (родитель и воспитатель — каждый видит своё).
router.get('/home', authenticate, wrap(c.home));

// Күн тәртібі
router.get('/routine', authenticate, wrap(c.getRoutine));
router.put('/routine', canEdit, wrap(c.saveRoutine));

// Ас мәзірі
router.get('/menu', authenticate, wrap(c.getMenu));
router.put('/menu', canEdit, wrap(c.saveMenu));

// Күнделікті есеп (көңіл-күй, ұйқы, тамақ)
router.get('/reports', canEdit, wrap(c.groupReports)); // вся группа за дату
router.get('/report', authenticate, wrap(c.getReport)); // один ребёнок (родителю — свой)
router.put('/report', canEdit, wrap(c.saveReport));

// Суреттер
router.get('/photos', authenticate, wrap(c.getPhotos));
router.post('/photos', canEdit, wrap(c.addPhoto));
router.delete('/photos/:id', canEdit, wrap(c.removePhoto));

module.exports = router;
