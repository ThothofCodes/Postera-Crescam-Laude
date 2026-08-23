// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Circuit Canopy AdminNavbar with animated accordion dropdowns
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import RuaiTechLogo from '../../components/Logo';

/* ── Accordion Section ────────────────────────────────────────────── */
function AccordionSection({ title, icon, items, collapsed, location, onNavigate, color = '#EE6100' }) {
  const [open, setOpen] = useState(true);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState('auto');

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const hasActiveChild = items.some((item) => isActive(item.path));

  // Measure content height for animation
  useEffect(() => {
    if (contentRef.current) {
      if (open) {
        setContentHeight(contentRef.current.scrollHeight + 'px');
        // After animation, set to auto for dynamic content
        const timer = setTimeout(() => setContentHeight('auto'), 300);
        return () => clearTimeout(timer);
      } else {
        // First set explicit height, then set to 0 on next frame
        setContentHeight(contentRef.current.scrollHeight + 'px');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setContentHeight('0px'));
        });
      }
    }
  }, [open, items.length]);

  if (collapsed) {
    // Collapsed mode — just show icons stacked
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 6px' }}>
        {items.map((item) => {
          const active = isActive(item.path);
          return (
            <a key={item.path} href="#" onClick={(e) => { e.preventDefault(); onNavigate(item.path); }}
              title={item.label.replace(/^[^\s]+ /, '')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px 0', borderRadius: 4, textDecoration: 'none',
                color: active ? '#F4F1EA' : '#6A8A82',
                background: active ? `${color}25` : 'transparent',
                borderLeft: active ? `3px solid ${color}` : '3px solid transparent',
                fontSize: 14, transition: 'all 0.2s ease', position: 'relative',
              }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.color = '#F4F1EA'; }}}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6A8A82'; }}}
            >
              <span>{item.icon || item.label.split(' ')[0]}</span>
            </a>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 2 }}>
      {/* Section header — clickable to toggle */}
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 6, width: '100%',
        padding: '8px 12px', background: 'transparent', border: 'none',
        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
      }}>
        <span style={{
          fontSize: 10, color: '#6A8A82', fontWeight: 400, letterSpacing: '0.15em',
          textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace",
          flex: 1,
        }}>
          {icon} {title}
        </span>
        {/* Animated chevron */}
        <span style={{
          fontSize: 10, color: '#6A8A82', transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          display: 'inline-block',
        }}>▾</span>
      </button>

      {/* Animated content wrapper */}
      <div ref={contentRef} style={{
        overflow: 'hidden',
        maxHeight: open ? contentHeight : '0px',
        opacity: open ? 1 : 0,
        transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
        display: 'flex', flexDirection: 'column', gap: 1,
        paddingLeft: 4,
      }}>
        {items.map((item) => {
          const active = isActive(item.path);
          return (
            <a key={item.path} href="#" onClick={(e) => { e.preventDefault(); onNavigate(item.path); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 4, textDecoration: 'none',
                color: active ? '#F4F1EA' : '#A9C4BE',
                background: active ? `${color}20` : 'transparent',
                borderLeft: active ? `3px solid ${color}` : '3px solid transparent',
                paddingLeft: active ? 9 : 12,
                fontSize: 13, fontWeight: active ? 600 : 400,
                fontFamily: "'Poppins',sans-serif",
                transition: 'all 0.2s ease', position: 'relative',
              }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = `${color}0a`; e.currentTarget.style.color = '#F4F1EA'; }}}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A9C4BE'; }}}
            >
              {/* Active dot indicator */}
              {active && (
                <span style={{
                  position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)',
                  width: 4, height: 4, borderRadius: '50%', background: color,
                  boxShadow: `0 0 8px ${color}80`,
                }} />
              )}
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main AdminNavbar ─────────────────────────────────────────────── */
const AdminNavbar = ({ collapsed = false, onToggle, mobileOpen = false, onMobileToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAdminAuth();

  const navItems = [
    { label: '📊 Dashboard', path: '/', icon: '📊' },
    { label: '💬 Messages', path: '/chat', icon: '💬' },
    { label: '📋 Orders', path: '/orders', icon: '📋' },
    { label: '📅 Bookings', path: '/bookings', icon: '📅' },
    { label: '📞 Callbacks', path: '/callbacks', icon: '📞' },
    { label: '👥 Clients', path: '/clients', icon: '👥' },
    { label: '🛠️ Services', path: '/services', icon: '🛠️' },
    { label: '📦 Products', path: '/products', icon: '📦' },
  ];

  const deptItems = [
    { label: '🌐 Internet', path: '/admin/internet', icon: '🌐' },
    { label: '💻 Web Dev', path: '/admin/webdev', icon: '💻' },
    { label: '🎮 PlayStation', path: '/admin/playstation', icon: '🎮' },
    { label: '🔧 Repair', path: '/admin/repair', icon: '🔧' },
    { label: '🛡️ Cybersecurity', path: '/admin/cybersecurity', icon: '🛡️' },
    { label: '🏛️ Gov Admin', path: '/admin/govadmin', icon: '🏛️' },
  ];

  const handleNav = (path) => { navigate(path); onMobileToggle?.(); };

  return (
    <>
      {/* ── Mobile backdrop with blur ── */}
      {mobileOpen && (
        <div onClick={onMobileToggle} style={{
          position: 'fixed', inset: 0, background: 'rgba(8,25,22,0.75)',
          zIndex: 998, backdropFilter: 'blur(4px)',
          animation: 'pcl-fade-in 0.2s ease',
        }} />
      )}

      {/* ── Sidebar ── */}
      <nav className={`admin-nav-sidebar${mobileOpen ? ' mobile-open' : ''}${collapsed ? ' collapsed' : ''}`} style={{
        position: 'fixed', top: 0, left: 0, height: '100vh',
        width: collapsed ? 72 : 260,
        background: 'linear-gradient(180deg, #0D2420 0%, #0A1A17 50%, #081916 100%)',
        borderRight: '1px solid rgba(43,182,163,0.1)',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 999,
        boxShadow: mobileOpen ? '4px 0 24px rgba(0,0,0,0.5)' : 'none',
      }}>
        {/* ── Top glow line ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, #EE6100, #2BB6A3, #EE6100, transparent)',
          opacity: 0.5,
        }} />

        {/* Header */}
        <div style={{
          padding: collapsed ? '14px 8px' : '14px 16px',
          borderBottom: '1px solid rgba(43,182,163,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
          gap: 8, minHeight: 56, transition: 'padding 0.3s ease',
        }}>
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <RuaiTechLogo size={26} showText={true} textSize="11px" />
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img src="/postera-mark.png" alt="PCL" style={{ height: 26, width: 'auto' }} />
            </div>
          )}
          {/* Desktop toggle button */}
          {!collapsed && (
            <button onClick={onToggle} style={{
              background: 'rgba(43,182,163,0.08)', border: '1px solid rgba(43,182,163,0.15)',
              color: '#6A8A82', cursor: 'pointer', fontSize: 14, padding: '4px 8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 4, transition: 'all 0.2s ease', flexShrink: 0,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(43,182,163,0.15)'; e.currentTarget.style.color = '#2BB6A3'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(43,182,163,0.08)'; e.currentTarget.style.color = '#6A8A82'; }}
            >◀</button>
          )}
        </div>

        {/* Collapsed toggle */}
        {collapsed && (
          <div style={{ padding: '6px 0', display: 'flex', justifyContent: 'center' }}>
            <button onClick={onToggle} style={{
              background: 'rgba(43,182,163,0.08)', border: '1px solid rgba(43,182,163,0.15)',
              color: '#6A8A82', cursor: 'pointer', fontSize: 14, padding: '4px 8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 4, transition: 'all 0.2s ease',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(43,182,163,0.15)'; e.currentTarget.style.color = '#2BB6A3'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(43,182,163,0.08)'; e.currentTarget.style.color = '#6A8A82'; }}
            >▶</button>
          </div>
        )}

        {/* ── Scrollable nav content ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '8px 4px' : '8px 8px' }}>
          <AccordionSection
            title="MAIN"
            icon="◈"
            items={navItems}
            collapsed={collapsed}
            location={location}
            onNavigate={handleNav}
            color="#2BB6A3"
          />

          {!collapsed && (
            <div style={{
              height: 1, margin: '8px 12px',
              background: 'linear-gradient(90deg, transparent, rgba(43,182,163,0.2), transparent)',
            }} />
          )}
          {collapsed && (
            <div style={{
              height: 1, margin: '6px 10px',
              background: 'rgba(43,182,163,0.15)',
            }} />
          )}

          <AccordionSection
            title="DEPARTMENTS"
            icon="◉"
            items={deptItems}
            collapsed={collapsed}
            location={location}
            onNavigate={handleNav}
            color="#EE6100"
          />
        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: '1px solid rgba(43,182,163,0.1)',
          padding: collapsed ? '10px 6px' : '10px 12px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {!collapsed && user && (
            <div style={{
              fontSize: 10, color: '#6A8A82', padding: '6px 8px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontFamily: "'Share Tech Mono',monospace",
              letterSpacing: '0.04em',
            }} title={user.email}>
              <span style={{ color: '#2BB6A3' }}>●</span> {user.email}
            </div>
          )}
          <button onClick={() => { logout(); navigate('/login'); }} style={{
            background: 'transparent',
            border: '1px solid rgba(255,59,59,0.2)',
            color: '#FF3B3B',
            padding: collapsed ? '8px' : '8px 12px',
            borderRadius: 4, cursor: 'pointer',
            fontSize: collapsed ? 14 : 12, fontWeight: 600,
            transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 6,
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,59,59,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,59,59,0.4)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,59,59,0.2)'; }}
          >
            <span>⏻</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </nav>

      {/* ── Global animations + responsive CSS ── */}
      <style>{`
        @keyframes pcl-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 768px) {
          .admin-nav-sidebar {
            transform: translateX(-100%) !important;
            z-index: 999 !important;
            box-shadow: none !important;
          }
          .admin-nav-sidebar.mobile-open {
            transform: translateX(0) !important;
            box-shadow: 4px 0 24px rgba(0,0,0,0.5) !important;
          }
        }
      `}</style>
    </>
  );
};

export default AdminNavbar;
