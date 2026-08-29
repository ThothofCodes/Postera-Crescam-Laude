// Copyright (c) 2026 Thoth of Codes. Nightly BI snapshot aggregation
const mongoose = require('mongoose');
const Analytics = require('../models/Analytics');
const Invoice = require('../models/Invoice');
const CRMClient = require('../models/CRMClient');
const Ticket = require('../models/Ticket');
const PSSession = require('../models/PSSession');
const DeptTransaction = require('../models/DeptTransaction');

const Department = require('../models/Department');

async function getSlugs() {
  const depts = await Department.find({ isActive: true }).select('slug').lean();
  return depts.length > 0 ? depts.map(d => d.slug) : ['internet', 'webdev', 'playstation', 'repair', 'cybersecurity', 'govadmin'];
}

async function saveSnapshot(deptSlug, group, data, period = 'DAILY') {
  const date = new Date().toISOString().slice(0, 10);
  await Analytics.findOneAndUpdate(
    {
      departmentSlug: deptSlug, metricGroup: group, period, date,
    },
    { data, generatedAt: new Date() },
    { upsert: true, new: true },
  );
}

exports.runBISnapshot = async function () {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const SLUGS = await getSlugs();

    for (const slug of SLUGS) {
      const filter = { departmentSlug: slug };

      // Revenue snapshot
      const [monthRevenue, totalInvoices, paidInvoices] = await Promise.all([
        DeptTransaction.aggregate([
          { $match: { ...filter, type: 'income', createdAt: { $gte: monthStart } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Invoice.countDocuments({ ...filter }),
        Invoice.countDocuments({ ...filter, status: 'PAID' }),
      ]);
      await saveSnapshot(slug, 'REVENUE', {
        monthTotal: monthRevenue[0]?.total || 0,
        totalInvoices,
        paidInvoices,
        unpaidCount: totalInvoices - paidInvoices,
      });

      // Client snapshot
      const [totalClients, newClientsMonth, activeClients] = await Promise.all([
        CRMClient.countDocuments(filter),
        CRMClient.countDocuments({ ...filter, createdAt: { $gte: monthStart } }),
        CRMClient.countDocuments({ ...filter, segment: 'ACTIVE' }),
      ]);
      await saveSnapshot(slug, 'CLIENTS', { totalClients, newClientsMonth, activeClients });

      // Ticket snapshot
      const [openTickets, breachedTickets, resolvedMonth] = await Promise.all([
        Ticket.countDocuments({ ...filter, status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
        Ticket.countDocuments({ ...filter, slaBreach: true }),
        Ticket.countDocuments({ ...filter, status: 'RESOLVED', updatedAt: { $gte: monthStart } }),
      ]);
      await saveSnapshot(slug, 'TICKETS', { openTickets, breachedTickets, resolvedMonth });

      // Sessions (PlayStation only)
      if (slug === 'playstation') {
        const [todaySessions, monthSessions] = await Promise.all([
          PSSession.countDocuments({ createdAt: { $gte: today } }),
          PSSession.countDocuments({ createdAt: { $gte: monthStart } }),
        ]);
        await saveSnapshot(slug, 'SESSIONS', { todaySessions, monthSessions });
      }
    }

    // Company-wide OVERALL snapshot
    const [totalRevMonth, totalClients] = await Promise.all([
      DeptTransaction.aggregate([
        { $match: { type: 'income', createdAt: { $gte: monthStart } } },
        { $group: { _id: '$departmentSlug', total: { $sum: '$amount' } } },
      ]),
      CRMClient.countDocuments({}),
    ]);
    const deptRevMap = {};
    totalRevMonth.forEach((r) => { deptRevMap[r._id] = r.total; });
    await saveSnapshot(null, 'OVERALL', { deptRevenue: deptRevMap, totalClients });

    console.log('[BI] Snapshot complete —', new Date().toISOString());
  } catch (err) {
    console.error('[BI] Snapshot error:', err.message);
  }
};
