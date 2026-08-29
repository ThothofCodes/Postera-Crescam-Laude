// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const router = require('express').Router();
const ctrl = require('../controllers/billingController');
const {
  protect, staffGuard, deptHeadGuard, superAdminGuard,
} = require('../middleware/auth');
const { webhookSignatureMiddleware } = require('../middleware/webhookSignature');

// M-Pesa callback — no auth, but with webhook signature verification
router.post('/mpesa-callback', webhookSignatureMiddleware, ctrl.mpesaCallback);

router.use(protect);

router.get('/', staffGuard, ctrl.getInvoices);
router.post('/', deptHeadGuard, ctrl.createInvoice);
router.get('/my', staffGuard, ctrl.getMyInvoices);
router.get('/overdue', deptHeadGuard, ctrl.getOverdue);
router.get('/consolidated', superAdminGuard, ctrl.getInvoices);
router.get('/:id', staffGuard, ctrl.getInvoice);
router.patch('/:id/send', deptHeadGuard, ctrl.sendInvoice);
router.post('/:id/pay', deptHeadGuard, ctrl.initiatePayment);
router.patch('/:id/cancel', deptHeadGuard, ctrl.cancelInvoice);

module.exports = router;
