// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RuaiTechLogo from './Logo';

// Full admin links — for admin/DEPT_HEAD_OWNER roles
const ADMIN_LINKS = [
  { to: '/',              label: 'Dashboard',     icon: '◈' },
  { to: '/bookings',      label: 'Bookings',       icon: '📅' },
  { to: '/clients',       label: 'Clients',        icon: '👥' },
  { to: '/services',      label: 'Services',       icon: '🛠' },
  { to: '/products',      label: 'Products',       icon: '📦' },
  { to: '/orders',        label: 'Orders',         icon: '🛒' },
  { to: '/consultations', label: 'Consultations',  icon: '💬' },
  { to: '/revenue',       label: 'Revenue',        icon: '💰' },
  { to: '/staff',         label: 'Staff',          icon: '👤' },
  { to: '/settings',      label: 'Settings',       icon: '⚙️' },
];

// STAFF-only links — service requests, product orders, transaction verification only
const STAFF_LINKS = [
  { to: '/bookings',      label: 'Service Requests', icon: '📅' },
  { to: '/orders',        label: 'Product Orders',   icon: '🛒' },
  { to: '/consultations', label: 'Consultations',    icon: '💬' },
];

export default function CollapsibleSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const isStaff = user?.role === 'STAFF' || user?.role === 'staff';
  const links = isStaff ? STAFF_LINKS : ADMIN_LINKS;

  return (
    <aside style={{
      width: isCollapsed ? '70px' : '235px',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0F2620 0%, #0F2620 50%, #0F2620 100%)',
      borderRight: '1px solid rgba(238,97,0,0.15)',
      boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      transition: 'width 0.3s ease',
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 1, height: '100%', background: 'linear-gradient(180deg, transparent, rgba(238,97,0,0.4), transparent)', pointerEvents: 'none' }} />

      {/* Collapsible Logo */}
      <div style={{ 
        padding: '1.1rem 1rem', 
        borderBottom: '1px solid rgba(238,97,0,0.1)', 
        background: 'rgba(238,97,0,0.03)', 
        display: 'flex',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        alignItems: 'center',
        textDecoration: 'none',
        transition: 'background 0.2s' 
      }}>
        <Link to="/" title="Dashboard" style={{ 
          display: 'flex', 
          alignItems: 'center',
          textDecoration: 'none',
          width: isCollapsed ? 'auto' : 'calc(100% - 30px)'
        }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(238,97,0,0.07)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(238,97,0,0.03)'; }}>
          <RuaiTechLogo size={isCollapsed ? 30 : 32} showText={!isCollapsed} textSize={isCollapsed ? "0px" : "12px"} />
        </Link>
        
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'none',
            border: '1px solid rgba(238,97,0,0.3)',
            color: 'var(--text-secondary)',
            borderRadius: '4px',
            width: '24px',
            height: '24px',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '»' : '«'}
        </button>
      </div>

      {/* User badge - only show when expanded */}
      {!isCollapsed && user && (
        <div style={{ margin: '0.75rem 0.75rem 0', padding: '0.6rem 0.75rem', background: 'rgba(238,97,0,0.05)', border: '1px solid rgba(238,97,0,0.1)', borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif" }}>Logged in as</div>
          <div style={{ fontSize: 13, color: 'var(--white-soft)', fontWeight: 600, marginTop: 3, fontFamily: "'Inter',sans-serif" }}>{user.name}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            <div style={{ padding: '2px 10px', background: 'rgba(238,97,0,0.12)', border: '1px solid rgba(238,97,0,0.25)', borderRadius: 20, fontSize: 10, color: '#FF8A3D', fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>
              {user.role}
            </div>
            {user.departmentSlug && (
              <div style={{ padding: '2px 10px', background: 'rgba(43,182,163,0.1)', border: '1px solid rgba(43,182,163,0.25)', borderRadius: 20, fontSize: 10, color: '#2BB6A3', fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>
                {user.departmentSlug}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role notice for STAFF - only show when expanded */}
      {!isCollapsed && isStaff && (
        <div style={{ margin: '0.5rem 0.75rem 0', padding: '0.5rem 0.75rem', background: 'rgba(243,156,18,0.06)', border: '1px solid rgba(243,156,18,0.15)', borderRadius: 8 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#f39c12', fontFamily: "'Inter',sans-serif", lineHeight: 1.5 }}>
            📋 Staff access — service requests, orders &amp; payment verification only
          </p>
        </div>
      )}

      {/* Nav - adjust styling based on collapse state */}
      <nav style={{ flex: 1, marginTop: '0.75rem', padding: '0 0.5rem' }}>
        {links.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', 
              alignItems: 'center', 
              gap: isCollapsed ? 0 : 10,
              padding: isCollapsed ? '0.8rem 0.5rem' : '0.6rem 0.75rem', 
              marginBottom: '2px', 
              borderRadius: 8,
              color: isActive ? '#fff' : 'var(--text-secondary)',
              textDecoration: 'none', 
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              fontFamily: "'Inter',sans-serif",
              background: isActive ? 'linear-gradient(90deg, rgba(238,97,0,0.2), rgba(43,182,163,0.1))' : 'transparent',
              borderLeft: isCollapsed ? 'none' : (isActive ? '3px solid #FF8A3D' : '3px solid transparent'),
              transition: 'all 0.15s ease',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
            })}>
            <span style={{ fontSize: 15 }}>{icon}</span>
            {!isCollapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* Logout - only show when expanded */}
      {!isCollapsed && (
        <div style={{ padding: '0.75rem' }}>
          <button onClick={logout} style={{ width: '100%', padding: '0.6rem', background: 'rgba(231,76,60,0.08)', color: '#FF8A3D', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif", cursor: 'pointer', transition: 'all 0.2s ease' }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(231,76,60,0.18)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(231,76,60,0.08)'; }}>
            ⏻ Logout
          </button>
        </div>
      )}
    </aside>
  );
}