// PCL — Shared Transactions Page (replaces Soon for all departments)
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { api } from '../../../utils/api';
import { formatKES } from '../../../utils/helpers';
import { Spinner } from '../../../components/UI';

export default function TransactionsPage({ color = '#EE6100' }) {
  const { token } = useAdminAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/transactions', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: filter === 'all' ? undefined : filter, page, limit: 20 }
      });
      setTransactions(data.transactions || data || []);
      setTotal(data.total || 0);
    } catch { setTransactions([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter, page]);

  const stats = {
    total: transactions.reduce((s, t) => s + (t.amount || 0), 0),
    completed: transactions.filter(t => t.status === 'completed').reduce((s, t) => s + (t.amount || 0), 0),
    pending: transactions.filter(t => t.status === 'pending').reduce((s, t) => s + (t.amount || 0), 0),
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", margin: 0 }}>Transactions</h2>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: '#6A8A82' }}>{total} total</span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'TOTAL REVENUE', value: formatKES(stats.total), clr: color },
          { label: 'COMPLETED', value: formatKES(stats.completed), clr: '#39FF88' },
          { label: 'PENDING', value: formatKES(stats.pending), clr: '#FFB020' },
        ].map(({ label, value, clr }) => (
          <div key={label} style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1rem' }}>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: '#6A8A82', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 22, fontWeight: 700, color: clr }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['all', 'completed', 'pending', 'failed'].map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            style={{ padding: '5px 14px', borderRadius: 4, border: `1px solid ${filter === s ? color : 'rgba(36,74,68,0.4)'}`, background: filter === s ? `${color}20` : 'transparent', color: filter === s ? color : '#6A8A82', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Share Tech Mono',monospace", textTransform: 'capitalize' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <Spinner /> : transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6A8A82' }}>No transactions found</div>
      ) : (
        <div style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(36,74,68,0.3)' }}>
                {['ID', 'Customer', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: 10, fontWeight: 400, color: '#2BB6A3', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={t._id || i} style={{ borderTop: '1px solid rgba(36,74,68,0.2)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 12, color: '#A9C4BE', fontFamily: "'Share Tech Mono',monospace" }}>{(t._id || '').slice(-6)}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 13, color: '#F4F1EA' }}>{t.customer?.name || t.customerName || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 13, fontWeight: 600, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif" }}>{formatKES(t.amount || 0)}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 12, color: '#A9C4BE' }}>{t.paymentMethod || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, fontFamily: "'Share Tech Mono',monospace", color: t.status === 'completed' ? '#39FF88' : t.status === 'pending' ? '#FFB020' : '#FF3B3B', background: t.status === 'completed' ? 'rgba(57,255,136,0.1)' : t.status === 'pending' ? 'rgba(255,176,32,0.1)' : 'rgba(255,59,59,0.1)' }}>{t.status || '—'}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 12, color: '#6A8A82', fontFamily: "'Share Tech Mono',monospace" }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div style={{ display: 'flex', gap: 10, marginTop: '1rem', justifyContent: 'center' }}>
        {page > 1 && <button onClick={() => setPage(p => p - 1)} style={{ padding: '0.4rem 1rem', background: '#0F2620', color: '#2BB6A3', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: "'Share Tech Mono',monospace" }}>← Prev</button>}
        {transactions.length === 20 && <button onClick={() => setPage(p => p + 1)} style={{ padding: '0.4rem 1rem', background: '#0F2620', color: '#2BB6A3', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: "'Share Tech Mono',monospace" }}>Next →</button>}
      </div>
    </div>
  );
}
