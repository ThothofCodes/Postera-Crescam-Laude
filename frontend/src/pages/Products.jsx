// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { formatKES, noImagePlaceholder } from '../utils/helpers';
import { Spinner, EmptyState } from '../components/UI';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import { T, btn, btnSm, tabPill, badge } from '../utils/theme';

const CATS = ['electronics', 'accessories', 'software', 'services'];
const EMPTY = { name: '', category: 'electronics', description: '', shortDesc: '', price: '', comparePrice: '', stock: 0, isDigital: false, isActive: true, featured: false, warranty: 'No warranty', tags: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/products', { params: { category, page, limit: 20 } });
    setProducts(data.products); setTotal(data.total);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [category, page]);

  const openEdit = (p) => {
    setForm({ name: p.name, category: p.category, description: p.description, shortDesc: p.shortDesc || '', price: p.price, comparePrice: p.comparePrice || '', stock: p.stock, isDigital: p.isDigital, isActive: p.isActive, featured: p.featured, warranty: p.warranty, tags: p.tags?.join(', ') || '' });
    setFiles([]); setModal(p);
  };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append('images', f));
      if (modal === 'create') { await api.post('/products', fd); toast.success('Product created'); }
      else { await api.put(`/products/${modal._id}`, fd); toast.success('Updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    await api.delete(`/products/${id}`); toast.success('Deactivated'); load();
  };

  const seed = async () => {
    if (!window.confirm('Seed sample products?')) return;
    await api.post('/products/seed'); toast.success('Products seeded'); load();
  };

  return (
    <div style={T.page}>
      <div style={T.headerRow}>
        <h2 style={T.h2}>Products ({total})</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={seed} style={btn('ghost')}>Seed Samples</button>
          <button onClick={() => { setForm(EMPTY); setFiles([]); setModal('create'); }} style={btn('primary')}>+ New Product</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['', ...CATS].map((c) => <button key={c} onClick={() => { setCategory(c); setPage(1); }} style={tabPill(category === c)}>{c || 'All'}</button>)}
      </div>

      {loading ? <Spinner /> : products.length === 0 ? <EmptyState icon="📦" message="No products found" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={T.table}>
            <thead><tr style={T.thead}>
              {['Image', 'Name', 'Category', 'Price', 'Stock', 'Featured', 'Active', 'Actions'].map((h) => <th key={h} style={T.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} style={T.trHover}>
                  <td style={T.td}><img src={p.images?.[0] || noImagePlaceholder(50, 50)} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(244,241,234,0.1)' }} /></td>
                  <td style={T.tdBold}>{p.name}</td>
                  <td style={T.td}><span style={badge}>{p.category}</span></td>
                  <td style={T.td}>
                    <span style={{ fontWeight: 700, color: '#F4F1EA' }}>{formatKES(p.price)}</span>
                    {p.comparePrice ? <span style={{ textDecoration: 'line-through', color: '#6A8A82', fontSize: 11, marginLeft: 6 }}>{formatKES(p.comparePrice)}</span> : null}
                  </td>
                  <td style={T.td}>{p.isDigital ? <span style={{ color: '#2BB6A3' }}>∞ digital</span> : p.stock}</td>
                  <td style={T.td}>{p.featured ? '⭐' : '—'}</td>
                  <td style={T.td}><StatusBadge status={p.isActive ? 'active' : 'inactive'} /></td>
                  <td style={T.td}>
                    <button onClick={() => openEdit(p)} style={btnSm('blue')}>Edit</button>
                    <button onClick={() => del(p._id)} style={btnSm('danger')}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {page > 1 && <button onClick={() => setPage(p => p - 1)} style={btn('ghost')}>← Prev</button>}
        {products.length === 20 && <button onClick={() => setPage(p => p + 1)} style={btn('ghost')}>Next →</button>}
      </div>

      {modal && (
        <div style={T.overlay}>
          <div style={T.modalWide}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#EE6100,#244A44,#2BB6A3)', borderRadius: '14px 14px 0 0' }} />
            <h3 style={T.modalH3}>{modal === 'create' ? 'New Product' : 'Edit Product'}</h3>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={T.label}>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={T.input} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={T.label}>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={T.input}>
                    {CATS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={T.label}>Short Description</label><input value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} style={T.input} /></div>
              </div>
              <div><label style={T.label}>Full Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} style={{ ...T.input, resize: 'vertical' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={T.label}>Price (KES)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min={0} style={T.input} /></div>
                <div><label style={T.label}>Compare Price</label><input type="number" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} style={T.input} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={T.label}>Stock</label><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} min={0} style={T.input} /></div>
                <div><label style={T.label}>Warranty</label><input value={form.warranty} onChange={(e) => setForm({ ...form, warranty: e.target.value })} style={T.input} /></div>
              </div>
              <div><label style={T.label}>Tags (comma separated)</label><input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} style={T.input} /></div>
              <div><label style={T.label}>Images</label><input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files))} style={{ color: '#A9C4BE', fontSize: 13 }} /></div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[['isDigital', 'Digital Product'], ['isActive', 'Active'], ['featured', 'Featured']].map(([k, l]) => (
                  <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#A9C4BE', fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                    <input type="checkbox" checked={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} /> {l}
                  </label>
                ))}
              </div>
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
