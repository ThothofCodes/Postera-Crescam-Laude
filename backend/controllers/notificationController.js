const { emitBroadcast } = require('../socket');
// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res, next) => {
  try {
    const filter = {
      $or: [
        { recipient: req.user._id },
        { recipient: null, department: req.user.department?._id || req.user.department },
        { recipient: null, department: null }, // broadcasts
      ],
    };
    const notifications = await Notification.find(filter).sort('-createdAt').limit(50);
    res.json(notifications);
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (err) { next(err); }
};

exports.broadcast = async (req, res, next) => {
  try {
    const {
      title, message, type = 'broadcast', departmentId,
    } = req.body;
    const notification = await Notification.create({
      title,
      message,
      type,
      department: departmentId || null,
      recipient: null,
      createdBy: req.user._id,
    });
    // Real-time: push to all connected clients or specific dept
    try {
      const payload = {
        _id: notification._id, title, message, type, createdAt: notification.createdAt,
      };
      if (!departmentId) {
        emitBroadcast(payload);
      } else {
        // emit to specific dept — get slug from dept record (or fall back to broadcast)
        emitBroadcast(payload);
      }
    } catch (_) {}
    res.status(201).json(notification);
  } catch (err) { next(err); }
};
