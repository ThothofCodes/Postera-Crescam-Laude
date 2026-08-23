// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const { validateCallback } = require('../middleware/mpesa');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Consultation = require('../models/Consultation');
const Client = require('../models/Client');
const Revenue = require('../models/Revenue');
const { sendSMS } = require('../config/africastalking');

const sanitizeRef = (r) => (r ? String(r).replace(/[^A-Z0-9]/gi, '').slice(0, 20) : undefined);

exports.mpesaCallback = async (req, res) => {
  // Always respond 200 immediately — Safaricom requires response within 5 seconds
  res.json({ ResultCode: 0, ResultDesc: 'Success' });

  try {
    // Validate callback structure before processing
    if (!req.body?.Body?.stkCallback) {
      console.warn('M-Pesa callback: invalid body structure');
      return;
    }

    const { resultCode, checkoutRequestId, meta } = validateCallback(req.body);

    // Validate checkoutRequestId format — alphanumeric only
    if (!checkoutRequestId || !/^[A-Z0-9_-]{10,50}$/i.test(checkoutRequestId)) {
      console.warn('M-Pesa callback: invalid checkoutRequestId');
      return;
    }

    const order = await Order.findOne({ checkoutRequestId });
    const consultation = !order ? await Consultation.findOne({ checkoutRequestId }).populate('client') : null;
    const record = order || consultation;
    if (!record) return;

    // Prevent replay — only process if still unpaid
    if (record.paymentStatus === 'paid') {
      console.warn(`M-Pesa callback: duplicate for ${checkoutRequestId} — already paid`);
      return;
    }

    if (resultCode === 0) {
      const mpesaRef = sanitizeRef(meta.MpesaReceiptNumber);
      record.paymentStatus = 'paid';
      record.mpesaRef = mpesaRef;
      await record.save();

      const isOrder = !!order;
      await Revenue.create({
        type: 'income',
        category: isOrder ? 'order' : 'consultation',
        description: isOrder ? `Order ${order.orderNumber}` : `Consultation ${consultation._id}`,
        amount: isOrder ? order.total : consultation.fee,
        paymentMethod: 'mpesa',
        reference: mpesaRef,
      });

      // Deduct stock for physical products
      if (isOrder && order.items?.length) {
        for (const item of order.items) {
          if (!item.product) continue;
          const p = await Product.findById(item.product);
          if (p && !p.isDigital) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { soldCount: item.quantity, stock: -item.quantity },
            });
          } else if (p) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { soldCount: item.quantity },
            });
          }
        }
      }

      if (isOrder) {
        sendSMS(order.customer.phone, `Payment of KES ${order.total} confirmed. Ref: ${mpesaRef}. Order: ${order.orderNumber}`);
      } else if (consultation?.client?.phone) {
        sendSMS(consultation.client.phone, `Consultation payment of KES ${consultation.fee} confirmed. Ref: ${mpesaRef}.`);
      }
    } else {
      console.log(`M-Pesa callback: payment failed for ${checkoutRequestId} — ResultCode: ${resultCode}`);
    }
  } catch (err) {
    console.error('M-Pesa callback processing error:', err.message);
  }
};
