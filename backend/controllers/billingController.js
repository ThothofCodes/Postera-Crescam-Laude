const mongoose = require('mongoose');
const generateReceipt = require('../utils/generateReceipt');
const { emitPaymentResult } = require('../socket');
// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const Invoice = require('../models/Invoice');
const CRMClient = require('../models/CRMClient');
const { stkPush, isCallbackProcessed, markCallbackProcessed } = require('../middleware/mpesa');
const { sendSMS } = require('../config/africastalking');
const DeptTransaction = require('../models/DeptTransaction');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const safePage = (p) => Math.max(1, Math.min(Number(p) || 1, 1000));
const safeLimit = (l) => Math.max(1, Math.min(Number(l) || 20, 100));

exports.createInvoice = async (req, res, next) => {
  try {
    const {
      clientId, lineItems, dueDate, notes, taxRate,
    } = req.body;
    if (!isValidId(clientId)) return res.status(400).json({ message: 'Invalid client ID' });
    if (!lineItems?.length) return res.status(400).json({ message: 'At least one line item required' });
    if (!dueDate) return res.status(400).json({ message: 'Due date required' });

    const items = lineItems.map((i) => ({
      description: String(i.description).slice(0, 200),
      qty: Math.max(1, Number(i.qty)),
      unitPrice: Math.max(0, Number(i.unitPrice)),
      total: Math.max(1, Number(i.qty)) * Math.max(0, Number(i.unitPrice)),
    }));
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const rate = Number(taxRate) || 0.16;
    const taxAmount = Math.round(subtotal * rate * 100) / 100;
    const total = subtotal + taxAmount;

    const invoice = await Invoice.create({
      department: req.user.department?._id || req.user.department,
      departmentSlug: req.user.departmentSlug,
      client: clientId,
      lineItems: items,
      subtotal,
      taxRate: rate,
      taxAmount,
      totalAmount: total,
      balance: total,
      dueDate: new Date(dueDate),
      notes: notes?.slice(0, 500),
      createdBy: req.user._id,
    });
    res.status(201).json(invoice);
  } catch (err) { next(err); }
};

exports.getInvoices = async (req, res, next) => {
  try {
    const page = safePage(req.query.page); const
      limit = safeLimit(req.query.limit);
    const filter = req.user.role === 'SUPER_ADMIN' ? {} : { departmentSlug: req.user.departmentSlug };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.clientId && isValidId(req.query.clientId)) filter.client = req.query.clientId;
    const [invoices, total] = await Promise.all([
      Invoice.find(filter).populate('client', 'fullName phone').sort('-createdAt').skip((page - 1) * limit)
        .limit(limit),
      Invoice.countDocuments(filter),
    ]);
    res.json({ invoices, total, page });
  } catch (err) { next(err); }
};

exports.getInvoice = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const invoice = await Invoice.findById(req.params.id).populate('client', 'fullName phone email');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) { next(err); }
};

exports.sendInvoice = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const invoice = await Invoice.findById(req.params.id).populate('client', 'fullName phone');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status !== 'DRAFT') return res.status(400).json({ message: 'Only DRAFT invoices can be sent' });
    invoice.status = 'SENT';
    await invoice.save();
    sendSMS(invoice.client.phone, `Invoice ${invoice.invoiceId} from Ruai Tech Solutions: KES ${invoice.totalAmount}. Due: ${invoice.dueDate.toDateString()}. Pay via M-Pesa or visit our portal.`);
    res.json(invoice);
  } catch (err) { next(err); }
};

exports.initiatePayment = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const invoice = await Invoice.findById(req.params.id).populate('client', 'fullName phone');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (['PAID', 'CANCELLED'].includes(invoice.status)) return res.status(400).json({ message: `Invoice is already ${invoice.status}` });
    const mpesaRes = await stkPush(invoice.client.phone, invoice.balance, invoice.invoiceId, 'Ruai Tech Invoice');
    invoice.checkoutRequestId = mpesaRes.CheckoutRequestID;
    invoice.status = 'PAYMENT_SENT';
    await invoice.save();
    res.json({ message: 'STK push sent', checkoutRequestId: mpesaRes.CheckoutRequestID });
  } catch (err) { next(err); }
};

exports.mpesaCallback = async (req, res) => {
  try { res.json({ ResultCode: 0, ResultDesc: 'Success' }); } catch (_) {}
  try {
    const result = req.body?.Body?.stkCallback;
    if (!result || result.ResultCode !== 0) return;
    const { CheckoutRequestID, CallbackMetadata } = result;

    // Replay protection
    if (isCallbackProcessed(CheckoutRequestID)) {
      console.warn(`[MPESA-BILLING] Callback replay blocked: ${CheckoutRequestID}`);
      return;
    }
    markCallbackProcessed(CheckoutRequestID);
    console.log(`[MPESA-BILLING] Callback received: ${CheckoutRequestID} code=${result.ResultCode}`);

    const meta = {};
    CallbackMetadata?.Item?.forEach(({ Name, Value }) => { meta[Name] = Value; });
    const invoice = await Invoice.findOne({ checkoutRequestId: CheckoutRequestID });
    if (!invoice || invoice.status === 'PAID') return;
    const paid = Number(meta.Amount) || 0;
    invoice.amountPaid += paid;
    invoice.balance = invoice.totalAmount - invoice.amountPaid;
    invoice.mpesaRef = String(meta.MpesaReceiptNumber || '').replace(/[^A-Z0-9]/gi, '').slice(0, 20);
    invoice.status = invoice.balance <= 0 ? 'PAID' : 'PARTIAL';
    if (invoice.status === 'PAID') invoice.paidAt = new Date();
    await invoice.save();
    // Accrue loyalty points (1 pt per KES 100 paid)
    if (invoice.status === 'PAID') {
      try {
        const pts = Math.floor((invoice.amountPaid || 0) / 100);
        if (pts > 0) {
          await require('../models/CRMClient').findByIdAndUpdate(invoice.clientId, { $inc: { loyaltyPoints: pts } });
        }
      } catch (_) {}
    }
    // Generate PDF receipt asynchronously (non-blocking)
    if (invoice.status === 'PAID') {
      generateReceipt(invoice).then((url) => {
        if (url) require('../models/Invoice').findByIdAndUpdate(invoice._id, { receiptUrl: url }).catch(() => {});
      }).catch(() => {});
    }
    // Real-time: push payment confirmation
    try {
      const { emitPaymentResult } = require('../socket');
      const checkId = req.body?.Body?.stkCallback?.CheckoutRequestID || '';
      emitPaymentResult(checkId, {
        success: invoice.status === 'PAID',
        invoiceId: invoice._id,
        mpesaRef: invoice.mpesaRef,
        amount: invoice.amountPaid,
        paidAt: invoice.paidAt,
      });
    } catch (_) {}
    const client = await require('../models/CRMClient').findById(invoice.client);
    if (client) sendSMS(client.phone, `Payment of KES ${paid} received for invoice ${invoice.invoiceId}. Ref: ${invoice.mpesaRef}. Balance: KES ${invoice.balance}. Thank you!`);
  } catch (err) { console.error('Invoice callback error:', err.message); }
};

exports.getMyInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ client: req.user.clientId }).sort('-createdAt').limit(50);
    res.json(invoices);
  } catch (err) { next(err); }
};

exports.getOverdue = async (req, res, next) => {
  try {
    const filter = { status: { $in: ['SENT', 'PARTIAL'] }, dueDate: { $lt: new Date() } };
    if (req.user.role !== 'SUPER_ADMIN') filter.departmentSlug = req.user.departmentSlug;
    const invoices = await Invoice.find(filter).populate('client', 'fullName phone').sort('dueDate');
    res.json(invoices);
  } catch (err) { next(err); }
};

exports.cancelInvoice = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status: 'CANCELLED' }, { new: true });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) { next(err); }
};
