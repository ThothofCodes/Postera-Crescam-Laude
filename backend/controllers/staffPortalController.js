// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const mongoose = require('mongoose');
const { Memo, Assessment } = require('../models/StaffPortal');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const today = () => new Date().toISOString().slice(0, 10);

// ── MEMOS ─────────────────────────────────────────────────────────────────
exports.getMemos = async (req, res, next) => {
  try {
    const filter = { departmentSlug: req.user.departmentSlug };
    if (req.user.role === 'STAFF') {
      filter.status = 'PUBLISHED';
      filter.$or = [{ recipients: 'ALL' }, { recipients: req.user._id }];
    }
    const memos = await Memo.find(filter).populate('author', 'name').sort('-createdAt').limit(50);
    res.json(memos);
  } catch (err) { next(err); }
};

exports.createMemo = async (req, res, next) => {
  try {
    const {
      title, body, priority, recipients, requiresAck, ackDeadline, scheduledAt,
    } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'Title and body required' });
    const memo = await Memo.create({
      department: req.user.department?._id || req.user.department,
      departmentSlug: req.user.departmentSlug,
      author: req.user._id,
      title: title.trim().slice(0, 120),
      body,
      priority: priority || 'ROUTINE',
      recipients: recipients || 'ALL',
      requiresAck: requiresAck || false,
      ackDeadline: ackDeadline ? new Date(ackDeadline) : undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      status: scheduledAt ? 'DRAFT' : 'PUBLISHED',
      publishedAt: scheduledAt ? undefined : new Date(),
    });
    res.status(201).json(memo);
  } catch (err) { next(err); }
};

exports.acknowledgeMemo = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const memo = await Memo.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: { userId: req.user._id, readAt: new Date() } } },
      { new: true },
    );
    if (!memo) return res.status(404).json({ message: 'Memo not found' });
    res.json({ message: 'Acknowledged' });
  } catch (err) { next(err); }
};

exports.archiveMemo = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const memo = await Memo.findByIdAndUpdate(req.params.id, { status: 'ARCHIVED' }, { new: true });
    if (!memo) return res.status(404).json({ message: 'Memo not found' });
    res.json(memo);
  } catch (err) { next(err); }
};

// ── ASSESSMENTS ───────────────────────────────────────────────────────────
exports.getAssessments = async (req, res, next) => {
  try {
    const filter = { departmentSlug: req.user.departmentSlug };
    if (req.user.role === 'STAFF') filter.staffId = req.user._id;
    if (req.query.date) filter.date = req.query.date;
    if (req.query.staffId && isValidId(req.query.staffId)) filter.staffId = req.query.staffId;
    const assessments = await Assessment.find(filter).populate('staffId', 'name').sort('-date').limit(100);
    res.json(assessments);
  } catch (err) { next(err); }
};

exports.getTodayAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({ staffId: req.user._id, date: today() });
    res.json(assessment || { date: today(), status: 'PENDING_LOG' });
  } catch (err) { next(err); }
};

exports.submitWorkLog = async (req, res, next) => {
  try {
    const {
      tasks, blockers, hoursWorked, notes,
    } = req.body;
    if (!tasks) return res.status(400).json({ message: 'Tasks completed is required' });
    const deptId = req.user.department?._id || req.user.department;
    const assessment = await Assessment.findOneAndUpdate(
      { staffId: req.user._id, date: today() },
      {
        $set: {
          department: deptId,
          departmentSlug: req.user.departmentSlug,
          adminId: req.user._id,
          workLog: {
            tasks: tasks.slice(0, 2000),
            blockers: blockers?.slice(0, 1000),
            hoursWorked: Number(hoursWorked) || 0,
            notes: notes?.slice(0, 1000),
          },
          logSubmittedAt: new Date(),
          status: 'LOG_SUBMITTED',
        },
      },
      { upsert: true, new: true },
    );
    res.json(assessment);
  } catch (err) { next(err); }
};

exports.scoreAssessment = async (req, res, next) => {
  try {
    const {
      staffId, date, kpiScores, adminComments, adminFeedback,
    } = req.body;
    if (!isValidId(staffId)) return res.status(400).json({ message: 'Invalid staff ID' });
    if (!kpiScores?.length) return res.status(400).json({ message: 'KPI scores required' });
    const composite = kpiScores.reduce((sum, k) => sum + (Number(k.score) * (Number(k.weight) || 1)), 0)
                      / kpiScores.reduce((sum, k) => sum + (Number(k.weight) || 1), 0);
    const deptId = req.user.department?._id || req.user.department;
    const assessment = await Assessment.findOneAndUpdate(
      { staffId, date: date || today() },
      {
        $set: {
          department: deptId,
          departmentSlug: req.user.departmentSlug,
          adminId: req.user._id,
          kpiScores,
          compositeScore: Math.round(composite * 10) / 10,
          adminComments: adminComments?.slice(0, 2000),
          adminFeedback: adminFeedback?.slice(0, 1000),
          status: 'ASSESSED',
        },
      },
      { upsert: true, new: true },
    );
    res.json(assessment);
  } catch (err) { next(err); }
};

exports.getPerformanceHistory = async (req, res, next) => {
  try {
    const staffId = req.user.role === 'STAFF' ? req.user._id : req.query.staffId;
    if (!isValidId(staffId)) return res.status(400).json({ message: 'Invalid staff ID' });
    const assessments = await Assessment.find({ staffId }).sort('-date').limit(30).select('date compositeScore adminFeedback status');
    res.json(assessments);
  } catch (err) { next(err); }
};
