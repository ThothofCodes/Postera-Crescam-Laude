// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Circuit Canopy 403 Access Denied
import { useNavigate } from 'react-router-dom';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#081916',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      {/* Radial ember glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 40%, rgba(238,97,0,0.08) 0%, transparent 60%)',
      }} />

      {/* Circuit-trace decorative lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.06 }}>
        <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#2BB6A3" strokeWidth="1" />
        <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#2BB6A3" strokeWidth="1" />
        <line x1="20%" y1="0" x2="20%" y2="100%" stroke="#EE6100" strokeWidth="1" />
        <line x1="80%" y1="0" x2="80%" y2="100%" stroke="#EE6100" strokeWidth="1" />
        {/* PCB nodes */}
        <circle cx="20%" cy="30%" r="3" fill="#EE6100" />
        <circle cx="80%" cy="30%" r="3" fill="#EE6100" />
        <circle cx="20%" cy="70%" r="3" fill="#2BB6A3" />
        <circle cx="80%" cy="70%" r="3" fill="#2BB6A3" />
        <circle cx="50%" cy="30%" r="2" fill="#2BB6A3" />
        <circle cx="50%" cy="70%" r="2" fill="#EE6100" />
      </svg>

      <div style={{
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
        maxWidth: 480,
      }}>
        {/* Shield icon */}
        <div style={{
          margin: '0 auto 1.5rem',
          width: 72, height: 72,
          borderRadius: '50%',
          background: 'rgba(238,97,0,0.1)',
          border: '2px solid rgba(238,97,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
        }}>
          🛡️
        </div>

        {/* 403 code */}
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 'clamp(64px, 15vw, 120px)',
          fontWeight: 700,
          color: '#EE6100',
          lineHeight: 1,
          letterSpacing: '0.05em',
          textShadow: '0 0 40px rgba(238,97,0,0.3), 0 0 80px rgba(238,97,0,0.1)',
          marginBottom: '0.5rem',
        }}>
          403
        </div>

        {/* Title */}
        <h1 style={{
          margin: '0 0 0.75rem',
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 'clamp(22px, 5vw, 32px)',
          fontWeight: 700,
          color: '#F4F1EA',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Access Denied
        </h1>

        {/* Circuit-trace divider */}
        <div style={{
          width: 200,
          height: 2,
          margin: '0 auto 1.25rem',
          background: 'linear-gradient(90deg, transparent, #EE6100, #2BB6A3, #EE6100, transparent)',
          borderRadius: 1,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: '50%', top: -3,
            width: 8, height: 8, borderRadius: '50%',
            background: '#EE6100', transform: 'translateX(-50%)',
            boxShadow: '0 0 8px rgba(238,97,0,0.5)',
          }} />
        </div>

        {/* Description */}
        <p style={{
          margin: '0 0 2rem',
          fontFamily: "'Poppins', sans-serif",
          fontSize: 14,
          color: '#A9C4BE',
          lineHeight: 1.6,
          maxWidth: 360,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          You don't have the required permissions to access this resource.
          Your clearance level is insufficient for this operation.
        </p>

        {/* Error details */}
        <div style={{
          background: '#0F2620',
          border: '1px solid rgba(36,74,68,0.4)',
          borderRadius: 8,
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ color: '#EE6100', fontSize: 10, fontFamily: "'Share Tech Mono', monospace", letterSpacing: '0.1em' }}>
              ERROR
            </span>
            <span style={{ color: '#6A8A82', fontSize: 10, fontFamily: "'Share Tech Mono', monospace" }}>
              //
            </span>
            <span style={{ color: '#A9C4BE', fontSize: 10, fontFamily: "'Share Tech Mono', monospace" }}>
              {new Date().toISOString().replace('T', ' ').slice(0, 19)}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#A9C4BE', fontFamily: "'Share Tech Mono', monospace", lineHeight: 1.8 }}>
            <div><span style={{ color: '#6A8A82' }}>STATUS:</span> <span style={{ color: '#FF3B3B' }}>403 FORBIDDEN</span></div>
            <div><span style={{ color: '#6A8A82' }}>CLEARANCE:</span> <span style={{ color: '#FFB020' }}>INSUFFICIENT</span></div>
            <div><span style={{ color: '#6A8A82' }}>RESOURCE:</span> <span style={{ color: '#2BB6A3' }}>{window.location.pathname}</span></div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '0.7rem 1.5rem',
              background: 'transparent',
              color: '#A9C4BE',
              border: '1px solid rgba(36,74,68,0.5)',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'Poppins', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2BB6A3';
              e.currentTarget.style.color = '#2BB6A3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(36,74,68,0.5)';
              e.currentTarget.style.color = '#A9C4BE';
            }}
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate('/admin/login')}
            style={{
              padding: '0.7rem 1.5rem',
              background: '#EE6100',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'Poppins', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              letterSpacing: '0.02em',
              boxShadow: '0 4px 16px rgba(238,97,0,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(238,97,0,0.45)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(238,97,0,0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Return to Login →
          </button>
        </div>

        {/* Footer */}
        <p style={{
          marginTop: '2rem',
          fontSize: 10,
          color: '#6A8A82',
          fontFamily: "'Share Tech Mono', monospace",
          letterSpacing: '0.1em',
        }}>
          POSTERA CRESCAM LAUDE · SECURITY PROTOCOL ACTIVE
        </p>
      </div>
    </div>
  );
}
