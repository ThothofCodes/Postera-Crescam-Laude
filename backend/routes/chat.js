// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const express = require('express');

const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/callback', chatController.createCallbackRequest);

// Public endpoint(s) removed: presence is delivered via Socket.IO events only.

// Protected routes for admins
router.use(protect); // This ensures user is authenticated

// Admin routes for chat
router.get('/conversations', chatController.getAllConversations);
router.get('/conversation/:conversationId', chatController.getConversation);
router.patch('/conversation/:conversationId/read', chatController.markAsRead);

// Admin routes for callbacks
router.get('/callbacks', chatController.getCallbackRequests);
router.patch('/callbacks/:id', chatController.updateCallbackRequest);

// Admin status routes
router.get('/admin/status', chatController.getAdminStatus);
router.patch('/admin/status', chatController.updateAdminStatus);

module.exports = router;
