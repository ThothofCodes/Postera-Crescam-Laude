// Copyright (c) 2026 Thoth of Codes. USSD Fallback Layer — Africa's Talking
const CRMClient = require('../models/CRMClient');
const Invoice = require('../models/Invoice');
const Ticket = require('../models/Ticket');
const JobCard = require('../models/JobCard');
const { sendSMS } = require('../config/africastalking');
const { stkPush } = require('../middleware/mpesa');

// Simple in-memory session store (replace with Redis in production)
const sessions = {};
const SESSION_TTL = 180000; // 180 seconds
const getSession = (id) => sessions[id] || {};
const setSession = (id, data) => { sessions[id] = data; setTimeout(() => delete sessions[id], SESSION_TTL); };

// POST /api/ussd/callback — Africa's Talking USSD handler
exports.handle = async (req, res) => {
  const { sessionId, phoneNumber, text } = req.body;
  const input = (text || '').split('*');
  const level = input.filter(Boolean).length;
  const last = input[input.length - 1] || '';
  const session = getSession(sessionId);
  const phone = String(phoneNumber).replace(/\D/g, '').replace(/^0/, '254').replace(/^\+/, '');
  const respond = (txt, end = false) => {
    if (end) setSession(sessionId, {});
    else setSession(sessionId, { ...session, lastInput: last });
    res.set('Content-Type', 'text/plain');
    res.send((end ? 'END ' : 'CON ') + txt);
  };

  try {
    // Level 0 — Main menu
    if (!text || text === '') {
      return respond(
        'Welcome to Ruai Tech Solutions\n1. Internet Services\n2. Repair Status\n3. Pay Invoice\n4. PlayStation Booking\n5. Gov Services\n6. Support\n7. My Account\n0. Exit',
      );
    }

    const L1 = input[0];

    // ── 0 Exit ──
    if (L1 === '0') {
      try { await sendSMS(phone, 'Thank you for contacting Ruai Tech Solutions. Visit us at Ruai Town Centre!'); } catch (_) {}
      return respond('Thank you for using Ruai Tech Solutions. Goodbye!', true);
    }

    // ── 1 Internet Services ──
    if (L1 === '1') {
      if (level === 1) return respond('Internet Services\n1. Check data balance\n2. Buy top-up\n3. Report outage\n4. Contact support');
      if (last === '1') {
        const client = await CRMClient.findOne({ phone, departmentSlug: 'internet' });
        if (!client) return respond('Phone not found on our internet network.\nPlease visit Ruai Tech Solutions office.', true);
        return respond(`Your Balance:\nPackage: ${client.packageName || 'Standard'}\nStatus: Active\nBalance: ${client.loyaltyPoints} pts\n\nFor full details, visit our office.`, true);
      }
      if (last === '2') return respond('To buy a top-up, please M-Pesa Paybill 522522, Acc: RUAITECH, then text TOPUP to 0700000001.', true);
      if (last === '3') return respond('Outage reported. Our team will contact you within 1 hour.\nRef: OUT-' + Date.now().toString().slice(-6), true);
      if (last === '4') return respond('Internet Support: Call 0700000001 or visit Ruai Town Centre.', true);
    }

    // ── 2 Repair Status ──
    if (L1 === '2') {
      if (level === 1) return respond('Hardware Repair\nEnter your Job Card number (e.g. JC-001):');
      const jobNo = last.trim().toUpperCase();
      const job = await JobCard.findOne({ $or: [{ jobNumber: jobNo }, { clientPhone: phone }] }).sort('-createdAt');
      if (!job) return respond(`Job Card ${jobNo} not found.\nPlease check your receipt or visit our office.`, true);
      const STATUS_MAP = {
        received: 'Received - awaiting diagnosis',
        diagnosed: 'Diagnosed',
        parts_ordered: 'Parts ordered',
        in_repair: 'In Repair',
        quality_check: 'Quality Check',
        ready: 'READY FOR COLLECTION',
        collected: 'Collected',
      };
      const statusLabel = STATUS_MAP[job.status] || job.status;
      return respond(`Job Card: ${jobNo}\nDevice: ${job.deviceType}\nFault: ${job.faultDescription}\nStatus: ${statusLabel}\nEst. Cost: KES ${job.estimatedCost || 'TBD'}`, true);
    }

    // ── 3 Pay Invoice ──
    if (L1 === '3') {
      if (level === 1) return respond('Invoice Payment\nEnter Invoice ID (e.g. RTS-PS-2026-0001):');
      const invId = last.trim().toUpperCase();
      const invoice = await Invoice.findOne({ invoiceId: invId });
      if (!invoice) return respond(`Invoice ${invId} not found. Please check the invoice ID and try again.`, true);
      if (invoice.status === 'PAID') return respond(`Invoice ${invId} is already PAID.\nThank you!`, true);
      if (level === 2) return respond(`Invoice: ${invId}\nAmount: KES ${invoice.balance}\nSend M-Pesa STK to ${phone}?\n1. Yes, send STK push\n2. No, cancel`);
      if (last === '1') {
        try {
          await stkPush(phone, invoice.balance, invId, 'Ruai Tech Invoice');
          invoice.status = 'PAYMENT_SENT'; await invoice.save();
          return respond(`M-Pesa prompt sent to ${phone}.\nEnter your PIN to complete payment.\nRef: ${invId}`, true);
        } catch (_) { return respond('Payment initiation failed. Please try again or visit our office.', true); }
      }
      if (last === '2') return respond('Payment cancelled.', true);
    }

    // ── 4 PlayStation ──
    if (L1 === '4') {
      if (level === 1) return respond('PlayStation Arena\n1. Book a slot\n2. Check availability\n3. View my bookings');
      if (last === '2') return respond('Current availability:\nVisit /client/playstation or call 0700000002 to see live station map.', true);
      if (last === '1' || last === '3') return respond('To book a PlayStation slot, please visit:\nhttp://ruaitechsolutions.co.ke/client/playstation\nOr call 0700000002.', true);
    }

    // ── 5 Gov Services ──
    if (L1 === '5') {
      if (level === 1) return respond('Gov Admin Services\n1. Check document status\n2. Book appointment\n3. Fee inquiry');
      if (last === '1') {
        const doc = await require('../models/GovDocument').findOne({ clientPhone: phone }).sort('-createdAt');
        if (!doc) return respond('No document requests found for your number.\nVisit Ruai Tech Solutions to start your application.', true);
        return respond(`Document: ${doc.documentType}\nStatus: ${doc.status}\nUpdated: ${doc.updatedAt?.toDateString()}`, true);
      }
      if (last === '2') return respond('To book a Gov Admin appointment:\nCall 0700000006 or visit Ruai Town Centre.\nOpen: Mon-Sat 8AM-6PM', true);
      if (last === '3') return respond('Service fees vary by document type.\nVisit our office for a fee schedule.\nNo hidden charges — transparent pricing guaranteed.', true);
    }

    // ── 6 Support / Tickets ──
    if (L1 === '6') {
      if (level === 1) return respond('Support\n1. Raise a ticket\n2. Check ticket status\n3. Request callback');
      if (last === '2') {
        const ticket = await Ticket.findOne({ raisedByPhone: phone }).sort('-createdAt');
        if (!ticket) return respond('No tickets found for your number.', true);
        return respond(`Ticket: ${ticket.ticketId}\nTitle: ${ticket.title}\nStatus: ${ticket.status}\nPriority: ${ticket.priority}`, true);
      }
      if (last === '1') return respond('To raise a support ticket, please send an SMS to 0700000000\nwith the format: TICKET [your issue description]', true);
      if (last === '3') {
        try { await sendSMS(phone, 'Our team will call you back within 30 minutes. Thank you for your patience - Ruai Tech Solutions'); } catch (_) {}
        return respond('Callback request registered. We will call you within 30 minutes.', true);
      }
    }

    // ── 7 My Account ──
    if (L1 === '7') {
      if (level === 1) return respond('My Account\n1. Check loyalty points\n2. View outstanding balance\n3. Update phone (visit office)');
      const client = await CRMClient.findOne({ phone });
      if (!client) return respond('Account not found. Please register at our office or client portal.', true);
      if (last === '1') return respond(`Loyalty Points: ${client.loyaltyPoints} pts\n100 pts = KES 50 discount\n\nEarn more by paying invoices on time!`, true);
      if (last === '2') return respond(`Outstanding Balance: KES ${client.outstandingBalance || 0}\n\nTo pay, select option 3 from the main menu.`, true);
      if (last === '3') return respond('To update your phone number, please visit Ruai Tech Solutions office with your ID.', true);
    }

    // Default — unknown input
    respond('Invalid option. Please try again.\nDial *384*123# to start over.', true);
  } catch (err) {
    console.error('USSD error:', err.message);
    respond('Service temporarily unavailable. Please try again shortly.', true);
  }
};
