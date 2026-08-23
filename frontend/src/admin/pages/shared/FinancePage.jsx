// PCL — Finance Overview Page (Super Admin)
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { api } from '../../../utils/api';
import { formatKES } from '../../../utils/helpers';
import { Spinner } from '../../../components/UI';

export default function FinancePage({ color = '#EE6100' }) {
  const { token } = useAdminAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get('/admin/analytics', { headers: { Authorization: `Bearer ${token}` }, params: { period } });
      setData(d);
    } catch { setData(null); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [period]);

  const stats = [
    { label: 'TOTAL REVENUE', value: formatKES(data?.revenue || 0), clr: '#39FF88', sub: `+${period === 'month' ? 'this month' : period === 'week' ? 'this week' : 'this year'}` },
    { label: 'TOTAL EXPENSES', value: formatKES(data?.expenses || 0), clr: '#FF3B3B', sub: 'operational costs' },
    { label: 'NET PROFIT', value: formatKES((data?.revenue || 0) - (data?.expenses || 0)), clr: color, sub: 'after expenses' },
    { label: 'PENDING RECEIVABLES', value: formatKES(data?.pending || 0), clr: '#FFB020', sub: 'awaiting payment' },
    { label: 'TRANSACTIONS', value: data?.transactionCount || 0, clr: '#2BB6A3', sub: `avg ${formatKES((data?.revenue || 0) / Math.max(data?.transactionCount || 1, 1))}` },
    { label: 'DEPARTMENTS ACTIVE', value: 6, clr: '#A78BFA', sub: 'all branches online' },
  ];

  const deptBreakdown = [
    { name: 'Internet Distribution', slug: 'internet', color: '#2BB6A3' },
    { name: 'Web Development', slug: 'webdev', color: '#A78BFA' },
    { name: 'PlayStation Arena', slug: 'playstation', color: '#39FF88' },
    { name: 'Hardware Repair', slug: 'repair', color: '#FFB020' },
    { name: 'Cybersecurity', slug: 'cybersecurity', color: '#FF3B3B' },
    { name: 'Gov Admin', slug: 'govadmin', color: '#60A5FA' },
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", margin: 0 }}>Finance Overview</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {['week', 'month', 'year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding: '4px 12px', borderRadius: 4, border: `1px solid ${period === p ? color : 'rgba(36,74,68,0.4)'}`, background: period === p ? `${color}20` : 'transparent', color: period === p ? color : '#6A8A82', cursor: 'pointer', fontSize: 11, fontFamily: "'Share Tech Mono',monospace", textTransform: 'uppercase' }}>{p}</button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {stats.map(({ label, value, clr, sub }) => (
              <div key={label} style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1.25rem' }}>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: '#6A8A82', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 28, fontWeight: 700, color: clr, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: '#6A8A82', marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Department breakdown */}
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#A9C4BE', fontFamily: "'Rajdhani',sans-serif", marginBottom: '1rem', marginTop: '1.5rem' }}>DEPARTMENT BREAKDOWN</h3>
          <div style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: 'rgba(36,74,68,0.3)' }}>
                {['Department', 'Revenue', 'Expenses', 'Profit', 'Txns'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: 10, color: '#2BB6A3', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {deptBreakdown.map(d => (
                  <tr key={d.slug} style={{ borderTop: '1px solid rgba(36,74,68,0.2)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                        <span style={{ fontSize: 13, color: '#F4F1EA' }}>{d.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: 13, color: '#39FF88', fontFamily: "'Rajdhani',sans-serif", fontWeight: 600 }}>—</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: 13, color: '#FF3B3B', fontFamily: "'Rajdhani',sans-serif", fontWeight: 600 }}>—</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: 13, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", fontWeight: 600 }}>—</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: 12, color: '#A9C4BE', fontFamily: "'Share Tech Mono',monospace" }}>0</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
