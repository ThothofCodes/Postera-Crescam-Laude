// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Circuit Canopy SuperAdminLayout with animated sidebar sections
import { useEffect, useState, useCallback } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../../../utils/api';
import { formatKES } from '../../../utils/helpers';
import IncomeProjectionChart from '../../components/IncomeProjectionChart';
import { Spinner } from '../../../components/UI';
import { useAdminAuth } from '../../context/AdminAuthContext';
import RuaiTechLogo from '../../../components/Logo';
import NotificationBell from '../../components/NotificationBell';
import ChatMonitor from '../../components/ChatMonitor';
import RuaiPulseBoard from '../../../components/RuaiPulseBoard';

const DEPT_COLORS = { internet:'#2BB6A3', webdev:'#a78bfa', playstation:'#ffd700', repair:'#ff8800', cybersecurity:'#ff3366', govadmin:'#00ff88' };

const SUPER_LINKS = [
  ['Dashboard','◈','/admin/super'],
  ['All Departments','◉','/admin/super/departments'],
  ['Manage Departments','⚙','/admin/super/manage-departments'],
  ['Dept Analytics','📊','/admin/super/dept-analytics'],
  ['Admin Allocation','◆','/admin/super/admin-allocation'],
  ['Devices','🖥','/admin/super/devices'],
  ['User Management','◫','/admin/super/users'],
  ['Chat','💬','/admin/super/chat'],
  ['Email Allocation','◆','/admin/super/email'],
  ['Finance','◆','/admin/super/finance'],
  ['All Tickets','◧','/admin/super/tickets'],
  ['Inventory Master','◈','/admin/super/inventory'],
  ['Blog Management','📝','/admin/super/blog'],
  ['Audit Log','☰','/admin/super/audit'],
  ['Broadcast','◈','/admin/super/broadcast'],
  ['Settings','◉','/admin/super/settings'],
  ['API Health','◎','/admin/super/health'],
];

/* ── Animated accordion section ── */
function SidebarSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const [height, setHeight] = useState(defaultOpen ? 'auto' : '0px');

  useEffect(() => {
    if (!contentRef.current) return;
    if (open) {
      setHeight(contentRef.current.scrollHeight + 'px');
      const t = setTimeout(() => setHeight('auto'), 350);
      return () => clearTimeout(t);
    } else {
      setHeight(contentRef.current.scrollHeight + 'px');
      requestAnimationFrame(() => requestAnimationFrame(() => setHeight('0px')));
    }
  }, [open]);

  return (
    <div style={{ marginBottom: 4 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 6, width: '100%',
        padding: '7px 14px', background: 'transparent', border: 'none',
        cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{
          fontSize: 9, color: '#6A8A82', letterSpacing: '0.15em', textTransform: 'uppercase',
          fontFamily: "'Share Tech Mono',monospace", flex: 1,
        }}>{title}</span>
        <span style={{
          fontSize: 9, color: '#6A8A82',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          display: 'inline-block',
        }}>▾</span>
      </button>
      <div ref={contentRef} style={{
        overflow: 'hidden', maxHeight: height, opacity: open ? 1 : 0,
        transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
      }}>
        {children}
      </div>
    </div>
  );
}

import { useRef } from 'react';

export function SuperAdminLayout() {
  const { user, loading, logout } = useAdminAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/403" replace />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#081916' }}>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(8,25,22,0.75)',
          zIndex: 1098, backdropFilter: 'blur(4px)',
          animation: 'pcl-fade-in 0.2s ease',
        }} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar${mobileOpen ? ' open' : ''}`} style={{
        width: 230, background: 'linear-gradient(180deg,#0D2420 0%,#0A1A17 50%,#081916 100%)',
        borderRight: '1px solid rgba(238,97,0,0.1)',
        display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Top glow line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, #EE6100, #FF8A3D, #EE6100, transparent)',
          opacity: 0.5, pointerEvents: 'none',
        }} />

        <NavLink to="/admin/super" end style={{
          padding: '14px 14px', borderBottom: '1px solid rgba(238,97,0,0.1)',
          display: 'block', textDecoration: 'none',
        }}>
          <RuaiTechLogo size={28} showText={true} textSize="11px" />
          <div style={{
            fontSize: 8, color: '#EE6100', letterSpacing: '0.2em',
            textTransform: 'uppercase', marginTop: 5, fontWeight: 700,
            fontFamily: "'Share Tech Mono',monospace",
          }}>Super Admin</div>
        </NavLink>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          <SidebarSection title="COMMAND" defaultOpen={true}>
            <div style={{ padding: '0 6px' }}>
              {SUPER_LINKS.map(([label, icon, path]) => (
                <NavLink key={path} to={path} end={path === '/admin/super'}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', marginBottom: 1, borderRadius: 4,
                    color: isActive ? '#EE6100' : '#6A8A82', textDecoration: 'none',
                    fontSize: 10, fontWeight: isActive ? 700 : 400,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    background: isActive ? 'rgba(238,97,0,0.08)' : 'transparent',
                    borderLeft: isActive ? '2px solid #EE6100' : '2px solid transparent',
                    transition: 'all 0.2s ease', position: 'relative',
                  })}
                >
                  <span style={{ fontSize: 11, width: 16, textAlign: 'center' }}>{icon}</span>
                  {label}
                </NavLink>
              ))}
            </div>
          </SidebarSection>

          <div style={{
            height: 1, margin: '4px 14px',
            background: 'linear-gradient(90deg, transparent, rgba(238,97,0,0.2), transparent)',
          }} />

          <SidebarSection title="DEPARTMENTS" defaultOpen={true}>
            <div style={{ padding: '0 6px' }}>
              {Object.entries(deptColors).map(([slug, color]) => (
                <NavLink key={slug} to={`/admin/${slug}`} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 10px', marginBottom: 1, borderRadius: 4,
                  color: '#6A8A82', textDecoration: 'none', fontSize: 10,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  transition: 'all 0.2s ease',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${color}0a`; e.currentTarget.style.color = '#F4F1EA'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6A8A82'; }}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', background: color,
                    flexShrink: 0, boxShadow: `0 0 6px ${color}40`,
                  }} />
                  {slug}
                </NavLink>
              ))}
            </div>
          </SidebarSection>
        </nav>

        <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(238,97,0,0.08)' }}>
          <button onClick={logout} style={{
            width: '100%', padding: '6px', background: 'rgba(255,51,102,0.06)',
            color: '#ff3366', border: '1px solid rgba(255,51,102,0.2)',
            borderRadius: 4, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,51,102,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,51,102,0.06)'; }}
          >⏻ Logout</button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          height: 52, background: 'linear-gradient(90deg,#0D2420,#0F2620)',
          borderBottom: '1px solid rgba(238,97,0,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1.5rem', flexShrink: 0,
        }}>
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="admin-hamburger"
            style={{
              display: 'none', background: 'none', border: 'none',
              color: '#EE6100', fontSize: 22, cursor: 'pointer',
              padding: '4px 8px', lineHeight: 1,
            }}>
            {mobileOpen ? '✕' : '☰'}
          </button>
          <div className="admin-header-title" style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#EE6100',
            fontFamily: "'Share Tech Mono',monospace",
          }}>POSTERA — COMMAND CENTRE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NotificationBell />
            <div className="admin-header-user" style={{ fontSize: 11, color: '#6A8A82' }}>
              {user.name} · <span style={{ color: '#EE6100' }}>SUPER ADMIN</span>
            </div>
          </div>
        </header>
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <RuaiPulseBoard authToken={localStorage.getItem('adminToken') || localStorage.getItem('token')} />
          </div>
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes pcl-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 768px) {
          .admin-sidebar {
            position: fixed !important; top: 0 !important; left: 0 !important;
            height: 100vh !important; z-index: 1099 !important;
            transform: translateX(-100%);
          }
          .admin-sidebar.open { transform: translateX(0) !important; }
          .admin-hamburger { display: flex !important; }
          .admin-header-title { font-size: 10px !important; }
          .admin-header-user { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ── Super Admin Home Dashboard ─────────────────────────────────────────────
export default function SuperDashboard() {
  const [breakdown, setBreakdown] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChatModule, setShowChatModule] = useState(false);
  const [deptColors, setDeptColors] = useState(DEPT_COLORS);

  useEffect(() => {
    api.get('/departments').then(({ data }) => {
      const colors = {};
      data.forEach(d => { if (d.color) colors[d.slug] = d.color; });
      setDeptColors(prev => ({ ...prev, ...colors }));
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bd, us] = await Promise.all([
        api.get('/finance/breakdown'),
        api.get('/users'),
      ]);
      setBreakdown(bd.data);
      setUsers(us.data);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const deptUserCount = (slug) => users.filter((u) => u.departmentSlug === slug).length;

  if (loading) return <Spinner />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(238,97,0,0.08)', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: 18, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#EE6100' }}>◈ Command Centre</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => setShowChatModule(!showChatModule)}
            style={{
              padding: '0.5rem 1rem', background: 'rgba(238,97,0,0.1)', color: '#EE6100',
              border: '1px solid rgba(238,97,0,0.3)', borderRadius: '4px', fontSize: '0.8rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
            💬 Support Chat
          </button>
          <span style={{ fontSize: 10, color: '#6A8A82', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem' }}>
        {Object.entries(deptColors).map(([slug, color]) => {
          const deptData = breakdown.find((b) => b._id === slug);
          return (
            <NavLink key={slug} to={`/admin/${slug}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'linear-gradient(160deg,#0F2620,#0F2620)', border: `1px solid ${color}22`, borderRadius: 8, padding: '1rem', position: 'relative', overflow: 'hidden', transition: 'all 0.2s', cursor: 'pointer' }}
                onMouseOver={(e) => { e.currentTarget.style.border = `1px solid ${color}55`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.border = `1px solid ${color}22`; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.6 }} />
                <div style={{ fontSize: 9, color, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>{slug}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#F4F1EA' }}>{formatKES(deptData?.total || 0)}</div>
                <div style={{ fontSize: 10, color: '#6A8A82', marginTop: 4 }}>{deptUserCount(slug)} staff</div>
              </div>
            </NavLink>
          );
        })}
      </div>

      <IncomeProjectionChart departmentId={null} departmentLabel="All Departments" showDepartmentBreakdown={true} />

      {breakdown.length > 0 && (
        <div style={{ background: 'linear-gradient(160deg,#0F2620,#0F2620)', border: '1px solid rgba(238,97,0,0.12)', borderRadius: 8, padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A9C4BE' }}>◆ Revenue by Department</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={breakdown.map((b) => ({ name: b._id, value: b.total }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {breakdown.map((b) => <Cell key={b._id} fill={deptColors[b._id] || '#EE6100'} />)}
              </Pie>
              <Tooltip formatter={(v) => formatKES(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {showChatModule && (
        <ChatMonitor 
          authToken={localStorage.getItem('adminToken') || localStorage.getItem('token')}
          onClose={() => setShowChatModule(false)}
        />
      )}
    </div>
  );
}
