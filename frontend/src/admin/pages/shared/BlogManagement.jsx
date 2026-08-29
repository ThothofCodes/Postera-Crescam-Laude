// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Blog Management: Admin interface for Tech Hub content (Sanity CMS)
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';
import RichTextEditor from '../../components/RichTextEditor';
import ArticleScheduler from '../../components/ArticleScheduler';

const CATEGORIES = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
  { value: 'networking', label: 'Networking' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'webdev', label: 'Web Development' },
  { value: 'ai', label: 'AI & Machine Learning' },
  { value: 'general', label: 'General Tech' },
];

const CATEGORY_COLORS = {
  hardware: '#2BB6A3',
  software: '#a78bfa',
  networking: '#ffd700',
  cybersecurity: '#ff3366',
  webdev: '#EE6100',
  ai: '#00ff88',
  general: '#4a6a8a',
};

const STATUS_COLORS = {
  DRAFT: '#4a6a8a',
  PUBLISHED: '#00ff88',
  ARCHIVED: '#ff3366',
};

const Tag = ({ label, map }) => {
  const c = (map || {})[label] || '#A9C4BE';
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 99,
        background: `${c}22`,
        color: c,
        border: `1px solid ${c}44`,
      }}
    >
      {label}
    </span>
  );
};

// BodyEditor replaced by RichTextEditor component

// ── Image Upload Modal ───────────────────────────────────────────────────────
const ImageUploadModal = ({ onInsert, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/tech-hub/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onInsert({
        url: response.data.url,
        sanityAsset: response.data.sanityAsset,
        alt: file.name.replace(/\.[^/.]+$/, ''),
      });
      toast.success('Image uploaded');
      onClose();
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  }, [onInsert, onClose]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0B1F1B',
          border: '1px solid #EE610044',
          borderRadius: 12,
          padding: '1.5rem',
          width: 450,
          maxHeight: '80vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#F4F1EA', fontSize: 16 }}>Insert Image</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#4a6a8a',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#EE6100' : 'rgba(36,74,68,0.4)'}`,
            borderRadius: 8,
            padding: '2rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'rgba(238,97,0,0.05)' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6 }}
            />
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🖼</div>
              <p style={{ color: '#c0d8f0', fontSize: 13, margin: '0 0 4px' }}>
                {dragOver ? 'Drop image here' : 'Click or drag image to upload'}
              </p>
              <p style={{ color: '#4a6a8a', fontSize: 11, margin: 0 }}>
                JPEG, PNG, WebP, GIF — max 10 MB
              </p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {uploading && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <div
              style={{
                width: 24,
                height: 24,
                border: '3px solid #0F2620',
                borderTop: '3px solid #EE6100',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
              }}
            />
            <p style={{ color: '#4a6a8a', fontSize: 12, marginTop: 8 }}>Uploading...</p>
          </div>
        )}

        {/* URL input fallback */}
        <div style={{ marginTop: '1rem' }}>
          <label style={{ fontSize: 11, color: '#4a6a8a', textTransform: 'uppercase' }}>
            Or paste image URL
          </label>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              id="imageUrlInput"
              style={{
                flex: 1,
                padding: '0.5rem',
                background: '#0F2620',
                border: '1px solid rgba(36,74,68,0.4)',
                borderRadius: 6,
                color: '#F4F1EA',
                fontSize: 12,
              }}
            />
            <button
              type="button"
              onClick={() => {
                const url = document.getElementById('imageUrlInput')?.value;
                if (url) {
                  onInsert({ url, alt: 'Article image' });
                  onClose();
                }
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#EE6100',
                color: '#000',
                border: 'none',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Insert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function BlogManagement({ color = '#EE6100' }) {
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sanityConfigured, setSanityConfigured] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showScheduler, setShowScheduler] = useState(null); // null or article object
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    category: 'general',
    tags: '',
    body: '',
    status: 'DRAFT',
    featured: false,
    mainImage: null,
  });

  // Check Sanity configuration
  useEffect(() => {
    api.get('/tech-hub/status')
      .then((res) => setSanityConfigured(res.data.configured))
      .catch(() => setSanityConfigured(false));
  }, []);

  // Load articles
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      if (!sanityConfigured) {
        // Fallback mock data when Sanity isn't connected
        setArticles([
          { _id: '1', title: "Understanding Kenya's Digital Infrastructure Growth", category: 'networking', status: 'PUBLISHED', excerpt: 'How fiber optic expansion is transforming internet access across Nairobi and beyond.', tags: ['kenya', 'infrastructure', 'fiber'], publishedAt: '2026-08-24T10:00:00Z' },
          { _id: '2', title: 'Cybersecurity Best Practices for Small Businesses', category: 'cybersecurity', status: 'PUBLISHED', excerpt: 'Essential security measures every Kenyan SME should implement today.', tags: ['security', 'sme'], publishedAt: '2026-08-22T09:00:00Z' },
          { _id: '3', title: 'The Rise of AI in East African Tech', category: 'ai', status: 'DRAFT', excerpt: 'Local startups are leveraging machine learning to solve uniquely African challenges.', tags: ['ai', 'startups'], publishedAt: null },
        ]);
        setTotal(3);
        return;
      }

      const params = new URLSearchParams();
      if (categoryFilter) params.set('category', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '50');

      const res = await api.get(`/tech-hub/articles?${params}`);
      setArticles(res.data.articles || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load articles:', err);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, [sanityConfigured, statusFilter, categoryFilter]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // Handle form submit (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = formData.body
        ? [{ _type: 'block', children: [{ _type: 'span', text: formData.body }] }]
        : [];

      const payload = {
        title: formData.title,
        excerpt: formData.excerpt,
        category: formData.category,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        body,
        status: formData.status,
        featured: formData.featured,
        mainImage: formData.mainImage,
      };

      if (editingArticle) {
        await api.put(`/tech-hub/articles/${editingArticle._id}`, payload);
        toast.success('Article updated successfully');
      } else {
        await api.post('/tech-hub/articles', payload);
        toast.success('Article created successfully');
      }
      setShowForm(false);
      loadArticles();
    } catch (err) {
      console.error('Save article error:', err);
      toast.error(err.response?.data?.message || 'Failed to save article');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      await api.delete(`/tech-hub/articles/${id}`);
      toast.success('Article deleted');
      loadArticles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete article');
    }
  };

  // Handle publish/unpublish
  const handlePublish = async (id) => {
    try {
      await api.post(`/tech-hub/articles/${id}/publish`);
      toast.success('Article published to Tech Hub');
      loadArticles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish');
    }
  };

  const handleUnpublish = async (id) => {
    try {
      await api.post(`/tech-hub/articles/${id}/unpublish`);
      toast.success('Article moved to drafts');
      loadArticles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unpublish');
    }
  };

  // Handle image insert from modal
  const handleImageInsert = ({ url, sanityAsset, alt }) => {
    const markdownImage = `![${alt || 'image'}](${url})`;
    setFormData((prev) => ({
      ...prev,
      body: prev.body ? `${prev.body}\n\n${markdownImage}` : markdownImage,
      mainImage: sanityAsset || prev.mainImage,
    }));
  };

  // Open edit modal
  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title || '',
      excerpt: article.excerpt || '',
      category: article.category || 'general',
      tags: article.tags?.join(', ') || '',
      body: article.body || '',
      status: article.status || 'DRAFT',
      featured: article.featured || false,
      mainImage: article.mainImage || null,
    });
    setShowForm(true);
  };

  // Open create modal
  const handleCreate = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      excerpt: '',
      category: 'general',
      tags: '',
      body: '',
      status: 'DRAFT',
      featured: false,
      mainImage: null,
    });
    setShowForm(true);
  };

  // Computed stats
  const publishedCount = articles.filter((a) => a.status === 'PUBLISHED').length;
  const draftCount = articles.filter((a) => a.status === 'DRAFT').length;

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", color: '#c0d8f0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color }}>
            📝 Blog Management
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#4a6a8a' }}>
            {sanityConfigured
              ? 'Connected to Sanity CMS — changes go live instantly'
              : '⚠️ Sanity CMS not configured — using demo data'}
            {' • '}
            <a href="https://blog.pcl.co.ke" target="_blank" rel="noopener" style={{ color: '#2BB6A3' }}>
              View Live Site →
            </a>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!sanityConfigured && (
            <div
              style={{
                padding: '0.4rem 0.8rem',
                background: '#ffd70022',
                border: '1px solid #ffd70044',
                borderRadius: 6,
                fontSize: 11,
                color: '#ffd700',
              }}
            >
              ⚠️ Set SANITY_PROJECT_ID &amp; SANITY_AUTH_TOKEN in backend/.env
            </div>
          )}
          <button
            onClick={handleCreate}
            style={{
              padding: '0.5rem 1rem',
              background: color,
              color: '#000',
              border: 'none',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            + New Article
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Articles', value: total, icon: '📄', clr: '#2BB6A3' },
          { label: 'Published', value: publishedCount, icon: '✅', clr: '#00ff88' },
          { label: 'Drafts', value: draftCount, icon: '📝', clr: '#ffd700' },
        ].map(({ label, value, icon, clr }) => (
          <div
            key={label}
            style={{
              background: '#0F2620',
              border: `1px solid ${clr}33`,
              borderRadius: 8,
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>{icon}</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: clr }}>{value}</span>
            </div>
            <div style={{ fontSize: 11, color: '#4a6a8a', marginTop: '0.5rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1rem' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '0.45rem 0.75rem',
            background: '#0F2620',
            border: '1px solid rgba(36,74,68,0.4)',
            borderRadius: 5,
            color: '#F4F1EA',
            fontSize: 12,
          }}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '0.45rem 0.75rem',
            background: '#0F2620',
            border: '1px solid rgba(36,74,68,0.4)',
            borderRadius: 5,
            color: '#F4F1EA',
            fontSize: 12,
          }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Articles Table */}
      {loading ? (
        <p style={{ color: '#4a6a8a' }}>Loading articles...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #0a2040' }}>
                {['Title', 'Category', 'Status', 'Tags', 'Published', 'Actions'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '0.5rem 0.75rem',
                      textAlign: 'left',
                      color: '#4a6a8a',
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {articles.map((article, i) => (
                <tr
                  key={article._id}
                  style={{
                    borderBottom: '1px solid #040c1a',
                    background: i % 2 === 0 ? 'transparent' : '#050d1a',
                  }}
                >
                  <td style={{ padding: '0.6rem 0.75rem', maxWidth: 300 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {article.imageUrl && (
                        <img
                          src={article.imageUrl}
                          alt=""
                          style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: '#F4F1EA' }}>
                          {article.title}
                          {article.featured && (
                            <span style={{ marginLeft: 6, fontSize: 10, color: '#EE6100' }}>★</span>
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: '#4a6a8a', marginTop: 2 }}>
                          {article.excerpt?.slice(0, 80)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <Tag label={article.category} map={CATEGORY_COLORS} />
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    {article.scheduledAt ? (
                      <div>
                        <Tag label="SCHEDULED" color="#ffd700" />
                        <div style={{ fontSize: 9, color: '#ffd700', marginTop: 2 }}>
                          📅 {new Date(article.scheduledAt).toLocaleDateString()} {new Date(article.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : (
                      <Tag label={article.status || (article._id?.startsWith('drafts.') ? 'DRAFT' : 'PUBLISHED')} map={STATUS_COLORS} />
                    )}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', maxWidth: 150 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {article.tags?.slice(0, 2).map((tag) => (
                        <span key={tag} style={{ fontSize: 9, color: '#4a6a8a' }}>#{tag}</span>
                      ))}
                      {article.tags?.length > 2 && (
                        <span style={{ fontSize: 9, color: '#4a6a8a' }}>+{article.tags.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', color: '#4a6a8a' }}>
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleEdit(article)}
                        style={{
                          padding: '3px 8px',
                          background: `${color}22`,
                          color,
                          border: `1px solid ${color}44`,
                          borderRadius: 4,
                          fontSize: 10,
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        EDIT
                      </button>
                      {article.status !== 'PUBLISHED' && !article._id?.startsWith('drafts.') ? null : (
                        <button
                          onClick={() => handlePublish(article._id)}
                          style={{
                            padding: '3px 8px',
                            background: '#00ff8822',
                            color: '#00ff88',
                            border: '1px solid #00ff8844',
                            borderRadius: 4,
                            fontSize: 10,
                            cursor: 'pointer',
                            fontWeight: 700,
                          }}
                        >
                          PUBLISH
                        </button>
                      )}
                      <button
                        onClick={() => setShowScheduler(article)}
                        style={{
                          padding: '3px 8px',
                          background: '#ffd70022',
                          color: '#ffd700',
                          border: '1px solid #ffd70044',
                          borderRadius: 4,
                          fontSize: 10,
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        📅
                      </button>
                      <button
                        onClick={() => handleDelete(article._id)}
                        style={{
                          padding: '3px 8px',
                          background: '#ff336622',
                          color: '#ff3366',
                          border: '1px solid #ff336644',
                          borderRadius: 4,
                          fontSize: 10,
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#2a4a6a' }}>
                    No articles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0B1F1B',
              border: `1px solid ${color}44`,
              borderRadius: 12,
              width: '100%',
              maxWidth: 700,
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#F4F1EA' }}>
                {editingArticle ? '✏️ Edit Article' : '📝 New Article'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: 'transparent', border: 'none', color: '#4a6a8a', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: 11, color: '#4a6a8a', marginBottom: 4, textTransform: 'uppercase' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Article title..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: '#0F2620',
                    border: '1px solid rgba(36,74,68,0.4)',
                    borderRadius: 6,
                    color: '#F4F1EA',
                    fontSize: 14,
                    fontWeight: 600,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Excerpt */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: 11, color: '#4a6a8a', marginBottom: 4, textTransform: 'uppercase' }}>
                  Excerpt *
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  required
                  rows={2}
                  placeholder="Brief description for article cards..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: '#0F2620',
                    border: '1px solid rgba(36,74,68,0.4)',
                    borderRadius: 6,
                    color: '#F4F1EA',
                    fontSize: 12,
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Category + Status + Featured */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#4a6a8a', marginBottom: 4, textTransform: 'uppercase' }}>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: '#0F2620',
                      border: '1px solid rgba(36,74,68,0.4)',
                      borderRadius: 6,
                      color: '#F4F1EA',
                      fontSize: 12,
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#4a6a8a', marginBottom: 4, textTransform: 'uppercase' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: '#0F2620',
                      border: '1px solid rgba(36,74,68,0.4)',
                      borderRadius: 6,
                      color: '#F4F1EA',
                      fontSize: 12,
                    }}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: '#c0d8f0' }}>
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      style={{ accentColor: '#EE6100' }}
                    />
                    ★ Featured
                  </label>
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: 11, color: '#4a6a8a', marginBottom: 4, textTransform: 'uppercase' }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="react, javascript, tutorial"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: '#0F2620',
                    border: '1px solid rgba(36,74,68,0.4)',
                    borderRadius: 6,
                    color: '#F4F1EA',
                    fontSize: 12,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Body Editor */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: 11, color: '#4a6a8a', marginBottom: 4, textTransform: 'uppercase' }}>
                  Body Content *
                </label>
                <RichTextEditor
                  value={formData.body}
                  onChange={(body) => setFormData({ ...formData, body })}
                  placeholder="Write your article content here..."
                  minHeight={350}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    color: '#4a6a8a',
                    border: '1px solid rgba(36,74,68,0.4)',
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1.5rem',
                    background: color,
                    color: '#000',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {editingArticle ? '💾 Update Article' : '🚀 Create Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageModal && (
        <ImageUploadModal
          onInsert={handleImageInsert}
          onClose={() => setShowImageModal(false)}
        />
      )}

      {/* Scheduler Modal */}
      {showScheduler && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
        >
          <ArticleScheduler
            article={showScheduler}
            onSchedule={() => { setShowScheduler(null); loadArticles(); }}
            onCancel={() => setShowScheduler(null)}
          />
        </div>
      )}
    </div>
  );
}
