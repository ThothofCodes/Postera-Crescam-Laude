// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const router = require('express').Router();
const ctrl = require('../controllers/ticketController');
const { notifyCustomer } = require('../config/africastalking');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const {
  protect, staffGuard, deptHeadGuard, superAdminGuard,
} = require('../middleware/auth');

router.use(protect, staffGuard);

// NOTE: Public endpoints (e.g. /api/tickets/track) are registered
// separately (see publicTicketsTrack.js) so this router stays protected.
router.get('/', ctrl.getTickets);
router.post('/', ctrl.createTicket);
router.get('/my', ctrl.getMyTickets);
router.get('/escalated', superAdminGuard, ctrl.getEscalated);
router.get('/:id', ctrl.getTicket);
router.patch('/:id/assign', deptHeadGuard, ctrl.assignTicket);
router.post('/:id/reply', ctrl.replyTicket);
router.patch('/:id/status', staffGuard, ctrl.updateStatus);
router.post('/:id/escalate', staffGuard, ctrl.escalateTicket);
router.patch('/:id/resolve', deptHeadGuard, ctrl.updateStatus);
router.post('/:id/rate', ctrl.rateTicket);

// ── Send SMS/WhatsApp notification to ticket customer ──────────────
router.post('/:id/notify', async (req, res) => {
  try {
    const { message, channel } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Try to resolve customer phone from raisedBy user first
    let phone = null;
    let customerName = 'Customer';

    if (ticket.raisedBy) {
      const user = await User.findById(ticket.raisedBy).select('phone name');
      phone = user?.phone;
      customerName = user?.name || 'Customer';
    }

    // Fallback: for public tickets, parse phone from first thread entry (contact info)
    if (!phone && ticket.thread?.length) {
      const contactEntry = ticket.thread.find((t) => t.authorRole === 'CLIENT');
      if (contactEntry?.message) {
        const phoneMatch = contactEntry.message.match(/\+?\d{10,15}/);
        if (phoneMatch) phone = phoneMatch[0];
      }
    }

    if (!phone) return res.status(404).json({ message: 'Customer phone not found' });

    await notifyCustomer(phone, message, channel || 'sms');
    res.json({ success: true, message: `${(channel || 'sms').toUpperCase()} notification sent to ${customerName} (${phone})` });
  } catch (err) {
    console.error('Ticket notify error:', err.message);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

module.exports = router;
