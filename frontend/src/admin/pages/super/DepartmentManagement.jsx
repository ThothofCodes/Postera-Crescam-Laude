// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Super Admin: Department Management
import { useState, useEffect } from 'react';
import { api } from '../../../utils/api';

const PRESET_COLORS = [
  '#2BB6A3', '#A78BFA', '#FFD700', '#FFB020', '#FF3B3B', '#60A5FA',
  '#39FF88', '#FF6B6B', '#F472B6', '#818CF8', '#34D399', '#FB923C',
];

const PRESET_ICONS = ['🌐', '💻', '🎮', '🔧', '🛡️', '🏛️', '📡', '⚙️', '🛒', '📊', '🎯', '🚀', '💡', '🔧', '📱', '🖥️'];

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, object = edit
  const [form, setForm] = useState({ name: '', slug: '', description: '', color: '#2BB6A3', icon: '◈', contactEmail: '', contactPhone: '', operatingHours: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/departments/all');
      setDepartments(data);
    } catch { setError('Failed to load departments'); }
    setLoading(false);
  };

  const slugify = (text) => text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !editing) next.slug = slugify(value);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (editing) {
        await api.put(`/departments/${editing.slug}`, form);
        setSuccess(`Department "${form.name}" updated successfully`);
      } else {
        await api.post('/departments', form);
        setSuccess(`Department "${form.name}" created successfully`);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', slug: '', description: '', color: '#2BB6A3', icon: '◈', contactEmail: '', contactPhone: '', operatingHours: '' });
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save department');
    }
    setSaving(false);
  };

  const handleEdit = (dept) => {
    setEditing(dept);
    setForm({
      name: dept.name,
      slug: dept.slug,
      description: dept.description || '',
      color: dept.color || '#2BB6A3',
      icon: dept.icon || '◈',
      contactEmail: dept.contactEmail || '',
      contactPhone: dept.contactPhone || '',
      operatingHours: dept.operatingHours || '',
    });
    setShowForm(true);
  };

  const handleToggle = async (slug) => {
    try {
      await api.put(`/departments/${slug}/toggle`);
      fetchDepartments();
    } catch { setError('Failed to toggle department'); }
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Delete "${dept.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/departments/${dept.slug}`);
      setSuccess(`Department "${dept.name}" deleted`);
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete department');
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('Seed default departments? This adds missing ones without overwriting existing.')) return;
    try {
      const { data } = await api.post('/departments/seed');
      setSuccess(data.message);
      fetchDepartments();
    } catch { setError('Failed to seed departments'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#081916', color: '#A9C4BE', fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '2rem 2rem 0', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 28, fontWeight: 700, color: '#EE6100', margin: 0 }}>
              ◉ Department Management
            </h1>
            <p style={{ fontSize: 13, color: '#6A8A82', margin: '4px 0 0' }}>
              Add, edit, and manage business departments
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSeed}
              style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#6A8A82', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: "'Poppins', sans-serif" }}>
              🌱 Seed Defaults
            </button>
            <button onClick={() => { setEditing(null); setForm({ name: '', slug: '', description: '', color: '#2BB6A3', icon: '◈', contactEmail: '', contactPhone: '', operatingHours: '' }); setShowForm(true); }}
              style={{ padding: '0.5rem 1.25rem', background: '#EE6100', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: "'Poppins', sans-serif" }}>
              + Add Department
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {error && <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.3)', borderRadius: 6, color: '#FF3B3B', fontSize: 13, marginBottom: 16 }}>{error}</div>}
        {success && <div style={{ padding: '0.75rem 1rem', background: 'rgba(43,182,163,0.1)', border: '1px solid rgba(43,182,163,0.3)', borderRadius: 6, color: '#2BB6A3', fontSize: 13, marginBottom: 16 }}>{success}</div>}
      </div>

      {/* Department Cards */}
      <div style={{ padding: '0 2rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6A8A82' }}>Loading departments...</div>
        ) : departments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#0B1F1B', borderRadius: 10, border: '1px solid rgba(36,74,68,0.3)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <p style={{ color: '#6A8A82', margin: 0 }}>No departments found. Click "Add Department" or "Seed Defaults" to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {departments.map((dept) => (
              <div key={dept._id} style={{
                background: '#0B1F1B',
                border: `1px solid ${dept.isActive ? (dept.color || '#2BB6A3') + '40' : 'rgba(36,74,68,0.2)'}`,
                borderRadius: 10,
                padding: '1.25rem',
                opacity: dept.isActive ? 1 : 0.5,
                transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 8,
                      background: (dept.color || '#2BB6A3') + '20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20,
                    }}>
                      {dept.icon || '◈'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#E8F0EE', fontSize: 15 }}>{dept.name}</div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: dept.color || '#2BB6A3' }}>/{dept.slug}</div>
                    </div>
                  </div>
                  <div style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                    background: dept.isActive ? 'rgba(43,182,163,0.15)' : 'rgba(255,59,59,0.15)',
                    color: dept.isActive ? '#2BB6A3' : '#FF3B3B',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {dept.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                {dept.description && (
                  <p style={{ fontSize: 12, color: '#6A8A82', margin: '0 0 10px', lineHeight: 1.5 }}>{dept.description}</p>
                )}

                {/* Color swatch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: dept.color || '#2BB6A3', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#6A8A82' }}>{dept.color || '#2BB6A3'}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, borderTop: '1px solid rgba(36,74,68,0.2)', paddingTop: 10 }}>
                  <button onClick={() => handleEdit(dept)}
                    style={{ flex: 1, padding: '0.4rem', background: 'rgba(43,182,163,0.1)', color: '#2BB6A3', border: '1px solid rgba(43,182,163,0.3)', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: "'Poppins', sans-serif" }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleToggle(dept.slug)}
                    style={{ flex: 1, padding: '0.4rem', background: dept.isActive ? 'rgba(255,176,32,0.1)' : 'rgba(43,182,163,0.1)', color: dept.isActive ? '#FFB020' : '#2BB6A3', border: `1px solid ${dept.isActive ? 'rgba(255,176,32,0.3)' : 'rgba(43,182,163,0.3)'}`, borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: "'Poppins', sans-serif" }}>
                    {dept.isActive ? '⏸ Disable' : '▶ Enable'}
                  </button>
                  <button onClick={() => handleDelete(dept)}
                    style={{ padding: '0.4rem 0.75rem', background: 'rgba(255,59,59,0.1)', color: '#FF3B3B', border: '1px solid rgba(255,59,59,0.3)', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: "'Poppins', sans-serif" }}>
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditing(null); } }}>
          <div style={{ background: '#0B1F1B', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 12, padding: '1.5rem', width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 22, fontWeight: 700, color: '#EE6100', margin: '0 0 1rem' }}>
              {editing ? '✏️ Edit Department' : '➕ Add Department'}
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Name */}
              <label style={labelStyle}>Department Name *</label>
              <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} required
                placeholder="e.g. Cloud Services" style={inputStyle} />

              {/* Slug */}
              <label style={labelStyle}>Slug (URL-safe ID) *</label>
              <input value={form.slug} onChange={(e) => handleChange('slug', e.target.value)} required
                placeholder="e.g. cloud-services" style={{ ...inputStyle, fontFamily: "'Share Tech Mono', monospace" }} />
              <div style={{ fontSize: 10, color: '#6A8A82', margin: '-4px 0 10px' }}>
                Auto-generated from name. Only lowercase letters, numbers, and hyphens.
              </div>

              {/* Description */}
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of this department's services" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />

              {/* Icon */}
              <label style={labelStyle}>Icon</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {PRESET_ICONS.map((ic) => (
                  <button key={ic} type="button" onClick={() => handleChange('icon', ic)}
                    style={{
                      width: 36, height: 36, borderRadius: 6, border: form.icon === ic ? `2px solid ${form.color}` : '1px solid rgba(36,74,68,0.3)',
                      background: form.icon === ic ? (form.color || '#2BB6A3') + '20' : '#081916',
                      cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {ic}
                  </button>
                ))}
                <input value={form.icon} onChange={(e) => handleChange('icon', e.target.value)}
                  style={{ ...inputStyle, width: 60, textAlign: 'center', margin: 0 }} maxLength={4} />
              </div>

              {/* Color */}
              <label style={labelStyle}>Accent Color</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {PRESET_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => handleChange('color', c)}
                    style={{
                      width: 28, height: 28, borderRadius: 6, background: c, border: form.color === c ? '2px solid #fff' : '2px solid transparent',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }} />
                ))}
                <input type="color" value={form.color} onChange={(e) => handleChange('color', e.target.value)}
                  style={{ width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', padding: 0 }} />
              </div>

              {/* Contact */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Contact Email</label>
                  <input type="email" value={form.contactEmail} onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="dept@pcl.co.ke" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Contact Phone</label>
                  <input value={form.contactPhone} onChange={(e) => handleChange('contactPhone', e.target.value)}
                    placeholder="+254 700 000 000" style={inputStyle} />
                </div>
              </div>

              <label style={labelStyle}>Operating Hours</label>
              <input value={form.operatingHours} onChange={(e) => handleChange('operatingHours', e.target.value)}
                placeholder="Mon-Fri 8AM-6PM, Sat 9AM-2PM" style={inputStyle} />

              {/* Preview */}
              <div style={{ marginTop: 12, padding: '0.75rem', background: '#081916', borderRadius: 8, border: `1px solid ${form.color}40` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: form.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {form.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#E8F0EE', fontSize: 14 }}>{form.name || 'Department Name'}</div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: form.color }}>/{form.slug || 'slug'}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                  style={{ flex: 1, padding: '0.6rem', background: 'transparent', color: '#6A8A82', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", fontSize: 13 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, padding: '0.6rem', background: saving ? '#6A8A82' : '#EE6100', color: '#fff', border: 'none', borderRadius: 4, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: "'Poppins', sans-serif", fontSize: 13 }}>
                  {saving ? 'Saving...' : editing ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 11, color: '#6A8A82', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle = {
  width: '100%', padding: '0.5rem 0.75rem', background: '#081916', color: '#E8F0EE',
  border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, fontSize: 13,
  fontFamily: "'Poppins', sans-serif", marginBottom: 10, boxSizing: 'border-box',
};
