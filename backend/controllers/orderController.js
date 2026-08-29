// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Revenue = require('../models/Revenue');
const { stkPush } = require('../middleware/mpesa');
const { sendSMS } = require('../config/africastalking');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const safePage = (p) => Math.max(1, Math.min(Number(p) || 1, 1000));
const safeLimit = (l) => Math.max(1, Math.min(Number(l) || 20, 100));
const sanitizePhone = (p) => { const c = String(p || '').replace(/\D/g, ''); return c.length >= 9 && c.length <= 15 ? c : null; };
const sanitizeRef = (r) => (r ? String(r).replace(/[^A-Z0-9]/gi, '').slice(0, 20) : undefined);

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const VALID_PAYMENT = ['mpesa', 'cash', 'bank'];

exports.getOrders = async (req, res, next) => {
  try {
    const page = safePage(req.query.page); const
      limit = safeLimit(req.query.limit);
    const query = {};
    if (req.query.status && VALID_STATUSES.includes(req.query.status)) query.status = req.query.status;
    if (req.query.paymentStatus && ['unpaid', 'paid', 'refunded'].includes(req.query.paymentStatus)) query.paymentStatus = req.query.paymentStatus;
    const [orders, total] = await Promise.all([
      Order.find(query).sort('-createdAt').skip((page - 1) * limit).limit(limit),
      Order.countDocuments(query),
    ]);
    res.json({
      orders, total, page, pages: Math.ceil(total / limit),
    });
  } catch (err) { next(err); }
};

exports.getOrder = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid order ID' });
    const order = await Order.findById(req.params.id).populate('items.product', 'name images');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { next(err); }
};

exports.getOrdersByPhone = async (req, res, next) => {
  try {
    const phone = sanitizePhone(req.params.phone);
    if (!phone) return res.status(400).json({ message: 'Invalid phone number' });
    const orders = await Order.find({ 'customer.phone': phone })
      .sort('-createdAt')
      .select('orderNumber status paymentStatus total deliveryType items createdAt mpesaRef customer.name customer.phone');
    res.json(orders);
  } catch (err) { next(err); }
};

exports.createOrder = async (req, res, next) => {
  try {
    const {
      items, customer, deliveryType, deliveryFee = 0, notes, paymentMethod,
    } = req.body;
    if (!items?.length || items.length > 50) return res.status(400).json({ message: 'Order must have 1–50 items' });
    if (!customer?.name || !customer?.phone) return res.status(400).json({ message: 'Customer name and phone required' });
    const phone = sanitizePhone(customer.phone);
    if (!phone) return res.status(400).json({ message: 'Invalid phone number' });
    if (deliveryType && !['pickup', 'delivery'].includes(deliveryType)) return res.status(400).json({ message: 'Invalid delivery type' });
    if (paymentMethod && !VALID_PAYMENT.includes(paymentMethod)) return res.status(400).json({ message: 'Invalid payment method' });

    const enriched = await Promise.all(items.map(async ({ product, quantity }) => {
      if (!isValidId(product)) throw Object.assign(new Error('Invalid product ID'), { statusCode: 400 });
      const qty = Math.floor(Number(quantity));
      if (!qty || qty < 1 || qty > 999) throw Object.assign(new Error('Invalid quantity'), { statusCode: 400 });
      const p = await Product.findById(product);
      if (!p || !p.isActive) throw Object.assign(new Error('Product unavailable'), { statusCode: 400 });
      if (!p.isDigital && p.stock < qty) throw Object.assign(new Error(`Insufficient stock for ${p.name}`), { statusCode: 400 });
      return {
        product: p._id, name: p.name, price: p.price, quantity: qty, subtotal: p.price * qty,
      };
    }));

    const subtotal = enriched.reduce((s, i) => s + i.subtotal, 0);
    const fee = Math.max(0, Math.min(Number(deliveryFee) || 0, 10000));
    const total = subtotal + fee;

    const order = await Order.create({
      customer: {
        name: customer.name.trim().slice(0, 100),
        phone,
        email: customer.email?.toLowerCase().trim().slice(0, 200),
        deliveryAddress: customer.deliveryAddress?.trim().slice(0, 500),
      },
      items: enriched,
      subtotal,
      deliveryFee: fee,
      total,
      deliveryType: deliveryType || 'pickup',
      notes: notes?.trim().slice(0, 500),
      paymentMethod: paymentMethod || 'cash',
    });

    let stkPushResult = null;
    if (paymentMethod === 'mpesa') {
      try {
        stkPushResult = await stkPush(phone, total, order.orderNumber, 'Ruai Tech Order');
        order.checkoutRequestId = stkPushResult.CheckoutRequestID;
        await order.save();
      } catch (e) {
        console.error('STK Push failed:', e.message);
        // Return order but warn the customer — payment prompt may not arrive
        return res.status(201).json({
          ...order.toObject(),
          _stkError: e.message || 'M-Pesa prompt could not be sent. Please try again or pay cash.',
        });
      }
    }

    sendSMS(phone, `Order ${order.orderNumber} placed! Total: KES ${total}. We'll confirm shortly.`);
    res.status(201).json(order);
  } catch (err) { next(err); }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid order ID' });
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const ts = { confirmed: 'confirmedAt', shipped: 'shippedAt', delivered: 'deliveredAt' };
    const update = { status };
    if (ts[status]) update[ts[status]] = new Date();
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    sendSMS(order.customer.phone, `Your order ${order.orderNumber} is now: ${status.toUpperCase()}.`);
    res.json(order);
  } catch (err) { next(err); }
};

exports.recordOrderPayment = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid order ID' });
    const { paymentMethod, mpesaRef, amount } = req.body;
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0 || parsedAmount > 10_000_000) return res.status(400).json({ message: 'Valid amount required' });
    if (!VALID_PAYMENT.includes(paymentMethod)) return res.status(400).json({ message: 'Invalid payment method' });
    const safeRef = sanitizeRef(mpesaRef);
    const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus: 'paid', paymentMethod, mpesaRef: safeRef }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await Revenue.create({
      type: 'income', category: 'order', description: `Order ${order.orderNumber} — ${order.customer.name}`, amount: parsedAmount, paymentMethod, reference: safeRef, createdBy: req.user._id,
    });
    await Promise.all(order.items.map(async ({ product, quantity }) => {
      if (!isValidId(product)) return;
      const p = await Product.findById(product);
      if (p && !p.isDigital) await Product.findByIdAndUpdate(product, { $inc: { soldCount: quantity, stock: -quantity } });
      else if (p) await Product.findByIdAndUpdate(product, { $inc: { soldCount: quantity } });
    }));
    sendSMS(order.customer.phone, `Payment confirmed for order ${order.orderNumber}. Ref: ${safeRef || 'N/A'}. Thank you!`);
    res.json(order);
  } catch (err) { next(err); }
};
