import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

// Sanity configuration — values injected via environment variables
const config = {
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true, // Enable CDN for fast reads
};

export const sanityClient = createClient(config);

// Image URL builder
const builder = imageUrlBuilder(sanityClient);
export function urlFor(source) {
  return builder.image(source);
}

// ── GROQ Queries ──────────────────────────────────────────────────────────────

// Fetch all published articles (paginated)
export async function getArticles({ page = 1, limit = 12, category = null } = {}) {
  const start = (page - 1) * limit;
  const categoryFilter = category ? `&& category == "${category}"` : '';
  
  const query = `{
    "articles": *[_type == "article" ${categoryFilter}] | order(publishedAt desc) [${start}...${start + limit}] {
      _id,
      title,
      slug,
      excerpt,
      category,
      tags,
      author->{name, avatar},
      publishedAt,
      "imageUrl": mainImage.asset->_url
    },
    "total": count(*[_type == "article" ${categoryFilter}])
  }`;
  
  return sanityClient.fetch(query);
}

// Fetch single article by slug
export async function getArticleBySlug(slug) {
  const query = `*[_type == "article" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    body,
    excerpt,
    category,
    tags,
    author->{name, avatar, bio},
    publishedAt,
    "imageUrl": mainImage.asset->_url,
    "related": *[_type == "article" && slug.current != $slug && category == ^.category][0...3] {
      title,
      slug,
      excerpt,
      "imageUrl": mainImage.asset->_url
    }
  }`;
  
  return sanityClient.fetch(query, { slug });
}

// Fetch tech tips
export async function getTechTips({ limit = 10 } = {}) {
  const query = `*[_type == "techTip"] | order(publishedAt desc) [0...${limit}] {
    _id,
    title,
    slug,
    tip,
    category,
    difficulty,
    publishedAt
  }`;
  
  return sanityClient.fetch(query);
}

// Fetch tech news
export async function getTechNews({ limit = 10 } = {}) {
  const query = `*[_type == "news"] | order(publishedAt desc) [0...${limit}] {
    _id,
    title,
    slug,
    summary,
    source,
    sourceUrl,
    publishedAt,
    "imageUrl": image.asset->_url
  }`;
  
  return sanityClient.fetch(query);
}

// Fetch daily tech facts
export async function getTechFacts({ limit = 5 } = {}) {
  const query = `*[_type == "fact"] | order(publishedAt desc) [0...${limit}] {
    _id,
    title,
    fact,
    source,
    category,
    publishedAt
  }`;
  
  return sanityClient.fetch(query);
}

// Fetch all categories with counts
export async function getCategories() {
  const query = `array(*[_type == "article"] | order(category asc).category)`;
  return sanityClient.fetch(query);
}

// Fetch site settings
export async function getSiteSettings() {
  const query = `*[_type == "siteSettings"][0] {
    title,
    description,
    logo,
    socialLinks
  }`;
  
  return sanityClient.fetch(query);
}
