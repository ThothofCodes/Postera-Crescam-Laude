// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// LiveKit Meeting Routes — Room creation, token generation, scheduling

const express = require('express');

const router = express.Router();
const { protect, superAdminGuard } = require('../middleware/auth');

// LiveKit server SDK
const {
  AccessToken,
  RoomServiceClient,
  WebhookReceiver,
} = require('livekit-server-sdk');

const Room = require('../models/Meeting');

// ── LiveKit Config ───────────────────────────────────────────────────────
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';
const LIVEKIT_WS_URL = process.env.LIVEKIT_WS_URL || LIVEKIT_URL.replace(/^http/, 'ws');

const isConfigured = !!(LIVEKIT_API_KEY && LIVEKIT_API_SECRET);

function getRoomService() {
  if (!isConfigured) throw new Error('LiveKit not configured. Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET.');
  return new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
}

function generateToken(roomName, identity, name, role) {
  if (!isConfigured) throw new Error('LiveKit not configured.');
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name,
    ttl: 60 * 60 * 4, // 4 hours
  });
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  // Add metadata with role info
  at.metadata = JSON.stringify({ role: role || 'STAFF', displayName: name });
  return at.toJwt();
}

// ── Create Room ──────────────────────────────────────────────────────────
router.post('/rooms', protect, async (req, res) => {
  try {
    const {
      title, description, scheduledAt, duration,
      department, participants, isRecurring,
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Meeting title is required' });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 48);
    const roomName = `pcl-${slug}-${Date.now()}`;

    const room = await Room.create({
      roomName,
      title,
      description: description || '',
      scheduledAt: scheduledAt || null,
      duration: duration || 60,
      department: department || null,
      participants: participants || [],
      isRecurring: isRecurring || false,
      host: req.user._id,
      hostName: req.user.name,
      status: 'SCHEDULED',
    });

    // Create the LiveKit room if server is configured
    if (isConfigured) {
      try {
        const svc = getRoomService();
        await svc.createRoom({
          name: roomName,
          emptyTimeout: 60 * 5, // 5 min timeout when empty
          maxParticipants: 50,
        });
      } catch { /* Room will be created on first join */ }
    }

    res.status(201).json({
      message: 'Meeting room created',
      room,
      joinUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/meeting/${room._id}`,
    });
  } catch (err) {
    console.error('Create meeting error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── List Rooms ───────────────────────────────────────────────────────────
router.get('/rooms', protect, async (req, res) => {
  try {
    const { status, department, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;

    const rooms = await Room.find(filter)
      .populate('host', 'name email role')
      .populate('participants', 'name email role department')
      .sort({ scheduledAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    const total = await Room.countDocuments(filter);

    res.json({ rooms, total, page: parseInt(page, 10) });
  } catch (err) {
    console.error('List meetings error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── Get Single Room ──────────────────────────────────────────────────────
router.get('/rooms/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('host', 'name email role')
      .populate('participants', 'name email role department');
    if (!room) return res.status(404).json({ message: 'Meeting not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Join Room (get token) ────────────────────────────────────────────────
router.post('/rooms/:id/join', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Meeting not found' });

    const identity = `${req.user._id}-${Date.now()}`;
    const token = generateToken(
      room.roomName,
      identity,
      req.user.name,
      req.user.role,
    );

    // Update room status
    if (room.status === 'SCHEDULED') {
      room.status = 'ACTIVE';
      room.startedAt = new Date();
      await room.save();
    }

    // Add user to participants if not already there
    if (!room.participants.includes(req.user._id)) {
      room.participants.push(req.user._id);
      await room.save();
    }

    res.json({
      token,
      wsUrl: LIVEKIT_WS_URL,
      roomName: room.roomName,
      room,
    });
  } catch (err) {
    console.error('Join meeting error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── End Meeting ──────────────────────────────────────────────────────────
router.post('/rooms/:id/end', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Meeting not found' });

    room.status = 'ENDED';
    room.endedAt = new Date();
    await room.save();

    // Delete LiveKit room if configured
    if (isConfigured) {
      try {
        const svc = getRoomService();
        await svc.deleteRoom(room.roomName);
      } catch { /* Best effort */ }
    }

    res.json({ message: 'Meeting ended' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Delete Meeting ───────────────────────────────────────────────────────
router.delete('/rooms/:id', protect, superAdminGuard, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Meeting not found' });

    // Delete LiveKit room if configured
    if (isConfigured && room.status === 'ACTIVE') {
      try {
        const svc = getRoomService();
        await svc.deleteRoom(room.roomName);
      } catch { /* Best effort */ }
    }

    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Meeting deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── LiveKit Webhook ──────────────────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/webhook+protobuf' }), async (req, res) => {
  if (!isConfigured) return res.status(200).json({ ok: true });
  try {
    const receiver = new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    const event = await receiver.receive(req.body, req.headers);
    console.log('[LiveKit Webhook]', event.event);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('LiveKit webhook error:', err.message);
    res.status(200).json({ ok: true }); // Always 200 for webhooks
  }
});

// ── Status ───────────────────────────────────────────────────────────────
router.get('/status', protect, (req, res) => {
  res.json({
    configured: isConfigured,
    wsUrl: LIVEKIT_WS_URL,
    features: ['video', 'audio', 'screen-share', 'chat', 'recording'],
  });
});

module.exports = router;
