// Copyright (c) 2026 Thoth of Codes. Business Intelligence Analytics Controller
const Analytics = require('../models/Analytics');

const isValidSlug = (s) => /^[a-z]+$/.test(s || '');

// GET /api/analytics — query BI snapshots
exports.getSnapshots = async (req, res, next) => {
  try {
    const {
      slug, metricGroup, period, from, to, limit = 30,
    } = req.query;
    const filter = {};
    if (slug && isValidSlug(slug)) filter.departmentSlug = slug;
    else if (req.user.role !== 'SUPER_ADMIN') filter.departmentSlug = req.user.departmentSlug;
    if (metricGroup) filter.metricGroup = metricGroup.toUpperCase();
    if (period) filter.period = period.toUpperCase();
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }
    const snapshots = await Analytics.find(filter)
      .sort({ date: -1 }).limit(Math.min(Number(limit), 365));
    res.json({ snapshots, total: snapshots.length });
  } catch (err) { next(err); }
};

// GET /api/analytics/summary — key KPIs for dashboard tiles
exports.getSummary = async (req, res, next) => {
  try {
    const slug = req.user.role === 'SUPER_ADMIN' ? (req.query.slug || null) : req.user.departmentSlug;
    const today = new Date().toISOString().slice(0, 10);
    const filter = { date: today, period: 'DAILY' };
    if (slug) filter.departmentSlug = slug;

    const snaps = await Analytics.find(filter);
    const by = (group) => snaps.find((s) => s.metricGroup === group)?.data || {};
    res.json({
      revenue: by('REVENUE'),
      clients: by('CLIENTS'),
      staff: by('STAFF'),
      tickets: by('TICKETS'),
      inventory: by('INVENTORY'),
      sessions: by('SESSIONS'),
      payments: by('PAYMENTS'),
      generatedAt: snaps[0]?.createdAt || null,
    });
  } catch (err) { next(err); }
};

// GET /api/analytics/departments — company-wide dept comparison
exports.getDeptComparison = async (req, res, next) => {
  try {
    const { period = 'MONTHLY', from, to } = req.query;
    const filter = { metricGroup: 'OVERALL', period: period.toUpperCase() };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }
    const data = await Analytics.find(filter).sort({ date: -1 }).limit(12);
    res.json({ comparison: data });
  } catch (err) { next(err); }
};

// POST /api/analytics/trigger — manually trigger snapshot (Super Admin only)
exports.triggerSnapshot = async (req, res, next) => {
  try {
    const { runBISnapshot } = require('../cron/biSnapshot');
    await runBISnapshot();
    res.json({ message: 'BI snapshot triggered successfully', timestamp: new Date() });
  } catch (err) { next(err); }
};
