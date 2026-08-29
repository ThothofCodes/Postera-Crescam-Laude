// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Sanity CMS Service — Full content management for Tech Hub

const { createClient } = require('@sanity/client');
const { uploadToImgBB, isConfigured: imgbbConfigured } = require('./imgbb');

// ── Sanity Client ────────────────────────────────────────────────────────────
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN,
});

const isConfigured = !!(
  process.env.SANITY_PROJECT_ID
  && process.env.SANITY_AUTH_TOKEN
  && process.env.SANITY_PROJECT_ID !== 'your-project-id'
);

// ── Image Upload to ImgBB (free hosting) ─────────────────────────────────────
async function uploadImageBuffer(buffer, filename) {
  if (!imgbbConfigured) {
    throw new Error('ImgBB not configured. Set IMGBB_API_KEY in backend/.env');
  }
  const result = await uploadToImgBB(buffer, filename);
  return {
    url: result.url,
    width: result.width,
    height: result.height,
    size: result.size,
  };
}

// ── Generic CRUD helper ──────────────────────────────────────────────────────
function createCrud(typeName, fields = []) {
  return {
    async list({ page = 1, limit = 50 } = {}) {
      if (!isConfigured) return { items: [], total: 0 };
      const start = (page - 1) * limit;
      const fieldList = ['_id', 'title', 'slug', 'publishedAt', ...fields].join(', ');
      const query = `{
        "items": *[_type == "${typeName}"] | order(publishedAt desc) [${start}...${start + limit}] { ${fieldList} },
        "total": count(*[_type == "${typeName}"])
      }`;
      return sanityClient.fetch(query);
    },

    async get(id) {
      if (!isConfigured) return null;
      const fieldList = ['_id', 'title', 'slug', 'excerpt', 'body', 'category', 'tags', 'publishedAt', ...fields].join(', ');
      return sanityClient.fetch(`*[_id == $id][0] { ${fieldList} }`, { id });
    },

    async getBySlug(slug) {
      if (!isConfigured) return null;
      const fieldList = ['_id', 'title', 'slug', 'excerpt', 'body', 'category', 'tags', 'publishedAt', ...fields].join(', ');
      return sanityClient.fetch(`*[_type == "${typeName}" && slug.current == $slug][0] { ${fieldList} }`, { slug });
    },

    async create(data) {
      if (!isConfigured) throw new Error('Sanity CMS not configured');
      const doc = { _type: typeName, ...data };
      if (data.slug && typeof data.slug === 'string') {
        doc.slug = { current: data.slug, _type: 'slug' };
      }
      return sanityClient.create(doc);
    },

    async update(id, data) {
      if (!isConfigured) throw new Error('Sanity CMS not configured');
      return sanityClient.patch(id).set(data).commit();
    },

    async delete(id) {
      if (!isConfigured) throw new Error('Sanity CMS not configured');
      return sanityClient.delete(id);
    },

    async publish(id) {
      if (!isConfigured) throw new Error('Sanity CMS not configured');
      return sanityClient.request({ method: 'PUT', uri: `/data/publish/${id}` });
    },

    async unpublish(id) {
      if (!isConfigured) throw new Error('Sanity CMS not configured');
      return sanityClient.request({ method: 'PUT', uri: `/data/unpublish/${id}` });
    },
  };
}

// ── Content Types ────────────────────────────────────────────────────────────
const articles = createCrud('article', ['excerpt', 'category', 'tags', 'featured', 'mainImage', 'author']);
const techTips = createCrud('techTip', ['tip', 'category', 'difficulty']);
const techNews = createCrud('news', ['summary', 'source', 'sourceUrl']);
const techFacts = createCrud('fact', ['fact', 'source', 'category']);
const authors = createCrud('author', ['name', 'avatar', 'bio']);

// ── Article-specific extras ──────────────────────────────────────────────────
async function getArticles({
  page = 1, limit = 20, category = null, status = null,
} = {}) {
  if (!isConfigured) return { articles: [], total: 0 };
  const start = (page - 1) * limit;
  let filters = '_type == "article"';
  if (category) filters += ` && category == "${category}"`;
  if (status === 'PUBLISHED') filters += ' && !(_id in path("drafts.**"))';
  if (status === 'DRAFT') filters += ' && _id in path("drafts.**")';

  const query = `{
    "articles": *[${filters}] | order(publishedAt desc) [${start}...${start + limit}] {
      _id, title, slug, excerpt, category, tags, publishedAt, featured,
      "imageUrl": mainImage.asset->_url,
      author->{name, avatar}
    },
    "total": count(*[${filters}])
  }`;
  return sanityClient.fetch(query);
}

async function getArticle(identifier) {
  if (!isConfigured) return null;
  const isSlug = !identifier.startsWith('drafts.') && !identifier.match(/^[\da-f]{8}-/);
  const filter = isSlug ? '_type == "article" && slug.current == $id' : '_id == $id';
  return sanityClient.fetch(`*[${filter}][0] {
    _id, title, slug, excerpt, body, category, tags, featured,
    "imageUrl": mainImage.asset->_url,
    author->{name, avatar, bio}, publishedAt
  }`, { id: identifier });
}

function makeSlug(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 96);
}

async function createArticle(data) {
  if (!isConfigured) throw new Error('Sanity CMS not configured');
  const doc = {
    _type: 'article',
    title: data.title,
    slug: { current: data.slug || makeSlug(data.title), _type: 'slug' },
    excerpt: data.excerpt || '',
    body: data.body || [],
    category: data.category || 'general',
    tags: data.tags || [],
    publishedAt: data.publishedAt || new Date().toISOString(),
    featured: data.featured || false,
  };

  // Schedule for later: set scheduledAt, don't publish yet
  if (data.scheduledAt) {
    doc.scheduledAt = data.scheduledAt;
    doc.publishedAt = data.scheduledAt; // Set publishedAt to scheduled time
  }
  if (data.mainImage) doc.mainImage = data.mainImage;
  if (data.authorId) doc.author = { _type: 'reference', _ref: data.authorId };
  const result = await sanityClient.create(doc);
  if (data.status === 'PUBLISHED') {
    await sanityClient.request({ method: 'PUT', uri: `/data/publish/${result._id}` });
  }
  return result;
}

async function updateArticle(id, data) {
  if (!isConfigured) throw new Error('Sanity CMS not configured');
  const patch = {};
  for (const key of ['title', 'excerpt', 'body', 'category', 'tags', 'featured', 'mainImage', 'publishedAt', 'scheduledAt']) {
    if (data[key] !== undefined) patch[key] = data[key];
  }
  if (data.slug !== undefined) patch.slug = { current: data.slug, _type: 'slug' };
  const result = await sanityClient.patch(id).set(patch).commit();
  if (data.status === 'PUBLISHED') {
    try { await sanityClient.request({ method: 'PUT', uri: `/data/publish/${id}` }); } catch { /* already published */ }
  }
  return result;
}

async function getCategoryStats() {
  if (!isConfigured) return [];
  const data = await sanityClient.fetch('array(*[_type == "article"] { category }) | order(category asc)');
  const counts = {};
  data.forEach((a) => { counts[a.category] = (counts[a.category] || 0) + 1; });
  return Object.entries(counts).map(([category, count]) => ({ category, count }));
}

async function getStudioUrl() {
  if (!isConfigured) return null;
  return `https://${process.env.SANITY_PROJECT_ID}.sanity.studio`;
}

// slugify replaced by makeSlug above

async function uploadArticleImage(buffer, filename) {
  // Upload to ImgBB (free image hosting)
  const imgbbResult = await uploadImageBuffer(buffer, filename);

  // Also upload to Sanity as an asset (if configured)
  let sanityAsset = null;
  if (isConfigured) {
    try {
      const asset = await sanityClient.assets.upload('image', buffer, {
        filename: filename || `article_${Date.now()}.jpg`,
      });
      sanityAsset = {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
      };
    } catch {
      // Non-critical — image is still on ImgBB
    }
  }

  return {
    imgbb: imgbbResult,
    sanityAsset,
  };
}

module.exports = {
  isConfigured,
  articles: {
    ...articles, list: getArticles, get: getArticle, create: createArticle, update: updateArticle,
  },
  techTips,
  techNews,
  techFacts,
  authors,
  uploadArticleImage,
  getCategoryStats,
  getStudioUrl,
};
