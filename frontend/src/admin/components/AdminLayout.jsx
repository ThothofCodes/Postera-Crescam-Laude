// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Circuit Canopy AdminLayout
import { Outlet, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Spinner } from '../../components/UI';
import AdminNavbar from './AdminNavbar';
import PaymentNotifications from './PaymentNotifications';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AdminLayout = () => {
  const { user, loading } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/admin/login" replace />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#081916' }}>
      <AdminNavbar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} mobileOpen={mobileOpen} onMobileToggle={() => setMobileOpen(!mobileOpen)} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginLeft: collapsed ? '72px' : '260px', transition: 'margin-left 0.3s ease' }}>
        <header style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(36,74,68,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0F2620' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="admin-hamburger-btn"
              style={{ display: 'none', background: 'none', border: 'none', color: '#EE6100', fontSize: 22, cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}>
              {mobileOpen ? '✕' : '☰'}
            </button>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif" }}>
              {collapsed ? '...' : 'Admin Portal'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 12, color: '#6A8A82', fontFamily: "'Share Tech Mono',monospace" }}>{user.name || user.email}</div>
          </div>
        </header>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <Outlet />
        </div>
        <PaymentNotifications maxVisible={3} />
      </main>

      <style>{`
        @media (max-width: 768px) {
          main { margin-left: 0 !important; }
          .admin-hamburger-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
