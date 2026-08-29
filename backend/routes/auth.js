// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const router = require('express').Router();
const {
  login, register, getMe, verifyToken, setPassword, changeFirstPassword,
} = require('../controllers/authController');
const { protect, superAdminGuard } = require('../middleware/auth');

// Login — public (rate-limited in server.js)
router.post('/login', login);
router.post('/verify-token', verifyToken); // Added for staff invitation verification
router.post('/set-password', setPassword); // Added for staff invitation password setup

router.use(protect);

// Register — requires Super Admin auth
// This prevents open user registration. The first Super Admin is created via seed.js
router.post('/register', superAdminGuard, register);

// Forced password change (first login) — requires auth but works even when mustChangePassword is true
router.post('/change-first-password', changeFirstPassword);

// Get current user
router.get('/me', getMe);

module.exports = router;
