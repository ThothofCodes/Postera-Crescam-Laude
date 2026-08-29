// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const router = require('express').Router();
const {
  getDepartments, getDepartment, updateDepartment, setMonthlyTarget, seedDepartments,
  createDepartment, deleteDepartment, getAllDepartments, toggleDepartment,
} = require('../controllers/departmentController');
const { protect, superAdminGuard, deptHeadGuard } = require('../middleware/auth');

router.get('/', getDepartments);
router.get('/all', protect, superAdminGuard, getAllDepartments);
router.post('/', protect, superAdminGuard, createDepartment);
router.post('/seed', protect, superAdminGuard, seedDepartments);
router.get('/:slug', protect, getDepartment);
router.put('/:slug', protect, deptHeadGuard, updateDepartment);
router.put('/:slug/toggle', protect, superAdminGuard, toggleDepartment);
router.delete('/:slug', protect, superAdminGuard, deleteDepartment);
router.post('/:slug/target', protect, superAdminGuard, setMonthlyTarget);

module.exports = router;
