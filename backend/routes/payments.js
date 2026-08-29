// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const router = require('express').Router();
const { mpesaCallback } = require('../controllers/paymentController');
const { webhookSignatureMiddleware } = require('../middleware/webhookSignature');

// Webhook signature verification (Stripe-style HMAC)
// Verifies the callback is authentic before processing
router.post('/mpesa/callback', webhookSignatureMiddleware, mpesaCallback);

module.exports = router;
