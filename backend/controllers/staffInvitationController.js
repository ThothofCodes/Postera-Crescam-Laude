// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const crypto = require('crypto');
const User = require('../models/User');
const Department = require('../models/Department');
const CompanyEmail = require('../models/CompanyEmail');
const { sendEmail } = require('../config/mailer');

const isValidId = (id) => require('mongoose').Types.ObjectId.isValid(id);

// Suggest email string from name + dept slug
function suggestEmail(name, slug) {
  const first = (name || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 20) || 'user';
  return `${first}.${slug}@pclsolutions.co.ke`;
}

// Create staff invitation
exports.inviteStaff = async (req, res, next) => {
  try {
    const {
      name, email, departmentSlug, role,
    } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Valid email address required' });
    }

    if (!departmentSlug) {
      return res.status(400).json({ message: 'Department slug required' });
    }

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // For dept heads, they can only invite staff in their own department
    if (req.user.role === 'DEPT_HEAD_OWNER') {
      if (departmentSlug !== req.user.departmentSlug) {
        return res.status(403).json({ message: 'You can only invite staff to your own department' });
      }
      // Dept heads can only create STAFF role
      if (role && role !== 'STAFF') {
        return res.status(403).json({ message: 'Department heads can only invite STAFF members' });
      }
    }

    // Find department
    const department = await Department.findOne({ slug: departmentSlug });
    if (!department) {
      return res.status(404).json({ message: `Department '${departmentSlug}' not found` });
    }

    // Create temporary user with pending status
    const tempPassword = crypto.randomBytes(12).toString('hex'); // Temporary password
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: tempPassword, // Will be changed on first login
      role: role || 'STAFF',
      department: department._id,
      departmentSlug,
      isActive: false, // User is inactive until they set their password
      isEmailVerified: false, // Mark as unverified initially
    });

    // Create company email record
    const suggestedEmail = suggestEmail(name, departmentSlug);
    const companyEmail = await CompanyEmail.create({
      companyEmail: suggestedEmail,
      linkedUserId: user._id,
      departmentId: department._id,
      departmentSlug,
      status: 'PENDING',
    });

    // Generate token for password setup
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Update user with password reset token
    user.passwordResetToken = hashedToken;
    user.tokenExpiry = new Date(Date.now() + 24 * 3600000); // 24 hours
    await user.save();

    // Send invitation email
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to Postera Crescam Laude — Staff Invitation',
        html: `
          <h2>Welcome, ${name}!</h2>
          <p>You have been invited to join Postera Crescam Laude as a staff member.</p>
          <p>Please set your password using the link below (valid for 24 hours):</p>
          <p><a href="${process.env.CLIENT_URL}/staff/set-password?token=${token}&userId=${user._id}">
            Set Your Password →
          </a></p>
          <p>After setting your password, you can access your staff portal at: 
          <a href="${process.env.CLIENT_URL}/staff/${departmentSlug}/dashboard">Staff Dashboard</a></p>
          <p>If you have any questions, please contact your department head.</p>
        `,
      });
    } catch (emailErr) {
      console.error('Failed to send invitation email:', emailErr);
      // Don't fail the whole operation if email fails
    }

    res.status(201).json({
      message: 'Staff invitation sent successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentSlug: user.departmentSlug,
        invitedAt: user.createdAt,
      },
      companyEmail: companyEmail.companyEmail,
    });
  } catch (err) {
    next(err);
  }
};

// Get pending invitations
exports.getPendingInvitations = async (req, res, next) => {
  try {
    // Dept heads can only see invitations for their department
    const filter = req.user.role === 'DEPT_HEAD_OWNER'
      ? { departmentSlug: req.user.departmentSlug }
      : {};

    const pendingUsers = await User.find({
      ...filter,
      isActive: false,
      isEmailVerified: false,
    }).populate('department', 'name slug').select('-password').sort('-createdAt');

    res.json({
      invitations: pendingUsers,
      total: pendingUsers.length,
    });
  } catch (err) {
    next(err);
  }
};

// Resend invitation
exports.resendInvitation = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!isValidId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check authorization
    if (req.user.role === 'DEPT_HEAD_OWNER' && user.departmentSlug !== req.user.departmentSlug) {
      return res.status(403).json({ message: 'You can only resend invitations for your own department' });
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    user.passwordResetToken = hashedToken;
    user.tokenExpiry = new Date(Date.now() + 24 * 3600000); // 24 hours
    await user.save();

    // Resend invitation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Postera Crescam Laude — Staff Invitation (Reminder)',
        html: `
          <h2>Welcome back, ${user.name}!</h2>
          <p>This is a reminder that you have been invited to join Postera Crescam Laude as a staff member.</p>
          <p>Please set your password using the link below (valid for 24 hours):</p>
          <p><a href="${process.env.CLIENT_URL}/staff/set-password?token=${token}&userId=${user._id}">
            Set Your Password →
          </a></p>
          <p>After setting your password, you can access your staff portal at: 
          <a href="${process.env.CLIENT_URL}/staff/${user.departmentSlug}/dashboard">Staff Dashboard</a></p>
          <p>If you have any questions, please contact your department head.</p>
        `,
      });
    } catch (emailErr) {
      console.error('Failed to resend invitation email:', emailErr);
    }

    res.json({ message: 'Invitation resent successfully' });
  } catch (err) {
    next(err);
  }
};

// Cancel invitation
exports.cancelInvitation = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!isValidId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check authorization
    if (req.user.role === 'DEPT_HEAD_OWNER' && user.departmentSlug !== req.user.departmentSlug) {
      return res.status(403).json({ message: 'You can only cancel invitations for your own department' });
    }

    // Check if user has already activated their account
    if (user.isActive || user.isEmailVerified) {
      return res.status(400).json({ message: 'Cannot cancel invitation for an active user' });
    }

    // Delete the user record
    await User.findByIdAndDelete(userId);

    // Also delete any associated company email record
    await CompanyEmail.deleteMany({ linkedUserId: userId });

    res.json({ message: 'Staff invitation cancelled successfully' });
  } catch (err) {
    next(err);
  }
};

// Get staff directory
exports.getStaffDirectory = async (req, res, next) => {
  try {
    const { departmentSlug, role, isActive } = req.query;
    const filter = { role: { $in: ['STAFF', 'DEPT_HEAD_OWNER'] } }; // Only staff roles

    if (departmentSlug) filter.departmentSlug = departmentSlug;
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Dept heads can only see their own department
    if (req.user.role === 'DEPT_HEAD_OWNER') {
      filter.departmentSlug = req.user.departmentSlug;
    }

    const staff = await User.find(filter)
      .populate('department', 'name slug')
      .select('-password -passwordResetToken -tokenExpiry')
      .sort('name');

    res.json({
      staff,
      total: staff.length,
    });
  } catch (err) {
    next(err);
  }
};
