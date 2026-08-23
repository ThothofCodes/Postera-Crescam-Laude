// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Device Registration & Session Management Routes
const router = require('express').Router();
const crypto = require('crypto');
const RegisteredDevice = require('../models/RegisteredDevice');
const ActiveSession = require('../models/ActiveSession');
const { protect, superAdminGuard } = require('../middleware/auth');

// ── Helper: SHA256 hash ──────────────────────────────────────────────
const hashFingerprint = (fp) => crypto.createHash('sha256').update(fp).digest('hex');

// ── Register a new device (super admin only) ─────────────────────────
// POST /api/devices/register
router.post('/register', protect, superAdminGuard, async (req, res) => {
  try {
    const { adminId, deviceFingerprint, deviceName } = req.body;

    if (!adminId || !deviceFingerprint) {
      return res.status(400).json({ message: 'adminId and deviceFingerprint required' });
    }

    // Check device limit
    const existingCount = await RegisteredDevice.countDocuments({ admin: adminId, isActive: true });
    if (existingCount >= RegisteredDevice.MAX_DEVICES) {
      return res.status(403).json({
        message: `Device limit reached (${RegisteredDevice.MAX_DEVICES} max). Deregister an existing device first.`,
      });
    }

    const deviceHash = hashFingerprint(deviceFingerprint);

    // Upsert — if already registered, just update last seen
    const device = await RegisteredDevice.findOneAndUpdate(
      { admin: adminId, deviceHash },
      {
        $setOnInsert: { deviceName: deviceName || 'Unknown Device', isActive: true },
        $set: { lastSeenIp: req.ip, lastSeenAt: new Date() },
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Device registered', device: { id: device._id, name: device.deviceName, registeredAt: device.createdAt } });
  } catch (err) {
    console.error('Device registration error:', err);
    res.status(500).json({ message: 'Failed to register device' });
  }
});

// ── List registered devices for an admin ──────────────────────────────
// GET /api/devices/admin/:adminId
router.get('/admin/:adminId', protect, superAdminGuard, async (req, res) => {
  try {
    const devices = await RegisteredDevice.find({ admin: req.params.adminId, isActive: true })
      .sort({ lastSeenAt: -1 });

    // Also get active sessions
    const sessions = await ActiveSession.find({ admin: req.params.adminId })
      .select('deviceHash lastActivityAt ip userAgent expiresAt');

    // Merge devices with their session status
    const result = devices.map((d) => {
      const session = sessions.find((s) => s.deviceHash === d.deviceHash);
      return {
        id: d._id,
        name: d.deviceName,
        deviceHash: d.deviceHash,
        registeredAt: d.createdAt,
        lastSeenAt: d.lastSeenAt,
        lastSeenIp: d.lastSeenIp,
        isOnline: !!session,
        sessionId: session?._id,
        sessionExpiresAt: session?.expiresAt,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('List devices error:', err);
    res.status(500).json({ message: 'Failed to list devices' });
  }
});

// ── Deregister a device ──────────────────────────────────────────────
// DELETE /api/devices/:deviceId
router.delete('/:deviceId', protect, superAdminGuard, async (req, res) => {
  try {
    const device = await RegisteredDevice.findById(req.params.deviceId);
    if (!device) return res.status(404).json({ message: 'Device not found' });

    // Kill any active session for this device
    await ActiveSession.deleteMany({ admin: device.admin, deviceHash: device.deviceHash });

    // Soft delete the device
    device.isActive = false;
    await device.save();

    res.json({ message: 'Device deregistered and session terminated' });
  } catch (err) {
    console.error('Deregister device error:', err);
    res.status(500).json({ message: 'Failed to deregister device' });
  }
});

// ── Force logout all sessions for an admin ────────────────────────────
// POST /api/devices/force-logout/:adminId
router.post('/force-logout/:adminId', protect, superAdminGuard, async (req, res) => {
  try {
    const result = await ActiveSession.deleteMany({ admin: req.params.adminId });
    res.json({ message: 'All sessions terminated', count: result.deletedCount });
  } catch (err) {
    console.error('Force logout error:', err);
    res.status(500).json({ message: 'Failed to force logout' });
  }
});

// ── Self-service: check my devices ────────────────────────────────────
// GET /api/devices/my
router.get('/my', protect, async (req, res) => {
  try {
    const devices = await RegisteredDevice.find({ admin: req.user._id, isActive: true })
      .sort({ lastSeenAt: -1 });

    const sessions = await ActiveSession.find({ admin: req.user._id })
      .select('deviceHash lastActivityAt expiresAt');

    const result = devices.map((d) => {
      const session = sessions.find((s) => s.deviceHash === d.deviceHash);
      return {
        id: d._id,
        name: d.deviceName,
        registeredAt: d.createdAt,
        lastSeenAt: d.lastSeenAt,
        isOnline: !!session,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list devices' });
  }
});

module.exports = router;
