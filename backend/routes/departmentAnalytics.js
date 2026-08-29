// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Department Analytics Routes
const router = require('express').Router();
const { getDepartmentAnalytics, getDepartmentTimeline } = require('../controllers/departmentAnalyticsController');
const { protect, superAdminGuard } = require('../middleware/auth');

router.get('/', protect, superAdminGuard, getDepartmentAnalytics);
router.get('/:slug/timeline', protect, superAdminGuard, getDepartmentTimeline);

module.exports = router;
