// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Webhook Configuration Endpoints (admin only)
const router = require('express').Router();
const { protect, superAdminGuard } = require('../middleware/auth');
const {
  rotateWebhookSecret,
  clearSecretsCache,
  SIGNATURE_MAX_AGE_MS,
  ROTATION_GRACE_PERIOD_MS,
} = require('../middleware/webhookSignature');

// GET /api/webhook-config — Get webhook configuration (admin only)
router.get('/', protect, superAdminGuard, async (req, res) => {
  try {
    // Get all secrets from database
    let secrets = [];
    try {
      const WebhookSecret = require('../models/WebhookSecret');
      secrets = await WebhookSecret.find()
        .select('label status createdAt lastUsedAt usageCount deprecatedAt expiresAt')
        .sort({ createdAt: -1 })
        .limit(10);
    } catch {
      // Database not available
    }

    const isDefault = !process.env.MPESA_WEBHOOK_SECRET && secrets.length === 0;

    res.json({
      primarySecret: isDefault ? '[AUTO-GENERATED]' : '••••••••••••••••••••',
      secretsCount: secrets.length,
      secrets: secrets.map((s) => ({
        id: s._id,
        label: s.label,
        status: s.status,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        usageCount: s.usageCount,
        deprecatedAt: s.deprecatedAt,
        expiresAt: s.expiresAt,
        isExpired: s.expiresAt && new Date(s.expiresAt) < new Date(),
      })),
      signatureMaxAgeSeconds: SIGNATURE_MAX_AGE_MS / 1000,
      rotationGracePeriodHours: ROTATION_GRACE_PERIOD_MS / (1000 * 60 * 60),
      environment: process.env.NODE_ENV || 'development',
      isUsingDefaultSecret: isDefault,
      callbackUrls: {
        payments: process.env.MPESA_CALLBACK_URL || 'Not configured',
        billing: process.env.MPESA_CALLBACK_URL ? process.env.MPESA_CALLBACK_URL.replace('/payments/', '/billing/') : 'Not configured',
      },
      instructions: isDefault
        ? '⚠️ Using auto-generated secret. Set MPESA_WEBHOOK_SECRET in .env or rotate via API for production.'
        : '✅ Using custom webhook secret(s) from database/environment.',
    });
  } catch (error) {
    console.error('Webhook config error:', error);
    res.status(500).json({ message: 'Failed to fetch webhook configuration' });
  }
});

// POST /api/webhook-config/rotate — Rotate webhook secret (admin only)
// Zero-downtime rotation: old secrets accepted for 24 hours
router.post('/rotate', protect, superAdminGuard, async (req, res) => {
  try {
    const { label } = req.body;
    const result = await rotateWebhookSecret(req.user._id, label);

    if (result.success) {
      res.json({
        message: 'Webhook secret rotated successfully',
        secretId: result.secretId,
        label: result.label,
        gracePeriod: `${ROTATION_GRACE_PERIOD_MS / (1000 * 60 * 60)} hours`,
        instructions: [
          '1. Update your Safaricom Daraja callback URLs with the new signature',
          '2. Old secrets will continue to work for 24 hours (grace period)',
          '3. Monitor the webhook config page for usage of old secrets',
          '4. After 24 hours, old secrets are automatically deprecated',
        ],
      });
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error('Webhook rotation error:', error);
    res.status(500).json({ message: 'Failed to rotate webhook secret' });
  }
});

// POST /api/webhook-config/deprecate/:id — Deprecate a specific secret
router.post('/deprecate/:id', protect, superAdminGuard, async (req, res) => {
  try {
    const WebhookSecret = require('../models/WebhookSecret');
    const secret = await WebhookSecret.findById(req.params.id);

    if (!secret) {
      return res.status(404).json({ message: 'Secret not found' });
    }

    if (secret.status === 'deprecated') {
      return res.status(400).json({ message: 'Secret is already deprecated' });
    }

    // Cannot deprecate the only active secret
    const activeCount = await WebhookSecret.countDocuments({ status: 'active' });
    if (secret.status === 'active' && activeCount <= 1) {
      return res.status(400).json({ message: 'Cannot deprecate the only active secret. Rotate first.' });
    }

    secret.status = 'deprecated';
    secret.deprecatedAt = new Date();
    secret.expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour grace period
    await secret.save();

    clearSecretsCache();

    res.json({
      message: 'Secret deprecated successfully',
      secretId: secret._id,
      label: secret.label,
      expiresAt: secret.expiresAt,
    });
  } catch (error) {
    console.error('Webhook deprecate error:', error);
    res.status(500).json({ message: 'Failed to deprecate secret' });
  }
});

// POST /api/webhook-config/cleanup — Clean up expired secrets
router.post('/cleanup', protect, superAdminGuard, async (req, res) => {
  try {
    const WebhookSecret = require('../models/WebhookSecret');

    // Delete deprecated secrets that have expired
    const result = await WebhookSecret.deleteMany({
      status: 'deprecated',
      expiresAt: { $lt: new Date() },
    });

    clearSecretsCache();

    res.json({
      message: 'Cleanup completed',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Webhook cleanup error:', error);
    res.status(500).json({ message: 'Failed to cleanup secrets' });
  }
});

// POST /api/webhook-config/test — Test webhook signature generation
router.post('/test', protect, superAdminGuard, async (req, res) => {
  try {
    const { generateSignature, generateSignedCallbackUrl } = require('../middleware/webhookSignature');

    const testCheckoutId = 'TEST-' + Date.now();
    const timestamp = Date.now();
    const signature = await generateSignature(testCheckoutId, timestamp);
    const signedUrl = await generateSignedCallbackUrl(
      process.env.MPESA_CALLBACK_URL || 'https://example.com/api/payments/mpesa/callback',
      testCheckoutId,
    );

    res.json({
      testCheckoutId,
      timestamp,
      signature,
      signedUrl,
      verification: {
        signatureLength: signature.length,
        isHex: /^[0-9a-f]+$/i.test(signature),
      },
    });
  } catch (error) {
    console.error('Webhook test error:', error);
    res.status(500).json({ message: 'Failed to test webhook signature' });
  }
});

module.exports = router;
