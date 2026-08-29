// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Department Analytics Controller
// Aggregated per-department revenue, ticket, and staffing stats
const DeptTransaction = require('../models/DeptTransaction');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Department = require('../models/Department');
const Invoice = require('../models/Invoice');

/**
 * GET /api/analytics/departments
 * Returns per-department analytics for the overview grid
 */
exports.getDepartmentAnalytics = async (req, res, next) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const dateFrom = new Date(`${year}-01-01`);
    const dateTo = new Date(`${year}-12-31T23:59:59.999`);

    // Get all active departments
    const departments = await Department.find({ isActive: true }).lean();

    // Run all queries in parallel
    const [revenueByDept, ticketStats, staffByDept, invoiceStats] = await Promise.all([
      // Revenue per department (yearly)
      DeptTransaction.aggregate([
        { $match: { type: 'income', date: { $gte: dateFrom, $lte: dateTo } } },
        { $group: { _id: '$departmentSlug', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // Tickets per department (all time + by status)
      Ticket.aggregate([
        { $group: {
          _id: '$departmentSlug',
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $in: ['$status', ['OPEN', 'IN_PROGRESS']] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
          slaBreach: { $sum: { $cond: ['$slaBreach', 1, 0] } },
        } },
      ]),

      // Staff count per department
      User.aggregate([
        { $match: { departmentSlug: { $exists: true, $ne: null } } },
        { $group: { _id: '$departmentSlug', total: { $sum: 1 } } },
      ]),

      // Invoice stats per department
      Invoice.aggregate([
        { $match: { createdAt: { $gte: dateFrom, $lte: dateTo } } },
        { $group: {
          _id: '$departmentSlug',
          total: { $sum: 1 },
          paid: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] } },
          unpaid: { $sum: { $cond: [{ $ne: ['$status', 'PAID'] }, 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$total', 0] } },
        } },
      ]),
    ]);

    // Merge all data by department slug
    const analytics = departments.map((dept) => {
      const slug = dept.slug;
      const rev = revenueByDept.find(r => r._id === slug) || { total: 0, count: 0 };
      const tkt = ticketStats.find(t => t._id === slug) || { total: 0, open: 0, resolved: 0, closed: 0, slaBreach: 0 };
      const staff = staffByDept.find(s => s._id === slug) || { total: 0 };
      const inv = invoiceStats.find(i => i._id === slug) || { total: 0, paid: 0, unpaid: 0, revenue: 0 };

      return {
        slug,
        name: dept.name,
        color: dept.color || '#2BB6A3',
        icon: dept.icon || '◈',
        revenue: rev.total,
        transactionCount: rev.count,
        tickets: tkt.total,
        ticketsOpen: tkt.open,
        ticketsResolved: tkt.resolved,
        ticketsClosed: tkt.closed,
        slaBreachCount: tkt.slaBreach,
        staffCount: staff.total,
        invoices: inv.total,
        invoicesPaid: inv.paid,
        invoicesUnpaid: inv.unpaid,
        invoiceRevenue: inv.revenue,
      };
    });

    // Sort by revenue descending
    analytics.sort((a, b) => b.revenue - a.revenue);

    res.json({ year, departments: analytics });
  } catch (err) { next(err); }
};

/**
 * GET /api/anemies/departments/:slug/timeline
 * Returns monthly revenue + ticket data for a specific department
 */
exports.getDepartmentTimeline = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const year = Number(req.query.year) || new Date().getFullYear();
    const dateFrom = new Date(`${year}-01-01`);
    const dateTo = new Date(`${year}-12-31T23:59:59.999`);

    const [monthlyRevenue, monthlyTickets] = await Promise.all([
      DeptTransaction.aggregate([
        { $match: { departmentSlug: slug, type: 'income', date: { $gte: dateFrom, $lte: dateTo } } },
        { $group: { _id: { month: { $month: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id.month': 1 } },
      ]),
      Ticket.aggregate([
        { $match: { departmentSlug: slug, createdAt: { $gte: dateFrom, $lte: dateTo } } },
        { $group: {
          _id: { month: { $month: '$createdAt' } },
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0] } },
        } },
        { $sort: { '_id.month': 1 } },
      ]),
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timeline = months.map((name, i) => {
      const rev = monthlyRevenue.find(r => r._id.month === i + 1);
      const tkt = monthlyTickets.find(t => t._id.month === i + 1);
      return {
        month: name,
        monthNum: i + 1,
        revenue: rev?.total || 0,
        tickets: tkt?.total || 0,
        ticketsResolved: tkt?.resolved || 0,
      };
    });

    res.json({ slug, year, timeline });
  } catch (err) { next(err); }
};
