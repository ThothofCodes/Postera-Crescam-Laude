// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const mongoose = require('mongoose');
const Revenue = require('../models/Revenue');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const safePage = (p) => Math.max(1, Math.min(Number(p) || 1, 1000));
const safeLimit = (l) => Math.max(1, Math.min(Number(l) || 30, 100));
const VALID_TYPES = ['income', 'expense'];
const VALID_CATS = ['booking', 'order', 'consultation', 'salary', 'rent', 'utilities', 'stock', 'marketing', 'other'];
const VALID_PAY = ['mpesa', 'cash', 'bank'];

exports.getRevenue = async (req, res, next) => {
  try {
    const page = safePage(req.query.page); const
      limit = safeLimit(req.query.limit);
    const query = {};
    if (req.query.type && VALID_TYPES.includes(req.query.type)) query.type = req.query.type;
    if (req.query.category && VALID_CATS.includes(req.query.category)) query.category = req.query.category;
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);
      if (Number.isNaN(query.date.$gte?.getTime()) || Number.isNaN(query.date.$lte?.getTime())) return res.status(400).json({ message: 'Invalid date format' });
    }
    const [entries, total] = await Promise.all([
      Revenue.find(query).populate('createdBy', 'name').sort('-date').skip((page - 1) * limit)
        .limit(limit),
      Revenue.countDocuments(query),
    ]);
    res.json({
      entries, total, page, pages: Math.ceil(total / limit),
    });
  } catch (err) { next(err); }
};

exports.getSummary = async (req, res, next) => {
  try {
    const year = Math.max(2020, Math.min(2100, Number(req.query.year) || new Date().getFullYear()));
    const summary = await Revenue.aggregate([
      { $match: { date: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } } },
      { $group: { _id: { month: { $month: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
      { $sort: { '_id.month': 1 } },
    ]);
    res.json(summary);
  } catch (err) { next(err); }
};

exports.createRevenue = async (req, res, next) => {
  try {
    const {
      type, category, description, amount, date, paymentMethod, reference,
    } = req.body;
    if (!VALID_TYPES.includes(type)) return res.status(400).json({ message: 'Invalid type' });
    if (!VALID_CATS.includes(category)) return res.status(400).json({ message: 'Invalid category' });
    if (!description || typeof description !== 'string') return res.status(400).json({ message: 'Description required' });
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0 || parsedAmount > 100_000_000) return res.status(400).json({ message: 'Valid amount required' });
    if (paymentMethod && !VALID_PAY.includes(paymentMethod)) return res.status(400).json({ message: 'Invalid payment method' });
    const entry = await Revenue.create({
      type,
      category,
      description: description.trim().slice(0, 500),
      amount: parsedAmount,
      date: date ? new Date(date) : new Date(),
      paymentMethod,
      reference: reference?.trim().slice(0, 100),
      createdBy: req.user._id,
      // FIX (Continuity Audit, Part Two): tag the entry to the creating
      // staff member's department so non-SUPER_ADMIN dashboards only ever
      // see their own department's figures. SUPER_ADMIN-created entries
      // (or accounts with no department) are tagged null, which is fine —
      // SUPER_ADMIN sees everything regardless, by design.
      department: req.user.department?._id || req.user.department || null,
    });
    res.status(201).json(entry);
  } catch (err) { next(err); }
};

exports.updateRevenue = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const entry = await Revenue.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json(entry);
  } catch (err) { next(err); }
};

exports.deleteRevenue = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    await Revenue.findByIdAndDelete(req.params.id);
    res.json({ message: 'Entry deleted' });
  } catch (err) { next(err); }
};
