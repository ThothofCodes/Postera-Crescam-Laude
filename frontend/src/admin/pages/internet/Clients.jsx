// PCL — ISP Clients Page (Internet Distribution)
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { api } from '../../../utils/api';
import { formatKES } from '../../../utils/helpers';
import { Spinner } from '../../../components/UI';

const COLOR = '#2BB6A3';

export default function ISPClients() {
  const { token } = useAdminAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/clients', { headers: { Authorization: `Bearer ${token}` }, params: { department: 'internet', status: filter === 'all' ? undefined : filter } });
      setClients(data.clients || data || []);
    } catch { setClients([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    suspended: clients.filter(c => c.status === 'suspended').length,
    revenue: clients.reduce((s, c) => s + (c.monthlyFee || 0), 0),
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", margin: 0 }}>ISP Clients</h2>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: '#6A8A82' }}>{stats.total} clients · {stats.active} active · {formatKES(stats.revenue)}/mo</span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
        {['all', 'active', 'suspended', 'pending'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '4px 12px', borderRadius: 4, border: `1px solid ${filter === s ? COLOR : 'rgba(36,74,68,0.4)'}`, background: filter === s ? `${COLOR}20` : 'transparent', color: filter === s ? COLOR : '#6A8A82', cursor: 'pointer', fontSize: 11, fontFamily: "'Share Tech Mono',monospace", textTransform: 'uppercase' }}>{s}</button>
        ))}
      </div>

      {loading ? <Spinner /> : clients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6A8A82' }}>No ISP clients found</div>
      ) : (
        <div style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'rgba(36,74,68,0.3)' }}>
              {['Client', 'Plan', 'Monthly Fee', 'Status', 'Connected Since', 'Actions'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: 10, color: '#2BB6A3', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={c._id || i} style={{ borderTop: '1px solid rgba(36,74,68,0.2)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 13, color: '#F4F1EA', fontWeight: 500 }}>{c.name || c.clientName}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 12, color: '#A9C4BE' }}>{c.plan || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 13, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", fontWeight: 600 }}>{formatKES(c.monthlyFee || 0)}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: c.status === 'active' ? '#39FF88' : c.status === 'suspended' ? '#FF3B3B' : '#FFB020', background: c.status === 'active' ? 'rgba(57,255,136,0.1)' : c.status === 'suspended' ? 'rgba(255,59,59,0.1)' : 'rgba(255,176,32,0.1)', fontFamily: "'Share Tech Mono',monospace", textTransform: 'uppercase' }}>{c.status || 'active'}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 12, color: '#6A8A82', fontFamily: "'Share Tech Mono',monospace" }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button style={{ padding: '3px 8px', borderRadius: 3, border: `1px solid ${COLOR}40`, background: 'transparent', color: COLOR, cursor: 'pointer', fontSize: 11, fontFamily: "'Share Tech Mono',monospace" }}>Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
