// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { formatKES, formatDate } from '../utils/helpers';
import { Spinner, EmptyState } from '../components/UI';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import { T, btn, btnSm, tabPill, badge } from '../utils/theme';

const EMPTY = { name: '', phone: '', email: '', clientType: 'individual', notes: '' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clientType, setClientType] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/clients', { params: { search, clientType, page, limit: 20 } });
      setClients(data.clients); setTotal(data.total);
    } catch { toast.error('Failed to load clients'); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [search, clientType, page]);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'create') { await api.post('/clients', form); toast.success('Client created'); }
      else { await api.put(`/clients/${modal._id}`, form); toast.success('Updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm('Delete this client?')) return;
    await api.delete(`/clients/${id}`); toast.success('Deleted'); load();
  };

  return (
    <div style={T.page}>
      <div style={T.headerRow}>
        <h2 style={T.h2}>Clients ({total})</h2>
        <button onClick={() => { setForm(EMPTY); setModal('create'); }} style={btn('primary')}>+ New Client</button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input placeholder="Search name or phone..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ ...T.input, flex: 1, minWidth: 200 }} />
        <select value={clientType} onChange={(e) => { setClientType(e.target.value); setPage(1); }} style={{ ...T.input, width: 'auto' }}>
          <option value="">All Types</option>
          {['individual', 'sme', 'institution', 'ngo'].map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : clients.length === 0 ? <EmptyState message="No clients found" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={T.table}>
            <thead><tr style={T.thead}>
              {['Name', 'Phone', 'Email', 'Type', 'Bookings', 'Total Spent', 'Joined', 'Actions'].map((h) => <th key={h} style={T.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c._id} style={T.trHover}>
                  <td style={T.tdBold}>{c.name}</td>
                  <td style={T.td}>{c.phone}</td>
                  <td style={T.td}>{c.email || '—'}</td>
                  <td style={T.td}><span style={badge}>{c.clientType}</span></td>
                  <td style={T.td}>{c.bookingCount}</td>
                  <td style={T.td}>{formatKES(c.totalSpent)}</td>
                  <td style={T.td}>{formatDate(c.createdAt)}</td>
                  <td style={T.td}>
                    <button onClick={() => { setForm({ name: c.name, phone: c.phone, email: c.email || '', clientType: c.clientType, notes: c.notes || '' }); setModal(c); }} style={btnSm('blue')}>Edit</button>
                    <button onClick={() => del(c._id)} style={btnSm('danger')}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {page > 1 && <button onClick={() => setPage(p => p - 1)} style={btn('ghost')}>← Prev</button>}
        {clients.length === 20 && <button onClick={() => setPage(p => p + 1)} style={btn('ghost')}>Next →</button>}
      </div>

      {modal && (
        <div style={T.overlay}>
          <div style={T.modal}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#EE6100,#244A44,#2BB6A3)', borderRadius: '14px 14px 0 0' }} />
            <h3 style={T.modalH3}>{modal === 'create' ? 'New Client' : 'Edit Client'}</h3>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['name', 'Name'], ['phone', 'Phone'], ['email', 'Email (optional)']].map(([k, l]) => (
                <div key={k}>
                  <label style={T.label}>{l}</label>
                  <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    required={k !== 'email'} style={T.input} />
                </div>
              ))}
              <div>
                <label style={T.label}>Type</label>
                <select value={form.clientType} onChange={(e) => setForm({ ...form, clientType: e.target.value })} style={T.input}>
                  {['individual', 'sme', 'institution', 'ngo'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={T.label}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...T.input, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
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
