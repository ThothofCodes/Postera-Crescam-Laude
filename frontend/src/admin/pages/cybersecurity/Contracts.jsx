// PCL — Security Contracts Page (Cybersecurity / Branch: Sentinel)
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { api } from '../../../utils/api';
import { formatKES } from '../../../utils/helpers';
import { Spinner } from '../../../components/UI';

const COLOR = '#FF3B3B';

export default function SecurityContracts() {
  const { token } = useAdminAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/contracts', { headers: { Authorization: `Bearer ${token}` } });
      setContracts(data.contracts || data || []);
    } catch { setContracts([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = {
    active: contracts.filter(c => c.status === 'active').length,
    expiring: contracts.filter(c => c.status === 'expiring').length,
    revenue: contracts.filter(c => c.status === 'active').reduce((s, c) => s + (c.monthlyValue || c.value || 0), 0),
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", margin: 0 }}>Security Contracts</h2>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: '#6A8A82' }}>{contracts.length} total · {stats.active} active · {formatKES(stats.revenue)}/mo</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'ACTIVE CONTRACTS', value: stats.active, clr: '#39FF88' },
          { label: 'EXPIRING SOON', value: stats.expiring, clr: '#FFB020' },
          { label: 'MONTHLY VALUE', value: formatKES(stats.revenue), clr: COLOR },
        ].map(({ label, value, clr }) => (
          <div key={label} style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1rem' }}>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: '#6A8A82', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 22, fontWeight: 700, color: clr }}>{value}</div>
          </div>
        ))}
      </div>

      {loading ? <Spinner /> : contracts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6A8A82' }}>No contracts found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {contracts.map((c, i) => (
            <div key={c._id || i} style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif" }}>{c.clientName || c.client?.name || 'Client'}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, color: c.status === 'active' ? '#39FF88' : '#FFB020', background: c.status === 'active' ? 'rgba(57,255,136,0.1)' : 'rgba(255,176,32,0.1)', fontFamily: "'Share Tech Mono',monospace", textTransform: 'uppercase' }}>{c.status || 'active'}</span>
                </div>
                <div style={{ fontSize: 12, color: '#A9C4BE' }}>{c.serviceType || 'Penetration Testing'} · {c.scope || 'Full Infrastructure'}</div>
                <div style={{ fontSize: 11, color: '#6A8A82', marginTop: 4, fontFamily: "'Share Tech Mono',monospace" }}>Expires: {c.endDate ? new Date(c.endDate).toLocaleDateString() : '—'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700, color: '#F4F1EA' }}>{formatKES(c.monthlyValue || c.value || 0)}</div>
                <div style={{ fontSize: 10, color: '#6A8A82', fontFamily: "'Share Tech Mono',monospace" }}>/month</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
