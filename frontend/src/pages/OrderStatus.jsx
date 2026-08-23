// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState } from 'react';
import { api } from '../utils/api';
import { formatKES, formatDate } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';
import { T } from '../utils/theme';

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderStatus() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = async (e) => {
    e.preventDefault(); setLoading(true);
    const cleaned = phone.replace(/\D/g, '').replace(/^0/, '254');
    const { data } = await api.get(`/orders/my/${cleaned}`);
    setOrders(data); setSearched(true); setLoading(false);
  };

  return (
    <div style={{ maxWidth: 720, margin: '3rem auto', padding: '0 1.5rem' }}>
      <div className="hero-section" style={{ padding: '2.5rem 1rem 2rem', marginBottom: '2rem', borderRadius: 14 }}>
        <div className="section-label">Postera Crescam Laude</div>
        <h1 className="hero-title" style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)' }}>Track Your Order</h1>
        <p style={{ color: 'var(--white-dim)', fontSize: 14, margin: 0, fontFamily: "'Inter',sans-serif" }}>Enter your phone number to see all your orders.</p>
      </div>

      <form onSubmit={search} style={{ display: 'flex', gap: 10, marginBottom: '2rem' }}>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" required
          style={{ ...T.input, flex: 1, fontSize: 15 }} />
        <button type="submit" disabled={loading} style={{ padding: '0.75rem 1.75rem', background: 'linear-gradient(135deg,#EE6100,#FF8A3D)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontFamily: "'Poppins',sans-serif", whiteSpace: 'nowrap' }}>
          {loading ? '...' : 'Track'}
        </button>
      </form>

      {searched && orders.length === 0 && <p style={{ color: '#6A8A82', textAlign: 'center', fontFamily: "'Inter',sans-serif" }}>No orders found for this number.</p>}

      {orders.map((o) => (
        <div key={o._id} style={{ background: 'linear-gradient(160deg,#0F2620,#0F2620)', border: '1px solid rgba(244,241,234,0.08)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: '#F4F1EA', fontFamily: "'Poppins',sans-serif" }}>{o.orderNumber}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6A8A82', fontFamily: "'Inter',sans-serif" }}>Placed {formatDate(o.createdAt)}</p>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <StatusBadge status={o.status} />
              <StatusBadge status={o.paymentStatus} />
            </div>
          </div>

          {/* Progress tracker */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', overflowX: 'auto', gap: 4 }}>
            {STEPS.map((step, i) => {
              const stepIdx = STEPS.indexOf(o.status);
              const done = i <= stepIdx && o.status !== 'cancelled';
              return (
                <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 60 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: done ? 'linear-gradient(135deg,#2ecc71,#27ae60)' : 'rgba(244,241,234,0.08)', border: `2px solid ${done ? '#2ecc71' : 'rgba(244,241,234,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: done ? '#fff' : '#6A8A82', fontSize: 13, fontWeight: 700 }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 10, marginTop: 5, color: done ? '#2ecc71' : '#6A8A82', textTransform: 'capitalize', textAlign: 'center', fontFamily: "'Inter',sans-serif" }}>{step}</span>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 13, color: '#A9C4BE', fontFamily: "'Inter',sans-serif" }}>
            {o.items.map((item, i) => <div key={i} style={{ marginBottom: 4 }}>{item.name} ×{item.quantity} — {formatKES(item.subtotal)}</div>)}
            <div style={{ marginTop: 10, fontWeight: 800, fontSize: 16, color: '#F4F1EA', fontFamily: "'Poppins',sans-serif" }}>Total: {formatKES(o.total)}</div>
            {o.mpesaRef && <div style={{ color: '#2ecc71', marginTop: 4 }}>M-Pesa Ref: {o.mpesaRef}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
