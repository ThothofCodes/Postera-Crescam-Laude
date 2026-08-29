// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Payment History Route
const router = require('express').Router();
const Order = require('../models/Order');
const Consultation = require('../models/Consultation');
const Invoice = require('../models/Invoice');
const { protect, staffGuard } = require('../middleware/auth');

// GET /api/payment-history — aggregated payment history
router.get('/', protect, staffGuard, async (req, res) => {
  try {
    const {
      status, // paid, unpaid, refunded, partial
      method, // mpesa, cash, bank
      source, // order, consultation, invoice
      search, // search by orderNumber, mpesaRef, customer name
      page = 1,
      limit = 30,
      sort = '-createdAt',
    } = req.query;

    const pageNum = Math.max(1, Math.min(Number(page) || 1, 1000));
    const limitNum = Math.max(1, Math.min(Number(limit) || 30, 100));

    // Build queries for each source
    const queries = [];

    if (!source || source === 'order') {
      const orderQuery = {};
      if (status) orderQuery.paymentStatus = status;
      if (method) orderQuery.paymentMethod = method;
      if (search) {
        orderQuery.$or = [
          { orderNumber: { $regex: search, $options: 'i' } },
          { mpesaRef: { $regex: search, $options: 'i' } },
          { 'customer.name': { $regex: search, $options: 'i' } },
          { 'customer.phone': { $regex: search, $options: 'i' } },
        ];
      }
      const orders = await Order.find(orderQuery)
        .select('orderNumber paymentStatus paymentMethod mpesaRef total customer.name customer.phone createdAt checkoutRequestId retryCount')
        .sort(sort)
        .lean();
      queries.push(...orders.map((o) => ({
        id: o._id,
        reference: o.orderNumber,
        type: 'order',
        description: `Order — ${o.customer?.name || 'Customer'}`,
        amount: o.total,
        status: o.paymentStatus,
        method: o.paymentMethod || 'mpesa',
        mpesaRef: o.mpesaRef || null,
        customerName: o.customer?.name || null,
        customerPhone: o.customer?.phone || null,
        checkoutRequestId: o.checkoutRequestId || null,
        retryCount: o.retryCount || 0,
        createdAt: o.createdAt,
      })));
    }

    if (!source || source === 'consultation') {
      const consultQuery = {};
      if (status) consultQuery.paymentStatus = status;
      if (search) {
        consultQuery.$or = [
          { mpesaRef: { $regex: search, $options: 'i' } },
          { type: { $regex: search, $options: 'i' } },
        ];
      }
      const consults = await Consultation.find(consultQuery)
        .select('type fee paymentStatus mpesaRef client createdAt checkoutRequestId')
        .populate('client', 'fullName phone')
        .sort(sort)
        .lean();
      queries.push(...consults.map((c) => ({
        id: c._id,
        reference: `CONSULT-${String(c._id).slice(-6).toUpperCase()}`,
        type: 'consultation',
        description: `${c.type || 'Consultation'} — ${c.client?.fullName || 'Client'}`,
        amount: c.fee,
        status: c.paymentStatus,
        method: 'mpesa',
        mpesaRef: c.mpesaRef || null,
        customerName: c.client?.fullName || null,
        customerPhone: c.client?.phone || null,
        checkoutRequestId: c.checkoutRequestId || null,
        retryCount: 0,
        createdAt: c.createdAt,
      })));
    }

    if (!source || source === 'invoice') {
      const invoiceQuery = {};
      if (status) {
        if (status === 'paid') invoiceQuery.status = 'PAID';
        else if (status === 'unpaid') invoiceQuery.status = { $in: ['PENDING', 'SENT', 'PAYMENT_SENT', 'OVERDUE'] };
        else if (status === 'partial') invoiceQuery.status = 'PARTIAL';
        else invoiceQuery.status = status.toUpperCase();
      }
      if (method) invoiceQuery.paymentMethod = method;
      if (search) {
        invoiceQuery.$or = [
          { invoiceId: { $regex: search, $options: 'i' } },
          { mpesaRef: { $regex: search, $options: 'i' } },
        ];
      }
      const invoices = await Invoice.find(invoiceQuery)
        .select('invoiceId totalAmount amountPaid balance status mpesaRef paymentMethod clientId checkoutRequestId createdAt')
        .populate('clientId', 'fullName phone')
        .sort(sort)
        .lean();
      queries.push(...invoices.map((inv) => ({
        id: inv._id,
        reference: inv.invoiceId,
        type: 'invoice',
        description: `Invoice — ${inv.clientId?.fullName || 'Client'}`,
        amount: inv.totalAmount,
        paid: inv.amountPaid,
        balance: inv.balance,
        status: inv.status === 'PAID' ? 'paid' : inv.status === 'PARTIAL' ? 'partial' : 'unpaid',
        method: inv.paymentMethod || 'mpesa',
        mpesaRef: inv.mpesaRef || null,
        customerName: inv.clientId?.fullName || null,
        customerPhone: inv.clientId?.phone || null,
        checkoutRequestId: inv.checkoutRequestId || null,
        retryCount: 0,
        createdAt: inv.createdAt,
      })));
    }

    // Sort combined results
    queries.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sort.startsWith('-') ? dateB - dateA : dateA - dateB;
    });

    // Calculate summary stats
    const totalPaid = queries.filter((q) => q.status === 'paid').reduce((s, q) => s + (q.amount || 0), 0);
    const totalUnpaid = queries.filter((q) => q.status === 'unpaid').reduce((s, q) => s + ((q.balance || q.amount) || 0), 0);
    const totalCount = queries.length;

    // Paginate
    const start = (pageNum - 1) * limitNum;
    const paginated = queries.slice(start, start + limitNum);

    res.json({
      payments: paginated,
      total: totalCount,
      page: pageNum,
      pages: Math.ceil(totalCount / limitNum),
      summary: {
        totalPaid,
        totalUnpaid,
        totalCount,
        paidCount: queries.filter((q) => q.status === 'paid').length,
        unpaidCount: queries.filter((q) => q.status === 'unpaid' || q.status === 'partial').length,
      },
    });
  } catch (err) {
    console.error('Payment history error:', err);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
});

module.exports = router;
