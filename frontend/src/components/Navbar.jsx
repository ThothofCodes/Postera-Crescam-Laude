// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Circuit Canopy Navbar
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import RuaiTechLogo from './Logo';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { count } = useCart();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav style={{
      background: 'linear-gradient(180deg, #0F2620 0%, #081916 100%)',
      borderBottom: '1px solid rgba(36,74,68,0.4)',
      padding: '0 2rem',
      height: 66,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 200,
      backdropFilter: 'blur(12px)',
    }}>
      {/* Logo */}
      <Link to="/store" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }} title="Home">
        <RuaiTechLogo size={30} showText={true} textSize="13px" />
      </Link>

      {/* Desktop Navigation */}
      <div className="desktop-nav" style={{ display: 'flex', gap: '0.15rem', alignItems: 'center' }}>
        {[
          { to: '/store',         label: 'Store'         },
          { to: '/calculator',    label: 'Calculator'    },
          { to: '/consult',       label: 'Consult'       },
          { to: '/services',      label: 'Services'      },
          { to: '/tech-hub',      label: 'Tech Hub'      },
          { to: '/help',          label: 'Help'          },
          { to: '/contact',       label: 'Contact'       },
        ].map(({ to, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            padding: '0.4rem 0.9rem',
            borderRadius: 4,
            color: isActive ? '#EE6100' : '#A9C4BE',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: isActive ? 700 : 500,
            fontFamily: "'Poppins', sans-serif",
            background: isActive ? 'rgba(238,97,0,0.12)' : 'transparent',
            borderBottom: isActive ? '2px solid #EE6100' : '2px solid transparent',
            transition: 'all 0.2s ease',
          })}
            onMouseOver={(e) => { if (!e.currentTarget.style.borderBottom.includes('#EE6100')) { e.currentTarget.style.color = '#F4F1EA'; e.currentTarget.style.background = 'rgba(43,182,163,0.08)'; } }}
            onMouseOut={(e) => { if (!e.currentTarget.style.borderBottom.includes('#EE6100')) { e.currentTarget.style.color = '#A9C4BE'; e.currentTarget.style.background = 'transparent'; } }}>
            {label}
          </NavLink>
        ))}

        {/* Cart */}
        <Link to="/cart" style={{
          marginLeft: 10,
          padding: '0.4rem 0.9rem',
          borderRadius: 4,
          border: '1px solid rgba(36,74,68,0.4)',
          background: 'transparent',
          color: '#A9C4BE',
          textDecoration: 'none',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s ease',
        }}>
          🛒
          {count > 0 && (
            <span style={{
              background: '#EE6100',
              color: '#fff',
              borderRadius: '50%',
              width: 18, height: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800,
              boxShadow: '0 0 8px rgba(238,97,0,0.4)',
            }}>{count}</span>
          )}
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          color: '#A9C4BE',
          fontSize: '1.5rem',
          cursor: 'pointer',
          padding: '0.5rem',
        }}
        className="mobile-menu-button"
      >
        ☰
      </button>

      {/* Mobile Menu */}
      <div
        style={{
          display: 'none',
          position: 'fixed',
          top: 66,
          left: 0,
          right: 0,
          background: '#0F2620',
          zIndex: 199,
          flexDirection: 'column',
          padding: '1rem',
          gap: '0.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          borderBottom: '1px solid rgba(36,74,68,0.4)',
        }}
        className="mobile-menu"
      >
        {[
          { to: '/store',         label: 'Store'         },
          { to: '/calculator',    label: 'Calculator'    },
          { to: '/consult',       label: 'Consult'       },
          { to: '/services',      label: 'Services'      },
          { to: '/tech-hub',      label: 'Tech Hub'      },
          { to: '/help',          label: 'Help'          },
          { to: '/contact',       label: 'Contact'       },
        ].map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setIsMenuOpen(false)}
            style={({ isActive }) => ({
              padding: '0.8rem 1rem',
              borderRadius: 4,
              color: isActive ? '#EE6100' : '#A9C4BE',
              textDecoration: 'none',
              fontSize: 16,
              fontWeight: isActive ? 700 : 500,
              fontFamily: "'Poppins', sans-serif",
              background: isActive ? 'rgba(238,97,0,0.12)' : 'transparent',
              borderLeft: isActive ? '3px solid #EE6100' : '3px solid transparent',
              transition: 'all 0.2s ease',
            })}
          >
            {label}
          </NavLink>
        ))}
        <Link
          to="/cart"
          onClick={() => setIsMenuOpen(false)}
          style={{
            padding: '0.8rem 1rem',
            borderRadius: 4,
            border: '1px solid rgba(36,74,68,0.4)',
            background: 'transparent',
            color: '#A9C4BE',
            textDecoration: 'none',
            fontSize: 16,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '0.5rem',
          }}
        >
          <span>🛒 Cart</span>
          {count > 0 && (
            <span style={{
              background: '#EE6100',
              color: '#fff',
              borderRadius: '50%',
              width: 24, height: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800,
              boxShadow: '0 0 8px rgba(238,97,0,0.4)',
            }}>{count}</span>
          )}
        </Link>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-button { display: block !important; }
          .desktop-nav { display: none !important; }
          .mobile-menu { display: ${isMenuOpen ? 'flex' : 'none'} !important; }
        }
      `}</style>
    </nav>
  );
}
