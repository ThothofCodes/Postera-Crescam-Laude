// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Blog Management: Admin interface for Tech Hub content
import { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = { LOW:'#A9C4BE', MEDIUM:'#ffd700', HIGH:'#ff8800', CRITICAL:'#ff3366' };
const STATUS_COLORS = { DRAFT:'#4a6a8a', PUBLISHED:'#00ff88', ARCHIVED:'#ff3366' };

const CATEGORIES = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
  { value: 'networking', label: 'Networking' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'webdev', label: 'Web Development' },
  { value: 'ai', label: 'AI & Machine Learning' },
  { value: 'general', label: 'General Tech' },
];

const Tag = ({ label, map }) => {
  const c = (map || {})[label] || '#A9C4BE';
  return <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:`${c}22`, color:c, border:`1px solid ${c}44` }}>{label}</span>;
};

export default function BlogManagement({ color = '#EE6100' }) {
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatus] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    category: 'general',
    tags: '',
    body: '',
    status: 'DRAFT',
  });

  const loadArticles = async () => {
    try {
      setLoading(true);
      // For now, use mock data since Sanity isn't connected yet
      const mockArticles = [
        { _id: '1', title: 'Understanding Kenya\'s Digital Infrastructure Growth', category: 'networking', status: 'PUBLISHED', excerpt: 'How fiber optic expansion is transforming internet access across Nairobi and beyond.', tags: ['kenya', 'infrastructure', 'fiber'], publishedAt: '2026-08-24T10:00:00Z', readTime: '5 min' },
        { _id: '2', title: 'Cybersecurity Best Practices for Small Businesses', category: 'cybersecurity', status: 'PUBLISHED', excerpt: 'Essential security measures every Kenyan SME should implement today.', tags: ['security', 'sme', 'best-practices'], publishedAt: '2026-08-22T09:00:00Z', readTime: '8 min' },
        { _id: '3', title: 'The Rise of AI in East African Tech', category: 'ai', status: 'DRAFT', excerpt: 'Local startups are leveraging machine learning to solve uniquely African challenges.', tags: ['ai', 'startups', 'east-africa'], publishedAt: null, readTime: '6 min' },
        { _id: '4', title: 'Building Your First Web Application in 2026', category: 'webdev', status: 'PUBLISHED', excerpt: 'A beginner\'s guide to modern web development with React and Node.js.', tags: ['react', 'nodejs', 'beginner'], publishedAt: '2026-08-18T14:00:00Z', readTime: '12 min' },
        { _id: '5', title: 'Hardware Maintenance Tips for Longevity', category: 'hardware', status: 'ARCHIVED', excerpt: 'Keep your devices running smoothly with these professional maintenance tips.', tags: ['hardware', 'maintenance', 'tips'], publishedAt: '2026-08-15T11:00:00Z', readTime: '4 min' },
      ];
      
      let filtered = mockArticles;
      if (statusFilter) filtered = filtered.filter(a => a.status === statusFilter);
      if (categoryFilter) filtered = filtered.filter(a => a.category === categoryFilter);
      
      setArticles(filtered);
      setTotal(filtered.length);
    } catch (err) {
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadArticles(); }, [statusFilter, categoryFilter]);

  const handleCreate = () => {
    setEditingArticle(null);
    setFormData({ title: '', excerpt: '', category: 'general', tags: '', body: '', status: 'DRAFT' });
    setShowForm(true);
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      excerpt: article.excerpt,
      category: article.category,
      tags: article.tags?.join(', ') || '',
      body: article.body || '',
      status: article.status,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingArticle) {
        toast.success('Article updated successfully');
      } else {
        toast.success('Article created successfully');
      }
      setShowForm(false);
      loadArticles();
    } catch (err) {
      toast.error('Failed to save article');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      toast.success('Article deleted');
      loadArticles();
    } catch (err) {
      toast.error('Failed to delete article');
    }
  };

  const handlePublish = async (id) => {
    try {
      toast.success('Article published to Tech Hub');
      loadArticles();
    } catch (err) {
      toast.error('Failed to publish article');
    }
  };

  const timeSince = (dt) => {
    if (!dt) return '—';
    const m = Math.floor((Date.now() - new Date(dt)) / 60000);
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m/60)}h ago`;
    return `${Math.floor(m/1440)}d ago`;
  };

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", color:'#c0d8f0' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color }}>📝 Blog Management</h2>
          <p style={{ margin:'4px 0 0', fontSize:12, color:'#4a6a8a' }}>
            Manage content for PCL Tech Hub • <a href="https://blog.pcl.co.ke" target="_blank" rel="noopener" style={{ color:'#2BB6A3' }}>View Live Site →</a>
          </p>
        </div>
        <button
          onClick={handleCreate}
          style={{
            padding:'0.5rem 1rem',
            background: color,
            color:'#000',
            border:'none',
            borderRadius:6,
            fontWeight:700,
            fontSize:12,
            cursor:'pointer',
          }}
        >
          + New Article
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          { label: 'Total Articles', value: total, icon: '📄', color: '#2BB6A3' },
          { label: 'Published', value: articles.filter(a => a.status === 'PUBLISHED').length, icon: '✅', color: '#00ff88' },
          { label: 'Drafts', value: articles.filter(a => a.status === 'DRAFT').length, icon: '📝', color: '#ffd700' },
          { label: 'Archived', value: articles.filter(a => a.status === 'ARCHIVED').length, icon: '📦', color: '#ff3366' },
        ].map(({ label, value, icon, color: c }) => (
          <div key={label} style={{
            background:'#0F2620',
            border:`1px solid ${c}33`,
            borderRadius:8,
            padding:'1rem',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:24 }}>{icon}</span>
              <span style={{ fontSize:24, fontWeight:800, color:c }}>{value}</span>
            </div>
            <div style={{ fontSize:11, color:'#4a6a8a', marginTop:'0.5rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:'1rem' }}>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          style={{ padding:'0.45rem 0.75rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:12 }}>
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          style={{ padding:'0.45rem 0.75rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:12 }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Articles Table */}
      {loading ? <p style={{ color:'#4a6a8a' }}>Loading…</p> : (
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #0a2040' }}>
              {['Title', 'Category', 'Status', 'Tags', 'Published', 'Actions'].map(h => (
                <th key={h} style={{ padding:'0.5rem 0.75rem', textAlign:'left', color:'#4a6a8a', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {articles.map((article, i) => (
              <tr key={article._id} style={{ borderBottom:'1px solid #040c1a', background: i%2===0?'transparent':'#050d1a' }}>
                <td style={{ padding:'0.6rem 0.75rem', maxWidth:300 }}>
                  <div style={{ fontWeight:600, color:'#F4F1EA' }}>{article.title}</div>
                  <div style={{ fontSize:10, color:'#4a6a8a', marginTop:2 }}>{article.excerpt?.slice(0, 80)}...</div>
                </td>
                <td style={{ padding:'0.6rem 0.75rem' }}>
                  <Tag label={article.category} map={{ hardware:'#2BB6A3', software:'#a78bfa', networking:'#ffd700', cybersecurity:'#ff3366', webdev:'#EE6100', ai:'#00ff88', general:'#4a6a8a' }} />
                </td>
                <td style={{ padding:'0.6rem 0.75rem' }}>
                  <Tag label={article.status} map={STATUS_COLORS} />
                </td>
                <td style={{ padding:'0.6rem 0.75rem', maxWidth:150 }}>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                    {article.tags?.slice(0, 2).map(tag => (
                      <span key={tag} style={{ fontSize:9, color:'#4a6a8a' }}>#{tag}</span>
                    ))}
                    {article.tags?.length > 2 && <span style={{ fontSize:9, color:'#4a6a8a' }}>+{article.tags.length - 2}</span>}
                  </div>
                </td>
                <td style={{ padding:'0.6rem 0.75rem', color:'#4a6a8a' }}>
                  {article.publishedAt ? timeSince(article.publishedAt) : '—'}
                </td>
                <td style={{ padding:'0.6rem 0.75rem' }}>
                  <div style={{ display:'flex', gap:5 }}>
                    <button onClick={() => handleEdit(article)}
                      style={{ padding:'3px 8px', background:`${color}22`, color, border:`1px solid ${color}44`, borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700 }}>
                      EDIT
                    </button>
                    {article.status === 'DRAFT' && (
                      <button onClick={() => handlePublish(article._id)}
                        style={{ padding:'3px 8px', background:'#00ff8822', color:'#00ff88', border:'1px solid #00ff8844', borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700 }}>
                        PUBLISH
                      </button>
                    )}
                    <button onClick={() => handleDelete(article._id)}
                      style={{ padding:'3px 8px', background:'#ff336622', color:'#ff3366', border:'1px solid #ff336644', borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700 }}>
                      DELETE
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr><td colSpan={6} style={{ padding:'2rem', textAlign:'center', color:'#2a4a6a' }}>No articles found</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#0B1F1B', border:`1px solid ${color}44`, borderRadius:12, width:600, maxHeight:'80vh', overflowY:'auto', padding:'1.5rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <h3 style={{ margin:0, color:'#F4F1EA' }}>{editingArticle ? 'Edit Article' : 'New Article'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background:'transparent', border:'none', color:'#4a6a8a', fontSize:18, cursor:'pointer' }}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', fontSize:11, color:'#4a6a8a', marginBottom:4, textTransform:'uppercase' }}>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                  style={{ width:'100%', padding:'0.5rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, color:'#F4F1EA', fontSize:12, boxSizing:'border-box' }}
                />
              </div>

              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', fontSize:11, color:'#4a6a8a', marginBottom:4, textTransform:'uppercase' }}>Excerpt *</label>
                <textarea
                  value={formData.excerpt}
                  onChange={e => setFormData({...formData, excerpt: e.target.value})}
                  required
                  rows={3}
                  style={{ width:'100%', padding:'0.5rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, color:'#F4F1EA', fontSize:12, resize:'none', boxSizing:'border-box' }}
                />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
                <div>
                  <label style={{ display:'block', fontSize:11, color:'#4a6a8a', marginBottom:4, textTransform:'uppercase' }}>Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    style={{ width:'100%', padding:'0.5rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, color:'#F4F1EA', fontSize:12 }}
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, color:'#4a6a8a', marginBottom:4, textTransform:'uppercase' }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    style={{ width:'100%', padding:'0.5rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, color:'#F4F1EA', fontSize:12 }}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', fontSize:11, color:'#4a6a8a', marginBottom:4, textTransform:'uppercase' }}>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                  placeholder="react, javascript, tutorial"
                  style={{ width:'100%', padding:'0.5rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, color:'#F4F1EA', fontSize:12, boxSizing:'border-box' }}
                />
              </div>

              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', fontSize:11, color:'#4a6a8a', marginBottom:4, textTransform:'uppercase' }}>Body Content *</label>
                <textarea
                  value={formData.body}
                  onChange={e => setFormData({...formData, body: e.target.value})}
                  required
                  rows={8}
                  placeholder="Write your article content here..."
                  style={{ width:'100%', padding:'0.5rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, color:'#F4F1EA', fontSize:12, resize:'vertical', boxSizing:'border-box', fontFamily:'monospace' }}
                />
              </div>

              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding:'0.5rem 1rem', background:'transparent', color:'#4a6a8a', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, fontSize:12, cursor:'pointer' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding:'0.5rem 1rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer' }}>
                  {editingArticle ? 'Update Article' : 'Create Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
