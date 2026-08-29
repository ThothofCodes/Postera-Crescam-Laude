// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Circuit Canopy DeptLayout with department sub-navigation
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Spinner } from '../../components/UI';
import AdminNavbar from './AdminNavbar';
import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

/* ── Department-specific navigation items ──────────────────────────── */
const DEPT_NAV = {
  internet: {
    label: 'Internet Distribution',
    branch: 'Signal',
    color: '#2BB6A3',
    items: [
      { label: '📊 Overview', path: '' },
      { label: '📡 ISP Clients', path: 'clients' },
      { label: '💳 Transactions', path: 'transactions' },
      { label: '👥 CRM', path: 'crm' },
      { label: '💰 Billing', path: 'billing' },
      { label: '📦 Inventory', path: 'inventory' },
      { label: '🎫 Tickets', path: 'tickets' },
      { label: '💸 Expenses', path: 'expenses' },
      { label: '👤 Staff Portal', path: 'staff-portal' },
      { label: '📋 Audit Log', path: 'audit' },
      { label: '⚙️ Settings', path: 'settings' },
      { label: '💬 Chat', path: 'chat' },
    ],
  },
  webdev: {
    label: 'Web Development',
    branch: 'Forge',
    color: '#A78BFA',
    items: [
      { label: '📊 Overview', path: '' },
      { label: '🛠️ Projects', path: 'projects' },
      { label: '💳 Transactions', path: 'transactions' },
      { label: '👥 CRM', path: 'crm' },
      { label: '💰 Billing', path: 'billing' },
      { label: '📦 Inventory', path: 'inventory' },
      { label: '🎫 Tickets', path: 'tickets' },
      { label: '💸 Expenses', path: 'expenses' },
      { label: '👤 Staff Portal', path: 'staff-portal' },
      { label: '📋 Audit Log', path: 'audit' },
      { label: '⚙️ Settings', path: 'settings' },
      { label: '💬 Chat', path: 'chat' },
    ],
  },
  playstation: {
    label: 'PlayStation Arena',
    branch: 'Pulse',
    color: '#FFB020',
    items: [
      { label: '📊 Overview', path: '' },
      { label: '🎮 Sessions', path: 'sessions' },
      { label: '💳 Transactions', path: 'transactions' },
      { label: '👥 CRM', path: 'crm' },
      { label: '💰 Billing', path: 'billing' },
      { label: '📦 Inventory', path: 'inventory' },
      { label: '🎫 Tickets', path: 'tickets' },
      { label: '💸 Expenses', path: 'expenses' },
      { label: '👤 Staff Portal', path: 'staff-portal' },
      { label: '📋 Audit Log', path: 'audit' },
      { label: '⚙️ Settings', path: 'settings' },
      { label: '💬 Chat', path: 'chat' },
    ],
  },
  repair: {
    label: 'Hardware Repair',
    branch: 'Restore',
    color: '#FF8800',
    items: [
      { label: '📊 Overview', path: '' },
      { label: '🔧 Job Cards', path: 'jobcards' },
      { label: '💳 Transactions', path: 'transactions' },
      { label: '👥 CRM', path: 'crm' },
      { label: '💰 Billing', path: 'billing' },
      { label: '📦 Inventory', path: 'inventory' },
      { label: '🎫 Tickets', path: 'tickets' },
      { label: '💸 Expenses', path: 'expenses' },
      { label: '👤 Staff Portal', path: 'staff-portal' },
      { label: '📋 Audit Log', path: 'audit' },
      { label: '⚙️ Settings', path: 'settings' },
      { label: '💬 Chat', path: 'chat' },
    ],
  },
  cybersecurity: {
    label: 'Cybersecurity',
    branch: 'Sentinel',
    color: '#FF3366',
    items: [
      { label: '📊 Overview', path: '' },
      { label: '📜 Contracts', path: 'contracts' },
      { label: '💳 Transactions', path: 'transactions' },
      { label: '👥 CRM', path: 'crm' },
      { label: '💰 Billing', path: 'billing' },
      { label: '📦 Inventory', path: 'inventory' },
      { label: '🎫 Tickets', path: 'tickets' },
      { label: '💸 Expenses', path: 'expenses' },
      { label: '👤 Staff Portal', path: 'staff-portal' },
      { label: '📋 Audit Log', path: 'audit' },
      { label: '⚙️ Settings', path: 'settings' },
      { label: '💬 Chat', path: 'chat' },
    ],
  },
  govadmin: {
    label: 'Gov Admin Assistance',
    branch: 'Civic',
    color: '#00FF88',
    items: [
      { label: '📊 Overview', path: '' },
      { label: '📄 Documents', path: 'govdocs' },
      { label: '💳 Transactions', path: 'transactions' },
      { label: '👥 CRM', path: 'crm' },
      { label: '💰 Billing', path: 'billing' },
      { label: '📦 Inventory', path: 'inventory' },
      { label: '🎫 Tickets', path: 'tickets' },
      { label: '💸 Expenses', path: 'expenses' },
      { label: '👤 Staff Portal', path: 'staff-portal' },
      { label: '📋 Audit Log', path: 'audit' },
      { label: '⚙️ Settings', path: 'settings' },
      { label: '💬 Chat', path: 'chat' },
    ],
  },
};

const DEFAULT_NAV_ITEMS = [
  { label: '📊 Overview', path: '' },
  { label: '💳 Transactions', path: 'transactions' },
  { label: '👥 CRM', path: 'crm' },
  { label: '💰 Billing', path: 'billing' },
  { label: '📦 Inventory', path: 'inventory' },
  { label: '🎫 Tickets', path: 'tickets' },
  { label: '💸 Expenses', path: 'expenses' },
  { label: '👤 Staff Portal', path: 'staff-portal' },
  { label: '📋 Audit Log', path: 'audit' },
  { label: '⚙️ Settings', path: 'settings' },
  { label: '💬 Chat', path: 'chat' },
];

const DeptLayout = ({ slug, title }) => {
  const { user, loading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [subSidebarOpen, setSubSidebarOpen] = useState(false);
  const [dynamicDept, setDynamicDept] = useState(null);

  // If slug is not in the hardcoded DEPT_NAV, fetch from API
  useEffect(() => {
    if (!DEPT_NAV[slug] && slug) {
      api.get(`/departments/${slug}`).then(({ data }) => {
        setDynamicDept(data);
      }).catch(() => {});
    }
  }, [slug]);

  const dept = DEPT_NAV[slug] || (dynamicDept ? {
    label: dynamicDept.name,
    branch: dynamicDept.name.split(' ').map(w => w[0]).join('').slice(0, 6),
    color: dynamicDept.color || '#A9C4BE',
    items: DEFAULT_NAV_ITEMS,
  } : { label: title || slug, branch: '', color: '#A9C4BE', items: DEFAULT_NAV_ITEMS });
  const basePath = `/admin/${slug}`;

  // Close sidebars on route change
  useEffect(() => { setMobileOpen(false); setSubSidebarOpen(false); }, [location.pathname]);

  const isActive = (subPath) => {
    const full = subPath ? `${basePath}/${subPath}` : basePath;
    return location.pathname === full;
  };

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/admin/login" replace />;

  if (user.role === 'DEPT_HEAD_OWNER' && user.departmentSlug !== slug) {
    return <Navigate to="/403" replace />;
  }

  const SubNavLink = ({ item }) => {
    const active = isActive(item.path);
    const full = item.path ? `${basePath}/${item.path}` : basePath;
    return (
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); navigate(full); setSubSidebarOpen(false); setMobileOpen(false); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '9px 12px', borderRadius: '4px',
          color: active ? '#F4F1EA' : '#A9C4BE',
          background: active ? `${dept.color}20` : 'transparent',
          borderLeft: active ? `3px solid ${dept.color}` : '3px solid transparent',
          paddingLeft: active ? '9px' : '12px',
          transition: 'all 0.2s ease', textDecoration: 'none', fontSize: '13px',
          fontWeight: active ? '600' : '400',
          fontFamily: "'Poppins',sans-serif",
        }}
        onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = `${dept.color}10`; e.currentTarget.style.color = '#F4F1EA'; } }}
        onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A9C4BE'; } }}
      >
        <span>{item.label}</span>
      </a>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#081916' }}>
      {/* ── Mobile backdrop ── */}
      {(mobileOpen || subSidebarOpen) && (
        <div onClick={() => { setMobileOpen(false); setSubSidebarOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(8,25,22,0.7)', zIndex: 997, backdropFilter: 'blur(2px)' }} />
      )}

      {/* Main admin sidebar */}
      <AdminNavbar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} mobileOpen={mobileOpen} onMobileToggle={() => setMobileOpen(!mobileOpen)} />

      {/* Department sub-sidebar */}
      <div className={`dept-sub-sidebar${subSidebarOpen ? ' mobile-open' : ''}`} style={{
        position: 'fixed', top: 0, left: collapsed ? '72px' : '260px',
        height: '100vh', width: collapsed ? '0px' : '220px',
        background: '#0B1F1B', borderRight: '1px solid rgba(36,74,68,0.3)',
        transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', zIndex: 998,
        opacity: collapsed ? 0 : 1,
      }}>
        {/* Dept Header */}
        <div style={{
          padding: '16px 14px', borderBottom: '1px solid rgba(36,74,68,0.3)',
          background: 'rgba(36,74,68,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: dept.color,
              boxShadow: `0 0 10px ${dept.color}50`,
              animation: 'breathe 3.4s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
              color: dept.color, letterSpacing: '0.15em', textTransform: 'uppercase',
            }}>
              Branch: {dept.branch}
            </span>
          </div>
          <div style={{
            fontSize: 15, fontWeight: 700, color: '#F4F1EA',
            fontFamily: "'Rajdhani',sans-serif", lineHeight: 1.2,
          }}>
            {dept.label}
          </div>
        </div>

        {/* Navigation Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {dept.items.map((item) => (
            <SubNavLink key={item.path} item={item} />
          ))}
        </div>

        {/* Staff Invitations link */}
        <div style={{ borderTop: '1px solid rgba(36,74,68,0.3)', padding: '8px 6px' }}>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); navigate(`${basePath}/staff-invitation`); setSubSidebarOpen(false); setMobileOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 12px', borderRadius: '4px',
              color: isActive('staff-invitation') ? '#F4F1EA' : '#A9C4BE',
              background: isActive('staff-invitation') ? `${dept.color}20` : 'transparent',
              borderLeft: isActive('staff-invitation') ? `3px solid ${dept.color}` : '3px solid transparent',
              paddingLeft: isActive('staff-invitation') ? '9px' : '12px',
              transition: 'all 0.2s ease', textDecoration: 'none', fontSize: '13px',
              fontWeight: isActive('staff-invitation') ? '600' : '400',
              fontFamily: "'Poppins',sans-serif",
            }}
          >
            <span>📨 Staff Invitation</span>
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="dept-main-content" style={{
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        marginLeft: collapsed ? '72px' : '480px', transition: 'margin-left 0.3s ease',
      }}>
        <header style={{
          padding: '0.75rem 1.25rem',
          borderBottom: '1px solid rgba(36,74,68,0.4)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#0F2620',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Mobile hamburger for main sidebar */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="dept-hamburger"
              style={{ display: 'none', background: 'none', border: 'none', color: '#EE6100', fontSize: 22, cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}>
              {mobileOpen ? '✕' : '☰'}
            </button>
            {/* Sub-sidebar toggle (mobile only) */}
            <button onClick={() => { setSubSidebarOpen(!subSidebarOpen); }} className="dept-sub-toggle"
              style={{ display: 'none', background: `${dept.color}15`, border: `1px solid ${dept.color}40`, color: dept.color, fontSize: 11, cursor: 'pointer', padding: '4px 10px', borderRadius: 4, fontWeight: 600, fontFamily: "'Poppins',sans-serif" }}>
              {subSidebarOpen ? '✕' : dept.branch}
            </button>
            <div style={{
              fontSize: 14, fontWeight: 600, color: '#F4F1EA',
              fontFamily: "'Rajdhani',sans-serif",
            }}>
              {collapsed ? '...' : title}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              fontSize: 12, color: '#6A8A82',
              fontFamily: "'Share Tech Mono',monospace",
            }}>
              {user.name || user.email}
            </div>
          </div>
        </header>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <Outlet />
        </div>
      </main>

      {/* ── Responsive CSS ── */}
      <style>{`
        @media (max-width: 768px) {
          .dept-sub-sidebar {
            position: fixed !important;
            left: 0 !important;
            width: 240px !important;
            transform: translateX(-100%) !important;
            opacity: 1 !important;
          }
          .dept-sub-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          .dept-main-content {
            margin-left: 0 !important;
          }
          .dept-hamburger { display: flex !important; }
          .dept-sub-toggle { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default DeptLayout;
