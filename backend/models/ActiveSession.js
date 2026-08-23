// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Active Session Model for device-limited concurrent sessions
const mongoose = require('mongoose');

const ActiveSessionSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceHash: { type: String, required: true },
  jti: { type: String, required: true }, // JWT ID claim
  userAgent: { type: String, default: '' },
  ip: { type: String, default: '' },
  lastActivityAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// Single indexes — no duplicates
ActiveSessionSchema.index({ admin: 1 });
ActiveSessionSchema.index({ jti: 1 }, { unique: true });

module.exports = mongoose.model('ActiveSession', ActiveSessionSchema);
