// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Dynamic Department Landing Page
// Auto-generated dashboard for departments created via Department Management
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { formatKES } from '../../utils/helpers';
import { Spinner } from '../../components/UI';

export default function DynamicDepartmentLanding() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [dept, setDept] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [deptRes, statsRes] = await Promise.all([
          api.get(`/departments/${slug}`),
          api.get(`/finance/breakdown`).catch(() => ({ data: [] })),
        ]);
        setDept(deptRes.data);

        // Extract department-specific stats from the breakdown
        const breakdown = statsRes.data || [];
        const deptRevenue = breakdown.find(b => b._id === slug)?.total || 0;

        // Try to get department-specific stats
        let deptStats = { revenue: deptRevenue };
        try {
          const { data } = await api.get(`/admin/departments/${slug}/stats`);
          deptStats = { ...deptStats, ...data };
        } catch {
          // Stats endpoint may not exist for new departments — use fallback
        }

        setStats(deptStats);
      } catch (err) {
        setError(err.response?.status === 404 ? 'Department not found' : 'Failed to load department');
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><Spinner /></div>;
  if (error) return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
      <h2 style={{ color: '#FF3B3B', fontFamily: "'Rajdhani',sans-serif", margin: '0 0 0.5rem' }}>{error}</h2>
      <p style={{ color: '#6A8A82', fontSize: 13 }}>The department "{slug}" may not exist yet or is inactive.</p>
      <button onClick={() => navigate('/admin/super/manage-departments')}
        style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#EE6100', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontFamily: "'Poppins',sans-serif" }}>
        Manage Departments
      </button>
    </div>
  );

  const color = dept?.color || '#2BB6A3';
  const icon = dept?.icon || '◈';
  const deptName = dept?.name || slug;

  const kpis = [
    { label: 'MONTHLY REVENUE', value: formatKES(stats?.revenue || 0), clr: color },
    { label: 'ACTIVE CLIENTS', value: stats?.activeClients || 0, clr: '#39FF88' },
    { label: 'OPEN TICKETS', value: stats?.openTickets || 0, clr: '#FF3B3B' },
    { label: 'STAFF MEMBERS', value: stats?.staffCount || 0, clr: '#A78BFA' },
    { label: 'INVOICES', value: stats?.totalInvoices || 0, clr: '#FFB020' },
    { label: 'SATISFACTION', value: `${stats?.satisfaction || 0}%`, clr: '#2BB6A3' },
  ];

  const quickActions = [
    { icon: '💳', title: 'Transactions', desc: 'View department transactions', route: 'transactions' },
    { icon: '👥', title: 'CRM', desc: 'Manage client relationships', route: 'crm' },
    { icon: '💰', title: 'Billing', desc: 'Invoices and payments', route: 'billing' },
    { icon: '📦', title: 'Inventory', desc: 'Stock and parts management', route: 'inventory' },
    { icon: '🎫', title: 'Tickets', desc: 'Support ticket queue', route: 'tickets' },
    { icon: '📊', title: 'Reports', desc: 'Department analytics', route: 'reports' },
    { icon: '👤', title: 'Staff Portal', desc: 'Staff management', route: 'staff-portal' },
    { icon: '💬', title: 'Chat', desc: 'Live customer support', route: 'chat' },
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', background: color,
            boxShadow: `0 0 12px ${color}60`, animation: 'breathe 3.4s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color,
            letterSpacing: '0.15em', textTransform: 'uppercase',
          }}>
            Branch: {deptName}
          </span>
        </div>
        <h2 style={{
          fontSize: 28, fontWeight: 700, color: '#F4F1EA',
          fontFamily: "'Rajdhani',sans-serif", margin: 0,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 24 }}>{icon}</span>
          {deptName}
        </h2>
        {dept?.description && (
          <p style={{ fontSize: 13, color: '#6A8A82', marginTop: 4 }}>{dept.description}</p>
        )}
        {dept?.operatingHours && (
          <p style={{ fontSize: 11, color: '#6A8A82', marginTop: 2, fontFamily: "'Share Tech Mono',monospace" }}>
            🕐 {dept.operatingHours}
          </p>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {kpis.map(({ label, value, clr }) => (
          <div key={label} style={{
            background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)',
            borderRadius: 10, padding: '1.25rem',
          }}>
            <div style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: '#6A8A82',
              letterSpacing: '0.1em', marginBottom: 8,
            }}>{label}</div>
            <div style={{
              fontFamily: "'Rajdhani',sans-serif", fontSize: 28, fontWeight: 700,
              color: clr, lineHeight: 1,
            }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h3 style={{
        fontSize: 14, color: '#A9C4BE', fontFamily: "'Rajdhani',sans-serif",
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem',
      }}>Quick Actions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        {quickActions.map(({ icon, title, desc, route }) => (
          <div key={title} style={{
            background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)',
            borderRadius: 10, padding: '1rem', cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = color}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(36,74,68,0.4)'}
            onClick={() => navigate(route)}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif" }}>{title}</div>
            <div style={{ fontSize: 12, color: '#6A8A82', marginTop: 2 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Contact Info */}
      {(dept?.contactEmail || dept?.contactPhone) && (
        <div style={{
          marginTop: '2rem', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)',
          borderRadius: 10, padding: '1.25rem',
        }}>
          <h3 style={{
            fontSize: 14, color: '#A9C4BE', fontFamily: "'Rajdhani',sans-serif",
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem',
          }}>Contact Information</h3>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {dept.contactEmail && (
              <div>
                <div style={{ fontSize: 10, color: '#6A8A82', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace" }}>Email</div>
                <div style={{ fontSize: 13, color: '#E8F0EE', marginTop: 2 }}>{dept.contactEmail}</div>
              </div>
            )}
            {dept.contactPhone && (
              <div>
                <div style={{ fontSize: 10, color: '#6A8A82', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace" }}>Phone</div>
                <div style={{ fontSize: 13, color: '#E8F0EE', marginTop: 2 }}>{dept.contactPhone}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Breathe animation keyframes */}
      <style>{`
        @keyframes breathe {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
