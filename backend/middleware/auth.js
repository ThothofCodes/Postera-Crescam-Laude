// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActiveSession = require('../models/ActiveSession');
const AuditLog = require('../models/AuditLog');

// Fields to strip from audit log body
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'mpesaRef', 'cardNumber'];
const sanitizeBody = (body = {}) => {
  const clean = { ...body };
  SENSITIVE_FIELDS.forEach((f) => { if (clean[f]) clean[f] = '[REDACTED]'; });
  return clean;
};

// ── Verify JWT + Session Validation ──────────────────────────────────
exports.protect = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;
  if (!token) return res.status(401).json({ message: 'Not authorised — no token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    if (!decoded.id || !decoded.email || !decoded.role) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await User.findById(decoded.id).populate('department', 'name slug');
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    if (!user.isActive) return res.status(401).json({ message: 'Account deactivated' });

    if (user.email !== decoded.email) {
      return res.status(401).json({ message: 'Token is no longer valid' });
    }

    // ── Session validation (if jti exists in token) ──────────────────────
    if (decoded.jti) {
      const session = await ActiveSession.findOne({ jti: decoded.jti });
      if (!session) {
        // Session was killed (kicked by another login or force-logout)
        return res.status(401).json({
          message: 'Session expired. You were logged out due to a new login from another device.',
          code: 'SESSION_KILLED',
        });
      }

      // Update last activity
      session.lastActivityAt = new Date();
      await session.save({ validateBeforeSave: false });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired — please log in again' });
    }
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ── Super Admin ──────────────────────────────────────────────────────
exports.superAdminGuard = (req, res, next) => {
  const superEmail = process.env.SUPER_ADMIN_EMAIL || 'codeofthoth@outlook.com';
  if (req.user?.role !== 'SUPER_ADMIN' || req.user?.email !== superEmail) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

// ── Dept Head or Super Admin ─────────────────────────────────────────
exports.deptHeadGuard = (req, res, next) => {
  if (!['SUPER_ADMIN', 'DEPT_HEAD_OWNER'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

// ── Any authenticated staff ──────────────────────────────────────────
exports.staffGuard = (req, res, next) => {
  if (!['SUPER_ADMIN', 'DEPT_HEAD_OWNER', 'STAFF', 'admin', 'staff'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

// ── Product/Service management ───────────────────────────────────────
exports.deptAdminGuard = (req, res, next) => {
  if (!['SUPER_ADMIN', 'DEPT_HEAD_OWNER', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

// ── Staff management ─────────────────────────────────────────────────
exports.staffManagerGuard = (req, res, next) => {
  if (!['SUPER_ADMIN', 'DEPT_HEAD_OWNER', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

// ── STAFF read-only scope ────────────────────────────────────────────
exports.staffReadScope = (req, res, next) => {
  const role = req.user?.role;
  if (['SUPER_ADMIN', 'DEPT_HEAD_OWNER', 'admin'].includes(role)) return next();
  if (['STAFF', 'staff'].includes(role)) {
    req.deptFilter = { department: req.user.department?._id || req.user.department };
    return next();
  }
  return res.status(403).json({ message: 'Forbidden' });
};

// ── Dept scope isolation ─────────────────────────────────────────────
exports.deptScope = (req, res, next) => {
  if (req.user?.role === 'SUPER_ADMIN') return next();
  const requestedSlug = req.params.deptSlug || req.body.departmentSlug;
  if (requestedSlug && req.user?.departmentSlug !== requestedSlug) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  req.deptFilter = { department: req.user.department?._id || req.user.department };
  next();
};

// ── Role authorization middleware ─────────────────────────────────────
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. No user authenticated.' });
    }
    const userRole = req.user.role;
    const allowedRoles = roles.flat();
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// ── Legacy aliases ───────────────────────────────────────────────────
exports.admin = exports.superAdminGuard;
exports.staff = exports.staffGuard;

// ── Audit logger ─────────────────────────────────────────────────────
exports.auditLog = (action, resource) => async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode < 400) {
      try {
        await AuditLog.create({
          user: req.user?._id,
          userEmail: req.user?.email,
          department: req.user?.department?._id || req.user?.department,
          departmentSlug: req.user?.departmentSlug,
          action,
          resource,
          resourceId: req.params?.id,
          details: {
            method: req.method,
            path: req.path,
            body: sanitizeBody(req.body),
          },
          ip: req.ip,
        });
      } catch { /* non-blocking */ }
    }
  });
  next();
};
