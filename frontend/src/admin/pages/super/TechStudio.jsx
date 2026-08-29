// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Tech Studio: Comprehensive content management for Tech Hub (all content types)
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';
import RichTextEditor from '../../components/RichTextEditor';
import ArticleScheduler from '../../components/ArticleScheduler';

const CONTENT_TABS = [
  { key: 'articles', label: '📚 Articles', icon: '📚' },
  { key: 'tips', label: '💡 Tips', icon: '💡' },
  { key: 'news', label: '📰 News', icon: '📰' },
  { key: 'facts', label: '🧠 Facts', icon: '🧠' },
  { key: 'authors', label: '👤 Authors', icon: '👤' },
];

const CATEGORIES = [
  { value: 'hardware', label: 'Hardware', color: '#2BB6A3' },
  { value: 'software', label: 'Software', color: '#a78bfa' },
  { value: 'networking', label: 'Networking', color: '#ffd700' },
  { value: 'cybersecurity', label: 'Cybersecurity', color: '#ff3366' },
  { value: 'webdev', label: 'Web Dev', color: '#EE6100' },
  { value: 'ai', label: 'AI & ML', color: '#00ff88' },
  { value: 'general', label: 'General', color: '#4a6a8a' },
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const DIFFICULTY_COLORS = { Beginner: '#2BB6A3', Intermediate: '#ffd700', Advanced: '#ff3366' };

// ── Badge ────────────────────────────────────────────────────────────────────
const Badge = ({ label, color = '#4a6a8a', size = 10 }) => (
  <span style={{
    fontSize: size, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
    background: `${color}22`, color, border: `1px solid ${color}44`,
  }}>
    {label}
  </span>
);

// ── Image Upload Component ───────────────────────────────────────────────────
const ImageUploader = ({ onUpload, currentImage }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || null);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/tech-hub/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUpload({ url: res.data.url, sanityAsset: res.data.sanityAsset });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      {preview && (
        <img src={preview} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(36,74,68,0.4)' }} />
      )}
      <div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ padding: '6px 12px', background: '#EE610022', color: '#EE6100', border: '1px solid #EE610044', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          {uploading ? '⏳ Uploading...' : '🖼 Upload Image'}
        </button>
      </div>
    </div>
  );
};

// ── Article Form ─────────────────────────────────────────────────────────────
const ArticleForm = ({ article, onSave, onCancel }) => {
  const [form, setForm] = useState({
    title: article?.title || '',
    excerpt: article?.excerpt || '',
    category: article?.category || 'general',
    tags: article?.tags?.join(', ') || '',
    body: article?.body || '',
    featured: article?.featured || false,
    mainImage: article?.mainImage || null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = form.body ? [{ _type: 'block', children: [{ _type: 'span', text: form.body }] }] : [];
    await onSave({
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      body,
      slug: form.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 96),
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Title"
        style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 14, fontWeight: 600 }} />
      <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} required rows={2} placeholder="Excerpt"
        style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 12, resize: 'none' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
          style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 12 }}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags (comma-separated)"
          style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 12 }} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 11, color: '#4a6a8a', marginBottom: 4, textTransform: 'uppercase' }}>Article Body</label>
        <RichTextEditor
          value={form.body}
          onChange={(body) => setForm({ ...form, body })}
          placeholder="Write your article content here..."
          minHeight={300}
        />
      </div>
      <ImageUploader currentImage={article?.imageUrl} onUpload={(img) => setForm({ ...form, mainImage: img.sanityAsset })} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#c0d8f0', cursor: 'pointer' }}>
        <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} style={{ accentColor: '#EE6100' }} />
        ★ Featured Article
      </label>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '6px 16px', background: 'transparent', color: '#4a6a8a', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
        <button type="submit" style={{ padding: '6px 16px', background: '#EE6100', color: '#000', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>💾 Save</button>
      </div>
    </form>
  );
};

// ── Tip Form ─────────────────────────────────────────────────────────────────
const TipForm = ({ tip, onSave, onCancel }) => {
  const [form, setForm] = useState({
    title: tip?.title || '',
    tip: tip?.tip || '',
    category: tip?.category || 'General',
    difficulty: tip?.difficulty || 'Beginner',
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, slug: form.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 96) }); }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Tip title"
        style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 13, fontWeight: 600 }} />
      <textarea value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })} required rows={4} placeholder="Tip content"
        style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 12, resize: 'none' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category"
          style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 12 }} />
        <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
          style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 12 }}>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '6px 16px', background: 'transparent', color: '#4a6a8a', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
        <button type="submit" style={{ padding: '6px 16px', background: '#ffd700', color: '#000', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>💾 Save</button>
      </div>
    </form>
  );
};

// ── News Form ────────────────────────────────────────────────────────────────
const NewsForm = ({ item, onSave, onCancel }) => {
  const [form, setForm] = useState({
    title: item?.title || '',
    summary: item?.summary || '',
    source: item?.source || '',
    sourceUrl: item?.sourceUrl || '',
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, slug: form.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 96) }); }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="News title"
        style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 13, fontWeight: 600 }} />
      <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} required rows={4} placeholder="Summary"
        style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 12, resize: 'none' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Source (e.g., TechCrunch)"
          style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 12 }} />
        <input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="Source URL"
          style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 12 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '6px 16px', background: 'transparent', color: '#4a6a8a', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
        <button type="submit" style={{ padding: '6px 16px', background: '#2BB6A3', color: '#000', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>💾 Save</button>
      </div>
    </form>
  );
};

// ── Fact Form ────────────────────────────────────────────────────────────────
const FactForm = ({ item, onSave, onCancel }) => {
  const [form, setForm] = useState({
    title: item?.title || '',
    fact: item?.fact || '',
    source: item?.source || '',
    category: item?.category || 'History',
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Fact title"
        style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 13, fontWeight: 600 }} />
      <textarea value={form.fact} onChange={(e) => setForm({ ...form, fact: e.target.value })} required rows={4} placeholder="The fact content"
        style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 12, resize: 'none' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category (e.g., History, Space)"
          style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 12 }} />
        <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Source"
          style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 12 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '6px 16px', background: 'transparent', color: '#4a6a8a', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
        <button type="submit" style={{ padding: '6px 16px', background: '#a78bfa', color: '#000', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>💾 Save</button>
      </div>
    </form>
  );
};

// ── Author Form ──────────────────────────────────────────────────────────────
const AuthorForm = ({ author, onSave, onCancel }) => {
  const [form, setForm] = useState({
    name: author?.name || '',
    bio: author?.bio || '',
    avatar: author?.avatar || null,
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Author name"
        style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 13, fontWeight: 600 }} />
      <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Author bio"
        style={{ padding: '8px 12px', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, color: '#F4F1EA', fontSize: 12, resize: 'none' }} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '6px 16px', background: 'transparent', color: '#4a6a8a', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
        <button type="submit" style={{ padding: '6px 16px', background: '#00ff88', color: '#000', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>💾 Save</button>
      </div>
    </form>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function TechStudio({ color = '#EE6100' }) {
  const [activeTab, setActiveTab] = useState('articles');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [sanityConfigured, setSanityConfigured] = useState(false);
  const [studioUrl, setStudioUrl] = useState(null);
  const [showScheduler, setShowScheduler] = useState(null);

  // Load Sanity status
  useEffect(() => {
    api.get('/tech-hub/status').then((res) => {
      setSanityConfigured(res.data.configured);
      setStudioUrl(res.data.studioUrl);
    }).catch(() => {});
  }, []);

  // Load items for current tab
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'articles' ? 'articles'
        : activeTab === 'tips' ? 'tips'
        : activeTab === 'news' ? 'news'
        : activeTab === 'facts' ? 'facts'
        : 'authors';

      const res = await api.get(`/tech-hub/${endpoint}`);
      setItems(res.data.items || res.data.articles || []);
      setTotal(res.data.total || (res.data.items || res.data.articles || []).length);
    } catch (err) {
      console.error(`Failed to load ${activeTab}:`, err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadItems();
    setShowForm(false);
    setEditingItem(null);
  }, [loadItems]);

  // Save handler
  const handleSave = async (data) => {
    try {
      const endpoint = activeTab === 'articles' ? 'articles'
        : activeTab === 'tips' ? 'tips'
        : activeTab === 'news' ? 'news'
        : activeTab === 'facts' ? 'facts'
        : 'authors';

      if (editingItem) {
        await api.put(`/tech-hub/${endpoint}/${editingItem._id}`, data);
        toast.success(`${activeTab.slice(0, -1)} updated`);
      } else {
        await api.post(`/tech-hub/${endpoint}`, data);
        toast.success(`${activeTab.slice(0, -1)} created`);
      }
      setShowForm(false);
      setEditingItem(null);
      loadItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  // Delete handler
  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      const endpoint = activeTab === 'articles' ? 'articles'
        : activeTab === 'tips' ? 'tips'
        : activeTab === 'news' ? 'news'
        : activeTab === 'facts' ? 'facts'
        : 'authors';
      await api.delete(`/tech-hub/${endpoint}/${id}`);
      toast.success('Deleted');
      loadItems();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  // Publish handler
  const handlePublish = async (id) => {
    try {
      const endpoint = activeTab === 'articles' ? 'articles'
        : activeTab === 'tips' ? 'tips'
        : activeTab === 'news' ? 'news'
        : activeTab === 'facts' ? 'facts'
        : 'authors';
      await api.post(`/tech-hub/${endpoint}/${id}/publish`);
      toast.success('Published to Tech Hub');
      loadItems();
    } catch (err) {
      toast.error('Failed to publish');
    }
  };

  // Open editor
  const openEditor = (item = null) => {
    setEditingItem(item);
    setShowForm(true);
  };

  // Render item list
  const renderItemRow = (item, index) => {
    const isArticle = activeTab === 'articles';
    const isTip = activeTab === 'tips';
    const isNews = activeTab === 'news';
    const isFact = activeTab === 'facts';
    const isAuthor = activeTab === 'authors';

    return (
      <tr key={item._id} style={{ borderBottom: '1px solid #040c1a', background: index % 2 === 0 ? 'transparent' : '#050d1a' }}>
        <td style={{ padding: '0.6rem 0.75rem' }}>
          {item.imageUrl && <img src={item.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', marginRight: 8, verticalAlign: 'middle' }} />}
          <span style={{ fontWeight: 600, color: '#F4F1EA' }}>{item.title}</span>
          {item.featured && <span style={{ marginLeft: 6, color: '#EE6100', fontSize: 10 }}>★</span>}
        </td>
        {isArticle && (
          <td style={{ padding: '0.6rem 0.75rem' }}>
            <Badge label={item.category} color={CATEGORIES.find((c) => c.value === item.category)?.color} />
          </td>
        )}
        {isTip && (
          <td style={{ padding: '0.6rem 0.75rem' }}>
            <Badge label={item.difficulty} color={DIFFICULTY_COLORS[item.difficulty]} />
          </td>
        )}
        {isNews && (
          <td style={{ padding: '0.6rem 0.75rem', color: '#4a6a8a', fontSize: 11 }}>{item.source || '—'}</td>
        )}
        {isFact && (
          <td style={{ padding: '0.6rem 0.75rem', color: '#4a6a8a', fontSize: 11 }}>{item.category || '—'}</td>
        )}
        {isAuthor && (
          <td style={{ padding: '0.6rem 0.75rem', color: '#4a6a8a', fontSize: 11 }}>{item.bio?.slice(0, 60) || '—'}</td>
        )}
        <td style={{ padding: '0.6rem 0.75rem', color: '#4a6a8a', fontSize: 11 }}>
          {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '—'}
        </td>
        <td style={{ padding: '0.6rem 0.75rem' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => openEditor(item)} style={{ padding: '3px 8px', background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>EDIT</button>
            <button onClick={() => handlePublish(item._id)} style={{ padding: '3px 8px', background: '#00ff8822', color: '#00ff88', border: '1px solid #00ff8844', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>PUBLISH</button>
            <button onClick={() => setShowScheduler(item)} style={{ padding: '3px 8px', background: '#ffd70022', color: '#ffd700', border: '1px solid #ffd70044', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>📅</button>
            <button onClick={() => handleDelete(item._id)} style={{ padding: '3px 8px', background: '#ff336622', color: '#ff3366', border: '1px solid #ff336644', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>DEL</button>
          </div>
        </td>
      </tr>
    );
  };

  const tabColor = CONTENT_TABS.find((t) => t.key === activeTab)?.color || color;

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", color: '#c0d8f0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color }}>🎛 Tech Studio</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#4a6a8a' }}>
            Manage all Tech Hub content •
            {sanityConfigured && studioUrl && (
              <a href={studioUrl} target="_blank" rel="noopener" style={{ color: '#2BB6A3', marginLeft: 4 }}>
                Open Sanity Studio →
              </a>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!sanityConfigured && (
            <span style={{ padding: '4px 10px', background: '#ffd70022', border: '1px solid #ffd70044', borderRadius: 6, fontSize: 11, color: '#ffd700' }}>
              ⚠️ Sanity not configured
            </span>
          )}
          <button onClick={() => openEditor(null)}
            style={{ padding: '0.5rem 1rem', background: color, color: '#000', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            + New {activeTab.slice(0, -1)}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(36,74,68,0.4)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {CONTENT_TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: '0.6rem 1.2rem', background: activeTab === key ? `${tabColor}15` : 'transparent',
            color: activeTab === key ? tabColor : '#4a6a8a', border: 'none',
            borderBottom: activeTab === key ? `2px solid ${tabColor}` : '2px solid transparent',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {label} <span style={{ opacity: 0.6 }}>({key === activeTab ? total : '—'})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {showForm ? (
        <div style={{
          background: '#0B1F1B', border: `1px solid ${color}44`, borderRadius: 12,
          padding: '1.5rem', maxWidth: 600,
        }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: 16, color: '#F4F1EA' }}>
            {editingItem ? '✏️ Edit' : '📝 New'} {activeTab.slice(0, -1)}
          </h3>
          {activeTab === 'articles' && <ArticleForm article={editingItem} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingItem(null); }} />}
          {activeTab === 'tips' && <TipForm tip={editingItem} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingItem(null); }} />}
          {activeTab === 'news' && <NewsForm item={editingItem} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingItem(null); }} />}
          {activeTab === 'facts' && <FactForm item={editingItem} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingItem(null); }} />}
          {activeTab === 'authors' && <AuthorForm author={editingItem} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingItem(null); }} />}
        </div>
      ) : loading ? (
        <p style={{ color: '#4a6a8a', padding: '2rem', textAlign: 'center' }}>Loading...</p>
      ) : items.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#2a4a6a' }}>
          <p style={{ fontSize: 24 }}>📭</p>
          <p>No {activeTab} found. Create your first one!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #0a2040' }}>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#4a6a8a', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Title</th>
                {activeTab === 'articles' && <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#4a6a8a', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Category</th>}
                {activeTab === 'tips' && <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#4a6a8a', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Difficulty</th>}
                {activeTab === 'news' && <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#4a6a8a', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Source</th>}
                {activeTab === 'facts' && <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#4a6a8a', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Category</th>}
                {activeTab === 'authors' && <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#4a6a8a', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Bio</th>}
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#4a6a8a', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Published</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#4a6a8a', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => renderItemRow(item, i))}
            </tbody>
          </table>
        </div>
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
            onSchedule={() => { setShowScheduler(null); loadItems(); }}
            onCancel={() => setShowScheduler(null)}
          />
        </div>
      )}
    </div>
  );
}
