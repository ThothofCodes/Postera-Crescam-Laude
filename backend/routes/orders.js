// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const router = require('express').Router();
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const Order = require('../models/Order');
const {
  getOrders, getOrder, getOrdersByPhone, createOrder, updateOrderStatus, recordOrderPayment,
} = require('../controllers/orderController');
const {
  protect, staffGuard, deptHeadGuard, staffReadScope,
} = require('../middleware/auth');

// ── PCL Brand Config ─────────────────────────────────────────────────
const STORE = {
  name: 'Postera Crescam Laude',
  tagline: "Empowering Kenya's Digital Future",
  address: 'Ruai Town Centre, Nairobi County, Kenya',
  phone: '+254 140 918 502',
  email: 'info@posteracrescamlaude.co.ke',
  taxId: 'PCL/VAT/2026',
  returnPolicy: 'Returns accepted within 7 days of purchase with receipt.',
  website: 'posteracrescamlaude.co.ke',
};

const COLORS = {
  void: '#081916',
  ink: '#244A44',
  ember: '#EE6100',
  emberGlow: '#FF8A3D',
  inkBright: '#2BB6A3',
  text: '#F4F1EA',
  mist: '#A9C4BE',
  paper: '#F4F1EA',
  paperInk: '#244A44',
};

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
}

function rgb(hex) { const c = hexToRgb(hex); return [c.r, c.g, c.b]; }

// ── Receipt PDF Generator ────────────────────────────────────────────
async function generateReceiptPDF(order) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Receipt — ${order.orderNumber}`,
          Author: STORE.name,
          Subject: 'Purchase Receipt',
          Creator: 'PCL Receipt System',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── QR Code ──────────────────────────────────────────────────
      const trackingUrl = `${STORE.website}/track/${order.orderNumber}`;
      let qrDataUri = null;
      try {
        qrDataUri = await QRCode.toDataURL(trackingUrl, { width: 160, margin: 1, color: { dark: '#244A44', light: '#F4F1EA' } });
      } catch { /* QR generation failed — continue without it */ }

      // ── Colors ───────────────────────────────────────────────────
      const emberRgb = rgb(COLORS.ember);
      const inkRgb = rgb(COLORS.ink);
      const inkBrightRgb = rgb(COLORS.inkBright);
      const mistRgb = rgb(COLORS.mist);
      const paperRgb = rgb(COLORS.paper);

      // ── Header ───────────────────────────────────────────────────
      // Ember top bar
      doc.rect(0, 0, doc.page.width, 6).fill(rgb(COLORS.ember));

      // Brand name
      doc.fontSize(22).font('Helvetica-Bold').fillColor(rgb(COLORS.ink))
        .text(STORE.name, 40, 30, { align: 'center' });

      // Tagline
      doc.fontSize(8).font('Helvetica').fillColor(mistRgb)
        .text(STORE.tagline, 40, 56, { align: 'center' });

      // Address line
      doc.fontSize(7).font('Helvetica').fillColor(mistRgb)
        .text(`${STORE.address} · ${STORE.phone} · ${STORE.taxId}`, 40, 70, { align: 'center' });

      // Divider
      doc.moveTo(40, 88).lineTo(doc.page.width - 40, 88)
        .lineWidth(0.5).strokeColor(emberRgb).stroke();

      // ── Invoice Title ────────────────────────────────────────────
      doc.fontSize(14).font('Helvetica-Bold').fillColor(emberRgb)
        .text('PURCHASE RECEIPT', 40, 98, { align: 'center' });

      // ── Order Meta ───────────────────────────────────────────────
      let y = 125;
      const leftX = 40;
      const rightX = doc.page.width - 40;

      const metaLeft = [
        ['Order Number', order.orderNumber],
        ['Date', new Date(order.createdAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })],
        ['Time', new Date(order.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })],
      ];
      const metaRight = [
        ['Payment', order.paymentMethod === 'mpesa' ? 'M-Pesa' : order.paymentMethod === 'cash' ? 'Cash on Pickup' : order.paymentMethod],
        ['Status', order.status?.toUpperCase() || 'PENDING'],
        ['Delivery', order.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'],
      ];

      metaLeft.forEach(([label, value]) => {
        doc.fontSize(7).font('Helvetica').fillColor(mistRgb).text(label, leftX, y);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(inkRgb).text(value || '—', leftX + 80, y, { width: 180 });
        y += 14;
      });

      let ry = 125;
      metaRight.forEach(([label, value]) => {
        doc.fontSize(7).font('Helvetica').fillColor(mistRgb).text(label, 320, ry);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(inkRgb).text(value || '—', 380, ry, { width: 150 });
        ry += 14;
      });

      y = Math.max(y, ry) + 10;

      // ── Customer Info ────────────────────────────────────────────
      doc.fontSize(8).font('Helvetica-Bold').fillColor(emberRgb)
        .text('CUSTOMER DETAILS', leftX, y);
      y += 14;

      const custFields = [
        ['Name', order.customer?.name],
        ['Phone', order.customer?.phone],
        ['Email', order.customer?.email],
      ].filter(([, v]) => v);

      custFields.forEach(([label, value]) => {
        doc.fontSize(7).font('Helvetica').fillColor(mistRgb).text(label, leftX, y);
        doc.fontSize(8).font('Helvetica').fillColor(inkRgb).text(value, leftX + 70, y, { width: 300 });
        y += 12;
      });

      if (order.deliveryType === 'delivery' && order.customer?.deliveryAddress) {
        doc.fontSize(7).font('Helvetica').fillColor(mistRgb).text('Address', leftX, y);
        doc.fontSize(8).font('Helvetica').fillColor(inkRgb).text(order.customer.deliveryAddress, leftX + 70, y, { width: 300 });
        y += 12;
      }

      y += 8;

      // ── Line Items Table ─────────────────────────────────────────
      doc.fontSize(8).font('Helvetica-Bold').fillColor(emberRgb)
        .text('ITEMS PURCHASED', leftX, y);
      y += 16;

      // Table header
      const tableTop = y;
      const colItem = leftX;
      const colQty = 350;
      const colPrice = 410;
      const colTotal = 480;

      doc.fontSize(7).font('Helvetica-Bold').fillColor(mistRgb)
        .text('ITEM', colItem, y, { width: 200 })
        .text('QTY', colQty, y, { width: 40, align: 'center' })
        .text('PRICE', colPrice, y, { width: 60, align: 'right' })
        .text('TOTAL', colTotal, y, { width: 60, align: 'right' });
      y += 14;

      // Header underline
      doc.moveTo(leftX, y).lineTo(rightX, y)
        .lineWidth(0.5).strokeColor(inkRgb).stroke();
      y += 6;

      // Items
      (order.items || []).forEach((item) => {
        // Check if we need a new page
        if (y > doc.page.height - 120) {
          doc.addPage();
          y = 40;
        }

        doc.fontSize(8).font('Helvetica').fillColor(inkRgb)
          .text(item.name || 'Item', colItem, y, { width: 200 });
        doc.fontSize(8).font('Helvetica').fillColor(inkRgb)
          .text(String(item.quantity), colQty, y, { width: 40, align: 'center' });
        doc.fontSize(8).font('Helvetica').fillColor(inkRgb)
          .text(`KES ${Number(item.price || 0).toLocaleString()}`, colPrice, y, { width: 60, align: 'right' });
        doc.fontSize(8).font('Helvetica-Bold').fillColor(inkRgb)
          .text(`KES ${Number(item.subtotal || item.price * item.quantity || 0).toLocaleString()}`, colTotal, y, { width: 60, align: 'right' });
        y += 18;

        // Item row separator
        doc.moveTo(leftX, y - 4).lineTo(rightX, y - 4)
          .lineWidth(0.2).strokeColor(mistRgb).stroke();
      });

      y += 8;

      // ── Totals ───────────────────────────────────────────────────
      const totalsX = 350;
      const totalsValX = 480;

      const drawTotalLine = (label, value, bold = false) => {
        doc.fontSize(8).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(bold ? inkRgb : mistRgb)
          .text(label, totalsX, y, { width: 120 });
        doc.fontSize(8).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(bold ? inkRgb : mistRgb)
          .text(`KES ${Number(value || 0).toLocaleString()}`, totalsValX, y, { width: 60, align: 'right' });
        y += 14;
      };

      drawTotalLine('Subtotal', order.subtotal);
      if (order.deliveryFee > 0) drawTotalLine('Delivery Fee', order.deliveryFee);

      // Grand total with highlight
      doc.moveTo(totalsX, y).lineTo(rightX, y)
        .lineWidth(0.5).strokeColor(emberRgb).stroke();
      y += 6;

      doc.fontSize(11).font('Helvetica-Bold').fillColor(emberRgb)
        .text('TOTAL', totalsX, y, { width: 120 });
      doc.fontSize(11).font('Helvetica-Bold').fillColor(emberRgb)
        .text(`KES ${Number(order.total || 0).toLocaleString()}`, totalsValX, y, { width: 60, align: 'right' });
      y += 22;

      // ── Payment Info ─────────────────────────────────────────────
      doc.moveTo(leftX, y).lineTo(rightX, y)
        .lineWidth(0.3).strokeColor(mistRgb).stroke();
      y += 8;

      doc.fontSize(7).font('Helvetica').fillColor(mistRgb)
        .text(`Payment Method: ${order.paymentMethod === 'mpesa' ? 'M-Pesa' : order.paymentMethod === 'cash' ? 'Cash on Pickup' : order.paymentMethod}`, leftX, y);
      y += 12;
      if (order.mpesaRef) {
        doc.fontSize(7).font('Helvetica').fillColor(mistRgb)
          .text(`M-Pesa Reference: ${order.mpesaRef}`, leftX, y);
        y += 12;
      }

      y += 10;

      // ── QR Code ──────────────────────────────────────────────────
      if (qrDataUri) {
        try {
          const qrBuffer = Buffer.from(qrDataUri.split(',')[1], 'base64');
          doc.image(qrBuffer, leftX, y, { width: 80, height: 80 });
          doc.fontSize(7).font('Helvetica').fillColor(mistRgb)
            .text('Scan to track your order', leftX + 85, y + 20, { width: 150 });
          doc.fontSize(7).font('Helvetica').fillColor(inkRgb)
            .text(trackingUrl, leftX + 85, y + 34, { width: 200 });
        } catch { /* skip QR if buffer fails */ }
      }

      // ── Footer ───────────────────────────────────────────────────
      const footerY = doc.page.height - 60;

      // Footer divider
      doc.moveTo(leftX, footerY - 10).lineTo(rightX, footerY - 10)
        .lineWidth(0.3).strokeColor(inkRgb).stroke();

      doc.fontSize(7).font('Helvetica').fillColor(mistRgb)
        .text(`${STORE.returnPolicy}`, leftX, footerY, { align: 'center', width: doc.page.width - 80 });

      doc.fontSize(6).font('Helvetica').fillColor(mistRgb)
        .text(`${STORE.name} · ${STORE.website} · ${STORE.email}`, leftX, footerY + 14, { align: 'center', width: doc.page.width - 80 });

      // Ember bottom bar
      doc.rect(0, doc.page.height - 6, doc.page.width, 6).fill(rgb(COLORS.ember));

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ── Routes ───────────────────────────────────────────────────────────

// Public — customer order tracking
router.get('/my/:phone', getOrdersByPhone);

// Public — place order (store checkout)
router.post('/', createOrder);

// ── Public order status (for payment polling — no auth required) ─────
// Accepts either orderNumber (RTS-2026-00001) or ObjectId
router.get('/status/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const isObjectId = /^[0-9a-f]{24}$/i.test(identifier);
    const query = isObjectId ? { _id: identifier } : { orderNumber: identifier };
    const order = await Order.findOne(query)
      .select('orderNumber paymentStatus status total mpesaRef paymentMethod');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      status: order.status,
      total: order.total,
      mpesaRef: order.mpesaRef,
      paymentMethod: order.paymentMethod,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to check order status' });
  }
});

// ── Receipt PDF (public — by order number) ───────────────────────────
router.get('/receipt/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const pdfBuffer = await generateReceiptPDF(order);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receipt-${order.orderNumber}.pdf"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Receipt generation error:', err);
    res.status(500).json({ message: 'Failed to generate receipt' });
  }
});

// STAFF can view orders and verify/record payments (transaction verification)
router.get('/', protect, staffGuard, staffReadScope, getOrders);
router.get('/:id', protect, staffGuard, staffReadScope, getOrder);
router.put('/:id/payment', protect, staffGuard, staffReadScope, recordOrderPayment);

// Only dept heads and above can update order status
router.put('/:id/status', protect, deptHeadGuard, updateOrderStatus);

module.exports = router;
