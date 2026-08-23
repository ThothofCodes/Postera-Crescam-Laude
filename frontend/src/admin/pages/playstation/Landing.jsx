// PCL — PlayStation Arena Landing (Branch: Pulse)
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../utils/api';
import { formatKES } from '../../../utils/helpers';
import { Spinner } from '../../../components/UI';

const COLOR = '#39FF88';

export default function PlayStationLanding() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get('/admin/departments/playstation/stats', { headers: { Authorization: `Bearer ${token}` } }); setStats(data); } catch { setStats(null); }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Spinner />;

  const kpis = [
    { label: 'ACTIVE SESSIONS', value: stats?.activeSessions || 0, clr: COLOR },
    { label: 'MONTHLY REVENUE', value: formatKES(stats?.revenue || 0), clr: '#39FF88' },
    { label: 'STATIONS ONLINE', value: stats?.stationsOnline || 0, clr: COLOR },
    { label: 'STATIONS TOTAL', value: stats?.stationsTotal || 0, clr: '#6A8A82' },
    { label: 'TODAY VISITORS', value: stats?.todayVisitors || 0, clr: '#FFB020' },
    { label: 'AVG SESSION', value: `${stats?.avgMinutes || 45} min`, clr: COLOR },
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLOR, boxShadow: `0 0 12px ${COLOR}60`, animation: 'breathe 3.4s ease-in-out infinite' }} />
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: COLOR, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Branch: Pulse</span>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", margin: 0 }}>PlayStation Arena</h2>
        <p style={{ fontSize: 13, color: '#6A8A82', marginTop: 4 }}>Station management, session tracking, and community engagement</p>
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
          { icon: "🎮", title: "Station Map", desc: "Live status of all PS stations", route: "sessions" },
          { icon: "⏱️", title: "Start Session", desc: "Clock in a new gaming session", route: "sessions" },
          { icon: "🏆", title: "Leaderboard", desc: "Top players and tournaments", route: "transactions" },
          { icon: "🛒", title: "Snack Shop", desc: "Concession inventory and sales", route: "inventory" },
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
