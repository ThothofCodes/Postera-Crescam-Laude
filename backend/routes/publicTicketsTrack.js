// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Phase 9 market research, Tier 1 #1 — public ticket status tracker + creation.
// Public: No auth. Customers can submit tickets and track them.
const router = require('express').Router();
const ctrl = require('../controllers/ticketController');

// Public ticket creation — customers submit without auth
router.post('/', ctrl.createPublicTicket);

// Public ticket tracking
router.post('/track', ctrl.trackTicket);

module.exports = router;
