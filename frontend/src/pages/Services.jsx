// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { formatKES } from '../utils/helpers';
import { Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';
import { T, btn, btnSm, tabPill, badge } from '../utils/theme';

const CATEGORIES = ['internet', 'printing', 'gaming', 'web-dev', 'cybersecurity', 'hardware', 'it-support', 'social-media', 'other'];
const EMPTY = { name: '', category: 'internet', description: '', basePrice: '', priceUnit: 'per session', isActive: true };

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/services', { params: { category } });
    setServices(data); setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [category]);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'create') { await api.post('/services', form); toast.success('Service created'); }
      else { await api.put(`/services/${modal._id}`, form); toast.success('Updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm('Delete?')) return;
    await api.delete(`/services/${id}`); toast.success('Deleted'); load();
  };

  const seed = async () => {
    if (!window.confirm('Replace all services with defaults?')) return;
    await api.post('/services/seed'); toast.success('Services seeded'); load();
  };

  return (
    <div style={T.page}>
      <div style={T.headerRow}>
        <h2 style={T.h2}>Services</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={seed} style={btn('ghost')}>Seed Defaults</button>
          <button onClick={() => { setForm(EMPTY); setModal('create'); }} style={btn('primary')}>+ New Service</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['', ...CATEGORIES].map((c) => <button key={c} onClick={() => setCategory(c)} style={tabPill(category === c)}>{c || 'All'}</button>)}
      </div>

      {loading ? <Spinner /> : services.length === 0 ? <EmptyState message="No services found" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {services.map((s) => (
            <div key={s._id} style={{ ...T.card, opacity: s.isActive ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#F4F1EA', fontSize: 15, fontFamily: "'Poppins',sans-serif" }}>{s.name}</p>
                  <span style={badge}>{s.category}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 800, fontSize: 17, background: 'linear-gradient(90deg,#FF8A3D,#A9C4BE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontFamily: "'Poppins',sans-serif" }}>{formatKES(s.basePrice)}</span>
                  <div style={{ fontSize: 11, color: '#6A8A82', fontFamily: "'Inter',sans-serif" }}>{s.priceUnit}</div>
                </div>
              </div>
              {s.description && <p style={{ fontSize: 13, color: '#A9C4BE', margin: '0 0 10px', lineHeight: 1.5, fontFamily: "'Inter',sans-serif" }}>{s.description}</p>}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => { setForm({ name: s.name, category: s.category, description: s.description || '', basePrice: s.basePrice, priceUnit: s.priceUnit, isActive: s.isActive }); setModal(s); }} style={btnSm('blue')}>Edit</button>
                <button onClick={() => del(s._id)} style={btnSm('danger')}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={T.overlay}>
          <div style={T.modal}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#EE6100,#244A44,#2BB6A3)', borderRadius: '14px 14px 0 0' }} />
            <h3 style={T.modalH3}>{modal === 'create' ? 'New Service' : 'Edit Service'}</h3>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={T.label}>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={T.input} /></div>
              <div>
                <label style={T.label}>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={T.input}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={T.label}>Base Price (KES)</label><input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} required min={0} style={T.input} /></div>
              <div><label style={T.label}>Price Unit</label><input value={form.priceUnit} onChange={(e) => setForm({ ...form, priceUnit: e.target.value })} style={T.input} /></div>
              <div><label style={T.label}>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...T.input, resize: 'vertical' }} /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#A9C4BE', fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModal(null)} style={btn('ghost')}>Cancel</button>
                <button type="submit" disabled={saving} style={btn('primary')}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
