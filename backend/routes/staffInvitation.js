// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const router = require('express').Router();
const ctrl = require('../controllers/staffInvitationController');
const { protect, deptHeadGuard } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Dept heads can invite staff to their own department
// Super admins can invite staff to any department
router.post('/', deptHeadGuard, ctrl.inviteStaff);

// Get pending invitations
// Dept heads can see invitations for their department
// Super admins can see all invitations
router.get('/pending', deptHeadGuard, ctrl.getPendingInvitations);

// Resend invitation
// Dept heads can resend invitations for their department
// Super admins can resend any invitation
router.post('/resend/:userId', deptHeadGuard, ctrl.resendInvitation);

// Cancel invitation
// Dept heads can cancel invitations for their department
// Super admins can cancel any invitation
router.delete('/cancel/:userId', deptHeadGuard, ctrl.cancelInvitation);

// Get staff directory
// Dept heads can see staff in their department
// Super admins can see all staff
router.get('/directory', deptHeadGuard, ctrl.getStaffDirectory);

module.exports = router;
