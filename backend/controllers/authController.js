// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const RegisteredDevice = require('../models/RegisteredDevice');
const ActiveSession = require('../models/ActiveSession');

// Sign token — algorithm explicitly pinned to HS256, includes jti for session tracking
const signToken = (user, jti) => jwt.sign(
  {
    id: user._id,
    email: user.email,
    role: user.role,
    departmentId: user.department?._id || user.department || null,
    departmentSlug: user.departmentSlug || null,
    isOwner: user.isOwner || false,
    jti, // JWT ID for session invalidation
  },
  process.env.JWT_SECRET,
  {
    expiresIn: process.env.JWT_EXPIRE || '8h',
    algorithm: 'HS256',
  },
);

// Validate email format
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// SHA256 hash for device fingerprints
const hashFingerprint = (fp) => crypto.createHash('sha256').update(fp).digest('hex');

exports.verifyToken = async (req, res, next) => {
  try {
    const { token, userId } = req.body;

    if (!token || !userId) {
      return res.status(400).json({ message: 'Token and user ID required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const isTokenValid = hashedToken === user.passwordResetToken;
    const isTokenExpired = user.tokenExpiry && user.tokenExpiry < new Date();

    if (!isTokenValid || isTokenExpired) {
      return res.status(400).json({
        message: 'Invalid or expired token',
        valid: false,
      });
    }

    res.json({
      valid: true,
      message: 'Token is valid',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.setPassword = async (req, res, next) => {
  try {
    const { token, userId, password } = req.body;

    if (!token || !userId || !password) {
      return res.status(400).json({ message: 'Token, user ID, and password required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const isTokenValid = hashedToken === user.passwordResetToken;
    const isTokenExpired = user.tokenExpiry && user.tokenExpiry < new Date();

    if (!isTokenValid || isTokenExpired) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.tokenExpiry = undefined;
    user.isActive = true;
    user.isEmailVerified = true;

    await user.save();

    res.json({
      message: 'Password set successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.register = async (req, res, next) => {
  try {
    const {
      name, email, password, role, department, departmentSlug, isOwner,
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Valid email address required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    if (role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      department,
      departmentSlug,
      isOwner,
    });

    res.status(201).json({
      token: signToken(user, crypto.randomUUID()),
      user: {
        id: user._id, name: user.name, email: user.email, role: user.role, departmentSlug: user.departmentSlug,
      },
    });
  } catch (err) { next(err); }
};

// ── Enhanced Login with Device Checking + Session Kick ──────────────────
exports.login = async (req, res, next) => {
  try {
    const {
      email, password, deviceFingerprint, deviceName,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid input' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .populate('department', 'name slug');

    // Timing-attack prevention
    const dummyHash = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
    const passwordMatch = user
      ? await user.matchPassword(password)
      : await require('bcryptjs').compare(password, dummyHash);

    if (!user || !passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated — contact your administrator' });
    }

    // ── Device fingerprint check + auto-registration ─────────────────────
    let deviceHash = null;

    if (deviceFingerprint) {
      deviceHash = hashFingerprint(deviceFingerprint);

      // Check if this user has ANY registered devices
      const totalDevices = await RegisteredDevice.countDocuments({ admin: user._id, isActive: true });

      if (totalDevices === 0) {
        // First device — auto-register it
        await RegisteredDevice.create({
          admin: user._id,
          deviceHash,
          deviceName: deviceName || 'First Device',
          lastSeenIp: req.ip,
          lastSeenAt: new Date(),
          userAgent: req.headers['user-agent'] || '',
        });
        console.log(`[DEVICE] Auto-registered first device for ${user.email}`);
      } else if (totalDevices < RegisteredDevice.MAX_DEVICES) {
        // User has fewer than MAX_DEVICES registered — check if this is already registered
        const existingDevice = await RegisteredDevice.findOne({
          admin: user._id,
          deviceHash,
          isActive: true,
        });

        if (existingDevice) {
          // Device already registered — update last seen
          existingDevice.lastSeenAt = new Date();
          existingDevice.lastSeenIp = req.ip;
          existingDevice.userAgent = req.headers['user-agent'] || '';
          await existingDevice.save();
        } else {
          // New device — auto-register it (within limit)
          await RegisteredDevice.create({
            admin: user._id,
            deviceHash,
            deviceName: deviceName || `Device ${totalDevices + 1}`,
            lastSeenIp: req.ip,
            lastSeenAt: new Date(),
            userAgent: req.headers['user-agent'] || '',
          });
          console.log(`[DEVICE] Auto-registered device ${totalDevices + 1}/${RegisteredDevice.MAX_DEVICES} for ${user.email}`);
        }
      } else {
        // User has MAX_DEVICES registered — check if THIS device is one of them
        const device = await RegisteredDevice.findOne({
          admin: user._id,
          deviceHash,
          isActive: true,
        });

        if (!device) {
          return res.status(403).json({
            message: `Device limit reached (${RegisteredDevice.MAX_DEVICES} max). Contact your Super Admin to register a new device.`,
            code: 'DEVICE_NOT_REGISTERED',
          });
        }

        // Update device last seen
        device.lastSeenAt = new Date();
        device.lastSeenIp = req.ip;
        device.userAgent = req.headers['user-agent'] || '';
        await device.save();
      }
    }

    // ── Kick existing sessions (enforce 1 concurrent session) ────────────
    if (deviceHash) {
      // Delete ALL existing sessions for this user (kicks other devices)
      await ActiveSession.deleteMany({ admin: user._id });

      // Create new session
      const jti = crypto.randomUUID();
      const expiresIn = parseInt(process.env.JWT_EXPIRE_HOURS || '8', 10);
      const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);

      await ActiveSession.create({
        admin: user._id,
        deviceHash,
        jti,
        userAgent: req.headers['user-agent'] || '',
        ip: req.ip,
        expiresAt,
      });

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      return res.json({
        token: signToken(user, jti),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          departmentSlug: user.departmentSlug,
          isOwner: user.isOwner,
        },
        session: { jti, expiresAt },
      });
    }

    // ── Fallback: no device fingerprint (backward compatible) ─────────────
    // Also kick old sessions and create a new one (same as device path)
    await ActiveSession.deleteMany({ admin: user._id });

    const jti = crypto.randomUUID();
    const expiresIn = parseInt(process.env.JWT_EXPIRE_HOURS || '8', 10);
    const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);

    await ActiveSession.create({
      admin: user._id,
      deviceHash: 'no-fingerprint',
      jti,
      userAgent: req.headers['user-agent'] || '',
      ip: req.ip,
      expiresAt,
    });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      token: signToken(user, jti),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        departmentSlug: user.departmentSlug,
        isOwner: user.isOwner,
      },
    });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('department', 'name slug logoUrl')
      .select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};
