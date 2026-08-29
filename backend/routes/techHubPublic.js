// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Tech Hub — Public content API routes (no auth required)

const express = require('express');
const router = express.Router();
const { createClient } = require('@sanity/client');

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true, // CDN for read-only public queries
});

const isConfigured = !!(
  process.env.SANITY_PROJECT_ID
  && process.env.SANITY_PROJECT_ID !== 'your-project-id'
);

// ── Fetch published articles ─────────────────────────────────────────────────
router.get('/articles', async (req, res) => {
  try {
    if (!isConfigured) return res.json({ articles: [], total: 0 });

    const { page = 1, limit = 12, category } = req.query;
    const start = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const catFilter = category ? `&& category == "${category}"` : '';

    const data = await sanityClient.fetch(`{
      "articles": *[_type == "article" && !(_id in path("drafts.**")) ${catFilter}]
        | order(publishedAt desc) [${start}...${start + parseInt(limit, 10)}] {
        _id,
        title,
        slug,
        excerpt,
        category,
        tags,
        publishedAt,
        featured,
        "imageUrl": mainImage.asset->_url,
        author->{name, avatar}
      },
      "total": count(*[_type == "article" && !(_id in path("drafts.**")) ${catFilter}])
    }`);

    res.json(data);
  } catch (err) {
    console.error('[TechHub Public] Articles error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── Fetch single article by slug ─────────────────────────────────────────────
router.get('/articles/:slug', async (req, res) => {
  try {
    if (!isConfigured) return res.status(404).json({ message: 'Not found' });

    const article = await sanityClient.fetch(
      `*[_type == "article" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
        _id, title, slug, excerpt, body, category, tags, featured, publishedAt,
        "imageUrl": mainImage.asset->_url,
        author->{name, avatar, bio},
        "related": *[_type == "article" && slug.current != $slug && category == ^.category && !(_id in path("drafts.**"))][0...3] {
          title, slug, excerpt, "imageUrl": mainImage.asset->_url
        }
      }`,
      { slug: req.params.slug },
    );

    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (err) {
    console.error('[TechHub Public] Article detail error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── Fetch published tips ─────────────────────────────────────────────────────
router.get('/tips', async (req, res) => {
  try {
    if (!isConfigured) return res.json({ tips: [] });

    const { limit = 20 } = req.query;
    const tips = await sanityClient.fetch(
      `*[_type == "techTip" && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...${parseInt(limit, 10)}] {
        _id, title, slug, tip, category, difficulty, publishedAt
      }`,
    );

    res.json({ tips });
  } catch (err) {
    console.error('[TechHub Public] Tips error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── Fetch published news ─────────────────────────────────────────────────────
router.get('/news', async (req, res) => {
  try {
    if (!isConfigured) return res.json({ news: [] });

    const { limit = 20 } = req.query;
    const news = await sanityClient.fetch(
      `*[_type == "news" && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...${parseInt(limit, 10)}] {
        _id, title, slug, summary, source, sourceUrl, publishedAt,
        "imageUrl": image.asset->_url
      }`,
    );

    res.json({ news });
  } catch (err) {
    console.error('[TechHub Public] News error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── Fetch published facts ────────────────────────────────────────────────────
router.get('/facts', async (req, res) => {
  try {
    if (!isConfigured) return res.json({ facts: [] });

    const { limit = 10 } = req.query;
    const facts = await sanityClient.fetch(
      `*[_type == "fact" && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...${parseInt(limit, 10)}] {
        _id, title, fact, source, category, publishedAt
      }`,
    );

    res.json({ facts });
  } catch (err) {
    console.error('[TechHub Public] Facts error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── Fetch categories with counts ─────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    if (!isConfigured) return res.json({ categories: [] });

    const articles = await sanityClient.fetch(
      'array(*[_type == "article" && !(_id in path("drafts.**"))] { category })',
    );
    const counts = {};
    articles.forEach((a) => { counts[a.category] = (counts[a.category] || 0) + 1; });
    const categories = Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ categories });
  } catch (err) {
    console.error('[TechHub Public] Categories error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── Sanity status (public) ───────────────────────────────────────────────────
router.get('/status', (req, res) => {
  res.json({ configured: isConfigured });
});

module.exports = router;
