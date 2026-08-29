// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const router = require('express').Router();
const {
  getAllocations,
  allocateAdmin,
  updateAllocation,
  removeAllocation,
  getDepartmentAdmins,
  getAllAllocatedAdmins,
} = require('../controllers/departmentAdminController');
const { protect, superAdminGuard } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET — Get all allocations (super admin) or department admins (dept head)
router.get('/', superAdminGuard, getAllocations);

// GET — Get all allocated admins (super admin dashboard)
router.get('/all', superAdminGuard, getAllAllocatedAdmins);

// GET — Get admins for a specific department
router.get('/department/:slug', getDepartmentAdmins);

// POST — Allocate admin to department (super admin only)
router.post('/', superAdminGuard, allocateAdmin);

// PUT — Update allocation (super admin only)
router.put('/:id', superAdminGuard, updateAllocation);

// DELETE — Remove allocation (super admin only)
router.delete('/:id', superAdminGuard, removeAllocation);

module.exports = router;
