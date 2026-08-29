// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Webhook Secret Model for Zero-Downtime Rotation
const mongoose = require('mongoose');

const webhookSecretSchema = new mongoose.Schema({
  // The secret value (hashed for storage, but we keep plain for HMAC verification)
  secret: { type: String, required: true },

  // Human-readable label (e.g., "Primary", "Backup", "Legacy-2026-08")
  label: { type: String, default: 'default' },

  // Status: active (current), rotate (being phased out), deprecated (no longer accepted)
  status: { type: String, enum: ['active', 'rotate', 'deprecated'], default: 'active' },

  // When this secret was created
  createdAt: { type: Date, default: Date.now },

  // When this secret was last used to verify a callback
  lastUsedAt: Date,

  // When this secret was deprecated (for cleanup)
  deprecatedAt: Date,

  // Expiration time (for automatic cleanup)
  expiresAt: Date,

  // Who created this secret (for audit)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Usage statistics
  usageCount: { type: Number, default: 0 },

  // Rotation metadata
  rotationId: String, // Groups secrets from the same rotation event
  previousSecret: String, // Reference to the secret this one replaced (for audit)
}, { timestamps: true });

// Index for efficient queries
webhookSecretSchema.index({ status: 1 });
webhookSecretSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

// Static method to get the current active secret
webhookSecretSchema.statics.getActiveSecret = async function () {
  return this.findOne({ status: 'active' }).sort({ createdAt: -1 });
};

// Static method to get all secrets that should be checked during verification
// Returns active secrets + secrets in rotation period (for grace period)
webhookSecretSchema.statics.getVerificationSecrets = async function () {
  return this.find({
    status: { $in: ['active', 'rotate'] },
    expiresAt: { $gt: new Date() }, // Not expired
  }).sort({ createdAt: -1 });
};

// Static method to rotate secrets (create new, mark old as rotate)
webhookSecretSchema.statics.rotate = async function (newSecret, createdBy, label) {
  const crypto = require('crypto');
  const rotationId = crypto.randomBytes(8).toString('hex');

  // Mark current active secrets as "rotate" (grace period)
  await this.updateMany(
    { status: 'active' },
    {
      status: 'rotate',
      deprecatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hour grace period
    },
  );

  // Create new active secret
  const secret = new this({
    secret: newSecret,
    status: 'active',
    label: label || `Rotated-${new Date().toISOString().slice(0, 10)}`,
    createdBy,
    rotationId,
  });

  await secret.save();
  return secret;
};

module.exports = mongoose.model('WebhookSecret', webhookSecretSchema);
