// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { formatKES, formatDate } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';
import { Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';
import { T, btn, btnSm, tabPill } from '../utils/theme';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const EMPTY = { client: '', service: '', scheduledAt: '', amountCharged: '', paymentMethod: 'cash', notes: '' };

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ paymentMethod: 'cash', mpesaRef: '', amount: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/bookings', { params: { status, page, limit: 20 } });
    setBookings(data.bookings); setTotal(data.total);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [status, page]);
  useEffect(() => {
    api.get('/clients?limit=100').then((r) => setClients(r.data.clients));
    api.get('/services').then((r) => setServices(r.data));
  }, []);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'create') { await api.post('/bookings', form); toast.success('Booking created'); }
      else { await api.put(`/bookings/${modal._id}`, form); toast.success('Updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  const updateStatus = async (id, newStatus) => {
    await api.put(`/bookings/${id}`, { status: newStatus });
    toast.success(`Status → ${newStatus}`); load();
  };

  const recordPay = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.put(`/bookings/${payModal._id}/payment`, { ...payForm, amount: Number(payForm.amount) });
      toast.success('Payment recorded'); setPayModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm('Delete?')) return;
    await api.delete(`/bookings/${id}`); toast.success('Deleted'); load();
  };

  return (
    <div style={T.page}>
      <div style={T.headerRow}>
        <h2 style={T.h2}>Bookings ({total})</h2>
        <button onClick={() => { setForm(EMPTY); setModal('create'); }} style={btn('primary')}>+ New Booking</button>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['', ...STATUSES].map((s) => <button key={s} onClick={() => { setStatus(s); setPage(1); }} style={tabPill(status === s)}>{s || 'All'}</button>)}
      </div>

      {loading ? <Spinner /> : bookings.length === 0 ? <EmptyState message="No bookings found" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={T.table}>
            <thead><tr style={T.thead}>
              {['Client', 'Service', 'Scheduled', 'Amount', 'Status', 'Payment', 'Actions'].map((h) => <th key={h} style={T.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} style={T.trHover}>
                  <td style={T.td}>
                    <div style={{ fontWeight: 600, color: '#F4F1EA' }}>{b.client?.name}</div>
                    <div style={{ fontSize: 11, color: '#6A8A82' }}>{b.client?.phone}</div>
                  </td>
                  <td style={T.td}>{b.service?.name}</td>
                  <td style={T.td}>{formatDate(b.scheduledAt)}</td>
                  <td style={{ ...T.td, fontWeight: 600, color: '#F4F1EA' }}>{formatKES(b.amountCharged)}</td>
                  <td style={T.td}>
                    <select value={b.status} onChange={(e) => updateStatus(b._id, e.target.value)}
                      style={{ background: 'rgba(14,10,20,0.7)', border: '1px solid rgba(244,241,234,0.1)', color: '#F4F1EA', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 12 }}>
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={T.td}><StatusBadge status={b.paymentStatus} /></td>
                  <td style={T.td}>
                    <button onClick={() => { setForm({ client: b.client._id, service: b.service._id, scheduledAt: b.scheduledAt?.slice(0, 16), amountCharged: b.amountCharged, paymentMethod: b.paymentMethod || 'cash', notes: b.notes || '' }); setModal(b); }} style={btnSm('blue')}>Edit</button>
                    {b.paymentStatus === 'unpaid' && <button onClick={() => { setPayModal(b); setPayForm({ paymentMethod: 'cash', mpesaRef: '', amount: b.amountCharged }); }} style={btnSm('green')}>Pay</button>}
                    <button onClick={() => del(b._id)} style={btnSm('danger')}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {page > 1 && <button onClick={() => setPage(p => p - 1)} style={btn('ghost')}>← Prev</button>}
        {bookings.length === 20 && <button onClick={() => setPage(p => p + 1)} style={btn('ghost')}>Next →</button>}
      </div>

      {modal && (
        <div style={T.overlay}>
          <div style={T.modal}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#EE6100,#244A44,#2BB6A3)', borderRadius: '14px 14px 0 0' }} />
            <h3 style={T.modalH3}>{modal === 'create' ? 'New Booking' : 'Edit Booking'}</h3>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={T.label}>Client</label>
                <select value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required style={T.input}>
                  <option value="">Select client...</option>
                  {clients.map((c) => <option key={c._id} value={c._id}>{c.name} — {c.phone}</option>)}
                </select>
              </div>
              <div>
                <label style={T.label}>Service</label>
                <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} required style={T.input}>
                  <option value="">Select service...</option>
                  {services.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div><label style={T.label}>Scheduled At</label><input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required style={T.input} /></div>
              <div><label style={T.label}>Amount (KES)</label><input type="number" value={form.amountCharged} onChange={(e) => setForm({ ...form, amountCharged: e.target.value })} required min={0} style={T.input} /></div>
              <div><label style={T.label}>Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...T.input, resize: 'vertical' }} /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModal(null)} style={btn('ghost')}>Cancel</button>
                <button type="submit" disabled={saving} style={btn('primary')}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payModal && (
        <div style={T.overlay}>
          <div style={{ ...T.modal, maxWidth: 400 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#27ae60,#2ecc71)', borderRadius: '14px 14px 0 0' }} />
            <h3 style={T.modalH3}>Record Payment — {payModal.client?.name}</h3>
            <form onSubmit={recordPay} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={T.label}>Method</label>
                <select value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })} style={T.input}>
                  {['cash', 'mpesa', 'bank'].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div><label style={T.label}>Amount (KES)</label><input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} required style={T.input} /></div>
              <div><label style={T.label}>M-Pesa Ref (optional)</label><input value={payForm.mpesaRef} onChange={(e) => setPayForm({ ...payForm, mpesaRef: e.target.value })} style={T.input} /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setPayModal(null)} style={btn('ghost')}>Cancel</button>
                <button type="submit" disabled={saving} style={btn('green')}>{saving ? 'Saving...' : 'Confirm Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
