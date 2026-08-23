// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { formatKES, formatDate } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';
import { Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';
import { T, btn, btnSm, tabPill, badge } from '../utils/theme';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ paymentMethod: 'mpesa', mpesaRef: '', amount: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/orders', { params: { status, page, limit: 20 } });
    setOrders(data.orders); setTotal(data.total);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [status, page]);

  const updateStatus = async (id, newStatus) => {
    await api.put(`/orders/${id}/status`, { status: newStatus });
    toast.success(`Status → ${newStatus}`); load();
  };

  const recordPay = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.put(`/orders/${payModal._id}/payment`, { ...payForm, amount: Number(payForm.amount) });
      toast.success('Payment recorded'); setPayModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  return (
    <div style={T.page}>
      <div style={T.headerRow}>
        <h2 style={T.h2}>Orders ({total})</h2>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['', ...STATUSES].map((s) => <button key={s} onClick={() => { setStatus(s); setPage(1); }} style={tabPill(status === s)}>{s || 'All'}</button>)}
      </div>

      {loading ? <Spinner /> : orders.length === 0 ? <EmptyState icon="🛒" message="No orders found" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={T.table}>
            <thead><tr style={T.thead}>
              {['Order #', 'Customer', 'Items', 'Total', 'Delivery', 'Status', 'Payment', 'Date', 'Actions'].map((h) => <th key={h} style={T.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} style={T.trHover}>
                  <td style={T.td}><span style={{ fontWeight: 700, color: '#FF8A3D', cursor: 'pointer' }} onClick={() => setDetail(o)}>{o.orderNumber}</span></td>
                  <td style={T.td}>
                    <div style={{ fontWeight: 600, color: '#F4F1EA' }}>{o.customer.name}</div>
                    <div style={{ fontSize: 11, color: '#6A8A82' }}>{o.customer.phone}</div>
                  </td>
                  <td style={T.td}>{o.items.length} item{o.items.length !== 1 ? 's' : ''}</td>
                  <td style={{ ...T.td, fontWeight: 600, color: '#F4F1EA' }}>{formatKES(o.total)}</td>
                  <td style={T.td}><span style={badge}>{o.deliveryType}</span></td>
                  <td style={T.td}>
                    <select value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)}
                      style={{ background: 'rgba(14,10,20,0.7)', border: '1px solid rgba(244,241,234,0.1)', color: '#F4F1EA', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 12 }}>
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={T.td}><StatusBadge status={o.paymentStatus} /></td>
                  <td style={T.td}>{formatDate(o.createdAt)}</td>
                  <td style={T.td}>
                    <button onClick={() => setDetail(o)} style={btnSm('blue')}>View</button>
                    {o.paymentStatus === 'unpaid' && <button onClick={() => { setPayModal(o); setPayForm({ paymentMethod: 'mpesa', mpesaRef: '', amount: o.total }); }} style={btnSm('green')}>Pay</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {page > 1 && <button onClick={() => setPage(p => p - 1)} style={btn('ghost')}>← Prev</button>}
        {orders.length === 20 && <button onClick={() => setPage(p => p + 1)} style={btn('ghost')}>Next →</button>}
      </div>

      {detail && (
        <div style={T.overlay}>
          <div style={T.modalWide}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#EE6100,#244A44,#2BB6A3)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={T.modalH3}>Order {detail.orderNumber}</h3>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', color: '#A9C4BE', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1.25rem', fontSize: 13, color: '#A9C4BE' }}>
              {[['Customer', detail.customer.name], ['Phone', detail.customer.phone], ['Email', detail.customer.email || '—'], ['Delivery', detail.deliveryType]].map(([k, v]) => (
                <div key={k}><span style={{ color: '#6A8A82', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</span><div style={{ color: '#F4F1EA', fontWeight: 600, marginTop: 2 }}>{v}</div></div>
              ))}
              {detail.customer.deliveryAddress && <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#6A8A82', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Address</span><div style={{ color: '#F4F1EA', marginTop: 2 }}>{detail.customer.deliveryAddress}</div></div>}
              {detail.mpesaRef && <div><span style={{ color: '#6A8A82', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>M-Pesa Ref</span><div style={{ color: '#2ecc71', fontWeight: 600, marginTop: 2 }}>{detail.mpesaRef}</div></div>}
            </div>
            <table style={{ ...T.table, marginBottom: '1rem' }}>
              <thead><tr style={T.thead}>
                {['Item', 'Qty', 'Price', 'Subtotal'].map((h) => <th key={h} style={T.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {detail.items.map((item, i) => (
                  <tr key={i} style={T.trHover}>
                    <td style={T.td}>{item.name}</td>
                    <td style={T.td}>{item.quantity}</td>
                    <td style={T.td}>{formatKES(item.price)}</td>
                    <td style={{ ...T.td, fontWeight: 600, color: '#F4F1EA' }}>{formatKES(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', fontSize: 13, color: '#A9C4BE' }}>
              <div>Subtotal: {formatKES(detail.subtotal)}</div>
              <div>Delivery: {formatKES(detail.deliveryFee)}</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#F4F1EA', marginTop: 4 }}>Total: {formatKES(detail.total)}</div>
            </div>
          </div>
        </div>
      )}

      {payModal && (
        <div style={T.overlay}>
          <div style={{ ...T.modal, maxWidth: 400 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#27ae60,#2ecc71)', borderRadius: '14px 14px 0 0' }} />
            <h3 style={T.modalH3}>Record Payment — {payModal.orderNumber}</h3>
            <form onSubmit={recordPay} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={T.label}>Method</label>
                <select value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })} style={T.input}>
                  {['mpesa', 'cash', 'bank'].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div><label style={T.label}>Amount (KES)</label><input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} required style={T.input} /></div>
              <div><label style={T.label}>M-Pesa Ref</label><input value={payForm.mpesaRef} onChange={(e) => setPayForm({ ...payForm, mpesaRef: e.target.value })} style={T.input} /></div>
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
