// PCL — Hardware Repair Landing (Branch: Restore)
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../utils/api';
import { formatKES } from '../../../utils/helpers';
import { Spinner } from '../../../components/UI';

const COLOR = '#FFB020';

export default function RepairLanding() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get('/admin/departments/repair/stats', { headers: { Authorization: `Bearer ${token}` } }); setStats(data); } catch { setStats(null); }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  const kpis = [
    { label: 'OPEN JOB CARDS', value: stats?.openJobs || 0, clr: COLOR },
    { label: 'MONTHLY REVENUE', value: formatKES(stats?.revenue || 0), clr: '#39FF88' },
    { label: 'COMPLETED TODAY', value: stats?.completedToday || 0, clr: '#2BB6A3' },
    { label: 'IN REPAIR', value: stats?.inRepair || 0, clr: '#FF3B3B' },
    { label: 'PARTS IN STOCK', value: stats?.partsInStock || 0, clr: COLOR },
    { label: 'AVG TURNAROUND', value: `${stats?.avgDays || 3} days`, clr: COLOR },
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLOR, boxShadow: `0 0 12px ${COLOR}60`, animation: 'breathe 3.4s ease-in-out infinite' }} />
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: COLOR, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Branch: Restore</span>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", margin: 0 }}>Hardware Repair</h2>
        <p style={{ fontSize: 13, color: '#6A8A82', marginTop: 4 }}>Job card management, parts inventory, and repair turnaround tracking</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {kpis.map(({ label, value, clr }) => (
          <div key={label} style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1.25rem' }}>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: '#6A8A82', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 28, fontWeight: 700, color: clr, lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 14, color: '#A9C4BE', fontFamily: "'Rajdhani',sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Quick Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        {[
          { icon: "🔧", title: "New Job Card", desc: "Create a repair intake form", route: "jobcards" },
          { icon: "📦", title: "Parts Inventory", desc: "Stock levels and part orders", route: "inventory" },
          { icon: "📋", title: "Job Queue", desc: "Prioritized repair pipeline", route: "jobcards" },
          { icon: "✅", title: "Ready for Pickup", desc: "Completed repairs awaiting collection", route: "transactions" },
        ].map(({ icon, title, desc, route }) => (
          <div key={title} style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1rem', cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = COLOR} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(36,74,68,0.4)'} onClick={() => navigate(route)} >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif" }}>{title}</div>
            <div style={{ fontSize: 12, color: '#6A8A82', marginTop: 2 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
