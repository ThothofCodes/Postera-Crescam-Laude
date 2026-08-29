// Copyright (c) 2026 Thoth of Codes.
const CompanyEmail = require('../models/CompanyEmail');
const User = require('../models/User');
const { sendEmail } = require('../config/mailer');

const isValidId = (id) => require('mongoose').Types.ObjectId.isValid(id);
const genToken = () => require('crypto').randomBytes(32).toString('hex');

// Suggest email string from name + dept slug
function suggestEmail(name, slug) {
  const first = (name || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 20) || 'user';
  return `${first}.${slug}@pclsolutions.co.ke`;
}

// POST /api/email/request — Dept head requests email for a staff user
exports.requestEmail = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!isValidId(userId)) return res.status(400).json({ message: 'Invalid user ID' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.departmentSlug !== req.user.departmentSlug && req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ message: 'Cannot request email for staff in another department' });
    const existing = await CompanyEmail.findOne({ linkedUserId: userId });
    if (existing) return res.status(400).json({ message: 'Email already exists or requested', email: existing });
    const dept = await require('../models/Department').findOne({ slug: user.departmentSlug });
    const suggested = suggestEmail(user.name, user.departmentSlug);
    const record = await CompanyEmail.create({
      companyEmail: suggested,
      linkedUserId: userId,
      departmentId: dept?._id,
      departmentSlug: user.departmentSlug,
      status: 'PENDING',
    });
    res.status(201).json({ message: 'Email request submitted', record });
  } catch (err) { next(err); }
};

// GET /api/email/queue — Super Admin views pending requests
exports.getQueue = async (req, res, next) => {
  try {
    const queue = await CompanyEmail.find({ status: 'PENDING' })
      .populate('linkedUserId', 'name email departmentSlug')
      .sort('-createdAt');
    res.json({ queue, total: queue.length });
  } catch (err) { next(err); }
};

// GET /api/email/directory — Full active email directory
exports.getDirectory = async (req, res, next) => {
  try {
    const { slug, status } = req.query;
    const filter = {};
    if (slug) filter.departmentSlug = slug;
    if (status) filter.status = status;
    else filter.status = { $ne: 'REVOKED' };
    const emails = await CompanyEmail.find(filter)
      .populate('linkedUserId', 'name email role')
      .sort('departmentSlug companyEmail');
    res.json({ emails, total: emails.length });
  } catch (err) { next(err); }
};

// POST /api/email/provision/:requestId — Approve & provision
exports.provision = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { companyEmail } = req.body; // allow Super Admin to edit suggested address
    if (!isValidId(requestId)) return res.status(400).json({ message: 'Invalid ID' });
    const record = await CompanyEmail.findById(requestId).populate('linkedUserId');
    if (!record) return res.status(404).json({ message: 'Request not found' });
    if (record.status !== 'PENDING') return res.status(400).json({ message: 'Not a pending request' });
    const finalEmail = companyEmail || record.companyEmail;
    const duplicate = await CompanyEmail.findOne({ companyEmail: finalEmail, _id: { $ne: requestId } });
    if (duplicate) return res.status(400).json({ message: 'Email address already taken' });
    const token = genToken();
    record.companyEmail = finalEmail;
    record.status = 'ACTIVE';
    record.provisionedBy = req.user.id;
    record.provisionedAt = new Date();
    record.passwordResetToken = require('crypto').createHash('sha256').update(token).digest('hex');
    record.tokenExpiry = new Date(Date.now() + 24 * 3600000);
    await record.save();
    // Update the User document with their company email
    await User.findByIdAndUpdate(record.linkedUserId, { email: finalEmail });
    // Send welcome email
    try {
      await sendEmail({
        to: finalEmail,
        subject: 'Welcome to Postera Crescam Laude — Your Company Account',
        html: `<h2>Welcome, ${record.linkedUserId?.name || 'Team Member'}!</h2>
               <p>Your company email has been provisioned: <strong>${finalEmail}</strong></p>
               <p>Set your password here (link expires in 24 hours):</p>
               <p><a href="${process.env.CLIENT_URL}/staff/set-password?token=${token}">Set Password →</a></p>
               <p>After setting your password, log in at: <a href="${process.env.CLIENT_URL}/staff/${record.departmentSlug}/dashboard">Staff Portal</a></p>`,
      });
    } catch (_) { /* email delivery failure is non-fatal */ }
    res.json({ message: 'Email provisioned', companyEmail: finalEmail });
  } catch (err) { next(err); }
};

// POST /api/email/reject/:requestId — Reject with reason
exports.reject = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    if (!isValidId(requestId)) return res.status(400).json({ message: 'Invalid ID' });
    const record = await CompanyEmail.findById(requestId);
    if (!record) return res.status(404).json({ message: 'Request not found' });
    record.status = 'REVOKED';
    record.revocationReason = reason || 'Rejected by Super Admin';
    record.retentionExpiresAt = new Date(Date.now() + 30 * 86400000);
    await record.save();
    res.json({ message: 'Request rejected' });
  } catch (err) { next(err); }
};

// PATCH /api/email/suspend/:emailId
exports.suspend = async (req, res, next) => {
  try {
    const record = await CompanyEmail.findByIdAndUpdate(
      req.params.emailId,
      { status: 'SUSPENDED' },
      { new: true },
    );
    if (!record) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Email suspended', record });
  } catch (err) { next(err); }
};

// DELETE /api/email/revoke/:emailId
exports.revoke = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const record = await CompanyEmail.findByIdAndUpdate(
      req.params.emailId,
      {
        status: 'REVOKED',
        revocationReason: reason || 'Revoked by Super Admin',
        retentionExpiresAt: new Date(Date.now() + 30 * 86400000),
      },
      { new: true },
    );
    if (!record) return res.status(404).json({ message: 'Not found' });
    // Lock the user account
    await User.findByIdAndUpdate(record.linkedUserId, { isActive: false });
    res.json({ message: 'Email revoked', record });
  } catch (err) { next(err); }
};

// POST /api/email/reset-password/:emailId
exports.resetPassword = async (req, res, next) => {
  try {
    const record = await CompanyEmail.findById(req.params.emailId).populate('linkedUserId', 'name');
    if (!record) return res.status(404).json({ message: 'Not found' });
    const token = genToken();
    record.passwordResetToken = require('crypto').createHash('sha256').update(token).digest('hex');
    record.tokenExpiry = new Date(Date.now() + 24 * 3600000);
    await record.save();
    try {
      await sendEmail({
        to: record.companyEmail,
        subject: 'PCL — Password Reset Link',
        html: `<p>Hi ${record.linkedUserId?.name},</p>
               <p><a href="${process.env.CLIENT_URL}/staff/set-password?token=${token}">Reset your password →</a></p>
               <p>This link expires in 24 hours.</p>`,
      });
    } catch (_) {}
    res.json({ message: 'Password reset email sent' });
  } catch (err) { next(err); }
};
