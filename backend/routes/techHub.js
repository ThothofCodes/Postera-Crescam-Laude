// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Tech Hub — Full content management API routes (Sanity CMS + ImgBB images)

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, superAdminGuard } = require('../middleware/auth');
const { uploadToImgBB, isConfigured: imgbbConfigured } = require('../utils/imgbb');
const {
  isConfigured,
  articles,
  techTips,
  techNews,
  techFacts,
  authors,
  getCategoryStats,
  getStudioUrl,
} = require('../utils/sanity');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (ALLOWED.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Unsupported image type: ${file.mimetype}`), false);
  },
});

// ── Auth middleware for all routes ───────────────────────────────────────────
router.use(protect, superAdminGuard);

// ── Sanity status & config ───────────────────────────────────────────────────
router.get('/status', async (req, res) => {
  try {
    const studioUrl = await getStudioUrl();
    res.json({
      configured: isConfigured,
      studioUrl,
      imgbbConfigured: imgbbConfigured,
    });
  } catch {
    res.json({ configured: isConfigured, studioUrl: null, imgbbConfigured: false });
  }
});

// ── Articles ─────────────────────────────────────────────────────────────────
router.get('/articles', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status } = req.query;
    const result = await articles.list({ page: parseInt(page, 10), limit: parseInt(limit, 10), category, status });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/articles/:id', async (req, res) => {
  try {
    const item = await articles.get(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/articles', async (req, res) => {
  try {
    const item = await articles.create(req.body);
    res.status(201).json({ message: 'Article created', item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/articles/:id', async (req, res) => {
  try {
    const item = await articles.update(req.params.id, req.body);
    res.json({ message: 'Article updated', item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/articles/:id', async (req, res) => {
  try {
    await articles.delete(req.params.id);
    res.json({ message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/articles/:id/publish', async (req, res) => {
  try {
    await articles.publish(req.params.id);
    res.json({ message: 'Article published' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/articles/:id/schedule', async (req, res) => {
  try {
    const { scheduledAt } = req.body;
    if (!scheduledAt) return res.status(400).json({ message: 'scheduledAt is required' });

    const date = new Date(scheduledAt);
    if (Number.isNaN(date.getTime())) return res.status(400).json({ message: 'Invalid date format' });
    if (date <= new Date()) return res.status(400).json({ message: 'Schedule date must be in the future' });

    await articles.update(req.params.id, {
      scheduledAt: date.toISOString(),
      publishedAt: date.toISOString(),
    });

    res.json({ message: `Article scheduled for ${date.toLocaleString()}`, scheduledAt: date.toISOString() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/articles/:id/cancel-schedule', async (req, res) => {
  try {
    await articles.update(req.params.id, { scheduledAt: null });
    res.json({ message: 'Schedule cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/articles/:id/unpublish', async (req, res) => {
  try {
    await articles.unpublish(req.params.id);
    res.json({ message: 'Article unpublished' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Tech Tips ────────────────────────────────────────────────────────────────
router.get('/tips', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await techTips.list({ page: parseInt(page, 10), limit: parseInt(limit, 10) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/tips', async (req, res) => {
  try {
    const item = await techTips.create(req.body);
    res.status(201).json({ message: 'Tip created', item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/tips/:id', async (req, res) => {
  try {
    const item = await techTips.update(req.params.id, req.body);
    res.json({ message: 'Tip updated', item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/tips/:id', async (req, res) => {
  try {
    await techTips.delete(req.params.id);
    res.json({ message: 'Tip deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/tips/:id/publish', async (req, res) => {
  try {
    await techTips.publish(req.params.id);
    res.json({ message: 'Tip published' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Tech News ────────────────────────────────────────────────────────────────
router.get('/news', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await techNews.list({ page: parseInt(page, 10), limit: parseInt(limit, 10) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/news', async (req, res) => {
  try {
    const item = await techNews.create(req.body);
    res.status(201).json({ message: 'News created', item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/news/:id', async (req, res) => {
  try {
    const item = await techNews.update(req.params.id, req.body);
    res.json({ message: 'News updated', item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/news/:id', async (req, res) => {
  try {
    await techNews.delete(req.params.id);
    res.json({ message: 'News deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/news/:id/publish', async (req, res) => {
  try {
    await techNews.publish(req.params.id);
    res.json({ message: 'News published' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Tech Facts ───────────────────────────────────────────────────────────────
router.get('/facts', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await techFacts.list({ page: parseInt(page, 10), limit: parseInt(limit, 10) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/facts', async (req, res) => {
  try {
    const item = await techFacts.create(req.body);
    res.status(201).json({ message: 'Fact created', item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/facts/:id', async (req, res) => {
  try {
    const item = await techFacts.update(req.params.id, req.body);
    res.json({ message: 'Fact updated', item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/facts/:id', async (req, res) => {
  try {
    await techFacts.delete(req.params.id);
    res.json({ message: 'Fact deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/facts/:id/publish', async (req, res) => {
  try {
    await techFacts.publish(req.params.id);
    res.json({ message: 'Fact published' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Authors ──────────────────────────────────────────────────────────────────
router.get('/authors', async (req, res) => {
  try {
    const result = await authors.list();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/authors', async (req, res) => {
  try {
    const item = await authors.create(req.body);
    res.status(201).json({ message: 'Author created', item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/authors/:id', async (req, res) => {
  try {
    const item = await authors.update(req.params.id, req.body);
    res.json({ message: 'Author updated', item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/authors/:id', async (req, res) => {
  try {
    await authors.delete(req.params.id);
    res.json({ message: 'Author deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Image Upload (ImgBB — free, no Cloudinary) ──────────────────────────────
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });
    if (!imgbbConfigured) {
      return res.status(503).json({
        message: 'Image upload not configured. Set IMGBB_API_KEY in backend/.env (free at https://api.imgbb.com/)',
      });
    }

    const result = await uploadToImgBB(req.file.buffer, req.file.originalname);

    // Also create a Sanity image asset reference if Sanity is configured
    let sanityAsset = null;
    if (isConfigured) {
      try {
        const { createClient } = require('@sanity/client');
        const sanityClient = createClient({
          projectId: process.env.SANITY_PROJECT_ID,
          dataset: process.env.SANITY_DATASET || 'production',
          apiVersion: '2024-01-01',
          useCdn: false,
          token: process.env.SANITY_AUTH_TOKEN,
        });
        const asset = await sanityClient.assets.upload('image', req.file.buffer, {
          filename: req.file.originalname || `article_${Date.now()}.jpg`,
        });
        sanityAsset = {
          _type: 'image',
          asset: { _type: 'reference', _ref: asset._id },
        };
      } catch {
        // Non-critical — image is still hosted on ImgBB
      }
    }

    res.json({
      message: 'Image uploaded',
      url: result.url,
      deleteUrl: result.deleteUrl,
      width: result.width,
      height: result.height,
      sanityAsset,
    });
  } catch (err) {
    console.error('[TechHub] Image upload error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── Stats ────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const stats = await getCategoryStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
