// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Device Registration Model for session control
const mongoose = require('mongoose');
const crypto = require('crypto');

const RegisteredDeviceSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceHash: { type: String, required: true }, // SHA256 of fingerprintjs visitorId
  deviceName: { type: String, default: 'Unknown Device' },
  userAgent: { type: String, default: '' },
  lastSeenIp: { type: String, default: '' },
  lastSeenAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Compound index: one device per admin
RegisteredDeviceSchema.index({ admin: 1, deviceHash: 1 }, { unique: true });
RegisteredDeviceSchema.index({ admin: 1 });

// Static: hash a fingerprint before storing
RegisteredDeviceSchema.statics.hashFingerprint = function (fingerprint) {
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
};

// Max devices per admin
RegisteredDeviceSchema.statics.MAX_DEVICES = 2;

module.exports = mongoose.model('RegisteredDevice', RegisteredDeviceSchema);
