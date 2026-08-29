// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Department Analytics PDF Export
const router = require('express').Router();
const PDFDocument = require('pdfkit');
const { protect, superAdminGuard } = require('../middleware/auth');
const DeptTransaction = require('../models/DeptTransaction');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Department = require('../models/Department');
const Invoice = require('../models/Invoice');

const COLORS = {
  ember: '#EE6100',
  ink: '#244A44',
  inkBright: '#E8F0EE',
  mist: '#6A8A82',
  paper: '#F4F1EA',
  teal: '#2BB6A3',
  violet: '#A78BFA',
  gold: '#FFB020',
  red: '#FF3B3B',
  green: '#39FF88',
};

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.substring(0, 2), 16) / 255, parseInt(h.substring(2, 4), 16) / 255, parseInt(h.substring(4, 6), 16) / 255];
}

function formatKES(amount) {
  return `KES ${Number(amount || 0).toLocaleString('en-KE')}`;
}

// GET /api/analytics/departments/pdf?year=2026
router.get('/', protect, superAdminGuard, async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const dateFrom = new Date(`${year}-01-01`);
    const dateTo = new Date(`${year}-12-31T23:59:59.999`);

    // Fetch all data
    const departments = await Department.find({ isActive: true }).lean();
    const [revenueByDept, ticketStats, staffByDept] = await Promise.all([
      DeptTransaction.aggregate([
        { $match: { type: 'income', date: { $gte: dateFrom, $lte: dateTo } } },
        { $group: { _id: '$departmentSlug', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        { $group: {
          _id: '$departmentSlug',
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $in: ['$status', ['OPEN', 'IN_PROGRESS']] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
          slaBreach: { $sum: { $cond: ['$slaBreach', 1, 0] } },
        } },
      ]),
      User.aggregate([
        { $match: { departmentSlug: { $exists: true, $ne: null } } },
        { $group: { _id: '$departmentSlug', total: { $sum: 1 } } },
      ]),
    ]);

    // Merge data
    const analytics = departments.map((dept) => {
      const slug = dept.slug;
      const rev = revenueByDept.find(r => r._id === slug) || { total: 0, count: 0 };
      const tkt = ticketStats.find(t => t._id === slug) || { total: 0, open: 0, resolved: 0, slaBreach: 0 };
      const staff = staffByDept.find(s => s._id === slug) || { total: 0 };
      return {
        name: dept.name, slug, color: dept.color || '#2BB6A3',
        revenue: rev.total, transactions: rev.count,
        tickets: tkt.total, open: tkt.open, resolved: tkt.resolved, slaBreach: tkt.slaBreach,
        staff: staff.total,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = analytics.reduce((s, d) => s + d.revenue, 0);
    const totalTickets = analytics.reduce((s, d) => s + d.tickets, 0);
    const totalStaff = analytics.reduce((s, d) => s + d.staff, 0);
    const totalOpen = analytics.reduce((s, d) => s + d.open, 0);

    // Generate PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Department Analytics — ${year}`,
        Author: 'Postera Crescam Laude',
        Subject: 'Department Performance Report',
        Creator: 'PCL Analytics System',
      },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdf = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="dept-analytics-${year}.pdf"`);
      res.send(pdf);
    });

    // ── Header ─────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 6).fill(hexToRgb(COLORS.ember));
    doc.fontSize(20).font('Helvetica-Bold').fillColor(hexToRgb(COLORS.ink))
      .text('Department Analytics Report', 40, 30, { align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor(hexToRgb(COLORS.mist))
      .text(`Postera Crescam Laude — Fiscal Year ${year}`, 40, 55, { align: 'center' });
    doc.moveDown(0.5);

    // Divider
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor(hexToRgb(COLORS.teal)).lineWidth(0.5).stroke();
    doc.moveDown(0.8);

    // ── KPI Summary ────────────────────────────────────────────
    doc.fontSize(11).font('Helvetica-Bold').fillColor(hexToRgb(COLORS.ink))
      .text('Summary', 40);
    doc.moveDown(0.3);

    const kpiY = doc.y;
    const kpiWidth = (doc.page.width - 80) / 4;
    const kpis = [
      { label: 'Total Revenue', value: formatKES(totalRevenue), color: COLORS.teal },
      { label: 'Total Tickets', value: String(totalTickets), color: COLORS.violet },
      { label: 'Open Tickets', value: String(totalOpen), color: COLORS.red },
      { label: 'Total Staff', value: String(totalStaff), color: COLORS.gold },
    ];

    kpis.forEach((kpi, i) => {
      const x = 40 + (i * kpiWidth);
      doc.fontSize(7).font('Helvetica').fillColor(hexToRgb(COLORS.mist))
        .text(kpi.label.toUpperCase(), x, kpiY, { width: kpiWidth - 10 });
      doc.fontSize(16).font('Helvetica-Bold').fillColor(hexToRgb(kpi.color))
        .text(kpi.value, x, kpiY + 12, { width: kpiWidth - 10 });
    });
    doc.y = kpiY + 40;

    // Divider
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor(hexToRgb('#E0E0E0')).lineWidth(0.3).stroke();
    doc.moveDown(0.6);

    // ── Revenue Bar Chart ──────────────────────────────────────
    doc.fontSize(11).font('Helvetica-Bold').fillColor(hexToRgb(COLORS.ink))
      .text('Revenue by Department', 40);
    doc.moveDown(0.3);

    const maxRevenue = Math.max(...analytics.map(d => d.revenue), 1);
    const barStartX = 130;
    const barMaxWidth = doc.page.width - 180;
    const barHeight = 14;

    analytics.forEach((dept) => {
      const y = doc.y;
      // Label
      doc.fontSize(8).font('Helvetica').fillColor(hexToRgb(COLORS.ink))
        .text(dept.name.length > 16 ? dept.name.substring(0, 15) + '…' : dept.name, 40, y + 2, { width: 85 });
      // Bar background
      doc.rect(barStartX, y, barMaxWidth, barHeight).fill(hexToRgb('#E8E8E8'));
      // Bar fill
      const fillWidth = Math.max((dept.revenue / maxRevenue) * barMaxWidth, dept.revenue > 0 ? 2 : 0);
      doc.rect(barStartX, y, fillWidth, barHeight).fill(hexToRgb(dept.color));
      // Value
      doc.fontSize(7).font('Helvetica-Bold').fillColor(hexToRgb(COLORS.ink))
        .text(formatKES(dept.revenue), barStartX + fillWidth + 5, y + 3);
      doc.y = y + barHeight + 5;
    });
    doc.moveDown(0.5);

    // ── Department Breakdown Table ─────────────────────────────
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 6).fill(hexToRgb(COLORS.ember));

    doc.fontSize(11).font('Helvetica-Bold').fillColor(hexToRgb(COLORS.ink))
      .text('Department Breakdown', 40, 25);
    doc.moveDown(0.5);

    // Table header
    const tableX = 40;
    const colWidths = [100, 70, 55, 45, 45, 45, 45, 55];
    const headers = ['Department', 'Revenue', 'Transactions', 'Tickets', 'Open', 'Resolved', 'SLA Breach', 'Staff'];
    const headerY = doc.y;

    doc.rect(tableX, headerY, doc.page.width - 80, 18).fill(hexToRgb('#0B1F1B'));
    let colX = tableX + 5;
    headers.forEach((h, i) => {
      doc.fontSize(7).font('Helvetica-Bold').fillColor(hexToRgb(COLORS.teal))
        .text(h.toUpperCase(), colX, headerY + 5, { width: colWidths[i] });
      colX += colWidths[i];
    });
    doc.y = headerY + 22;

    // Table rows
    analytics.forEach((dept, idx) => {
      const rowY = doc.y;
      if (rowY > doc.page.height - 80) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, 6).fill(hexToRgb(COLORS.ember));
        doc.y = 30;
      }

      // Alternating row background
      if (idx % 2 === 0) {
        doc.rect(tableX, rowY - 2, doc.page.width - 80, 16).fill(hexToRgb('#F5F5F5'));
      }

      colX = tableX + 5;
      const rowData = [
        dept.name.length > 18 ? dept.name.substring(0, 17) + '…' : dept.name,
        formatKES(dept.revenue),
        String(dept.transactions),
        String(dept.tickets),
        String(dept.open),
        String(dept.resolved),
        String(dept.slaBreach),
        String(dept.staff),
      ];

      rowData.forEach((val, i) => {
        const color = i === 0 ? COLORS.ink
          : i === 1 ? COLORS.teal
          : i === 4 && dept.open > 0 ? COLORS.red
          : i === 6 && dept.slaBreach > 0 ? '#FF6600'
          : COLORS.ink;
        doc.fontSize(8).font(i === 0 ? 'Helvetica' : 'Helvetica').fillColor(hexToRgb(color))
          .text(val, colX, rowY, { width: colWidths[i] });
        colX += colWidths[i];
      });

      doc.y = rowY + 16;
    });

    // Totals row
    const totalsY = doc.y + 5;
    doc.rect(tableX, totalsY - 2, doc.page.width - 80, 18).fill(hexToRgb(COLORS.ink));
    colX = tableX + 5;
    const totals = [
      'TOTAL',
      formatKES(totalRevenue),
      String(analytics.reduce((s, d) => s + d.transactions, 0)),
      String(totalTickets),
      String(totalOpen),
      String(analytics.reduce((s, d) => s + d.resolved, 0)),
      String(analytics.reduce((s, d) => s + d.slaBreach, 0)),
      String(totalStaff),
    ];
    totals.forEach((val, i) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor(hexToRgb(COLORS.ember))
        .text(val, colX, totalsY + 4, { width: colWidths[i] });
      colX += colWidths[i];
    });
    doc.y = totalsY + 30;

    // ── Footer ─────────────────────────────────────────────────
    doc.fontSize(7).font('Helvetica').fillColor(hexToRgb(COLORS.mist))
      .text(`Generated on ${new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })} • Postera Crescam Laude`, 40, doc.page.height - 40, { align: 'center', width: doc.page.width - 80 });

    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
});

module.exports = router;
