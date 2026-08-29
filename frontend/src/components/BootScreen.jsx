// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Circuit Canopy Boot Screen: Full-Page Marketing Splash
// Covers 100% of the viewport as a branded marketing experience.
import { useState, useEffect } from 'react';

/* ── Business Identity ──────────────────────────────────────────────────── */
const BRAND_NAME    = 'Postera Crescam Laude';
const BRAND_SHORT   = 'PCL';
const TAGLINE       = "Empowering Kenya's Digital Future";
const LOCATION      = 'PCL Centre, Nairobi County, Kenya';
const CONTACT_EMAIL = 'info@posteracrescamlaude.co.ke';

const SERVICES = [
  { icon: '📡', label: 'Internet Distribution',  color: '#2BB6A3' },
  { icon: '💻', label: 'Web Development',        color: '#A78BFA' },
  { icon: '🎮', label: 'PlayStation Arena',      color: '#FFB020' },
  { icon: '🔧', label: 'Hardware Repair',        color: '#FF8800' },
  { icon: '🛡️', label: 'Cybersecurity',           color: '#FF3366' },
  { icon: '🏛️', label: 'Gov Admin Assistance',    color: '#00FF88' },
];

const BOOT_LINES = [
  { text: `${BRAND_SHORT}_OS v2.0`,                       delay: 0    },
  { text: 'INITIALIZING SYSTEM...',                        delay: 500  },
  { text: 'LOADING SERVICES MODULE',                       delay: 1000 },
  { text: 'CANOPY NETWORK ONLINE',                         delay: 1500 },
  { text: 'ALL SYSTEMS VERIFIED',                          delay: 2000 },
];

export default function BootScreen({ onComplete }) {
  const [phase, setPhase] = useState('atmosphere');
  // atmosphere → terminal → brand → services → cta → fade → done
  const [visibleLines, setVisibleLines] = useState([]);
  const [cursorVisible, setCursorVisible] = useState(true);

  /* ── Blinking cursor ────────────────────────────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 520);
    return () => clearInterval(id);
  }, []);

  /* ── Phase timeline ─────────────────────────────────────────────────── */
  useEffect(() => {
    // Terminal typewriter
    BOOT_LINES.forEach(({ text, delay }, i) => {
      setTimeout(() => setVisibleLines((p) => [...p, text]), delay);
    });

    const timers = [
      setTimeout(() => setPhase('terminal'), 0),
      setTimeout(() => setPhase('brand'),     2800),
      setTimeout(() => setPhase('services'),  4200),
      setTimeout(() => setPhase('cta'),       5600),
      setTimeout(() => setPhase('fade'),      6800),
      setTimeout(() => onComplete(),          7600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const faded = phase === 'fade';

  return (
    <div style={{ ...ROOT_STYLE, opacity: faded ? 0 : 1 }}>
      {/* ── Ambient background layers ──────────────────────────────────── */}
      {/* Deep radial glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: [
          'radial-gradient(ellipse at 30% 20%, rgba(238,97,0,0.07) 0%, transparent 50%)',
          'radial-gradient(ellipse at 70% 80%, rgba(43,182,163,0.06) 0%, transparent 50%)',
          'radial-gradient(ellipse at 50% 50%, rgba(36,74,68,0.12) 0%, transparent 60%)',
        ].join(', '),
      }} />

      {/* Animated grid lines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.04,
        backgroundImage: [
          'linear-gradient(rgba(43,182,163,1) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(43,182,163,1) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: '80px 80px',
        animation: 'grid-drift 20s linear infinite',
      }} />

      {/* Scanline overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(43,182,163,0.025) 2px, rgba(43,182,163,0.025) 4px)',
        animation: 'scanline 0.5s linear infinite',
      }} />

      {/* ── Corner frame ───────────────────────────────────────────────── */}
      {['tl','tr','bl','br'].map((pos) => (
        <div key={pos} style={{
          position: 'absolute', zIndex: 2, pointerEvents: 'none',
          width: 80, height: 80,
          ...(pos === 'tl' ? { top: 20, left: 20,  borderTop: '2px solid rgba(43,182,163,0.3)', borderLeft:  '2px solid rgba(43,182,163,0.3)' } : {}),
          ...(pos === 'tr' ? { top: 20, right: 20, borderTop: '2px solid rgba(43,182,163,0.3)', borderRight: '2px solid rgba(43,182,163,0.3)' } : {}),
          ...(pos === 'bl' ? { bottom: 20, left: 20,  borderBottom: '2px solid rgba(43,182,163,0.3)', borderLeft:   '2px solid rgba(43,182,163,0.3)' } : {}),
          ...(pos === 'br' ? { bottom: 20, right: 20, borderBottom: '2px solid rgba(43,182,163,0.3)', borderRight:  '2px solid rgba(43,182,163,0.3)' } : {}),
          opacity: (phase === 'brand' || phase === 'services' || phase === 'cta') ? 1 : 0,
          transition: 'opacity 1.2s ease',
        }} />
      ))}

      {/* ── Terminal Phase ─────────────────────────────────────────────── */}
      {(phase === 'atmosphere' || phase === 'terminal' || phase === 'brand') && (
        <div style={{
          position: 'relative', zIndex: 3, textAlign: 'left',
          minWidth: 380, maxWidth: '88vw',
          opacity: phase === 'brand' ? 0 : 1,
          transition: 'opacity 0.6s ease',
        }}>
          {visibleLines.map((line, i) => (
            <div key={i} style={{
              color: i === visibleLines.length - 1 ? '#EE6100' : '#2BB6A3',
              fontSize: 13, marginBottom: 7, letterSpacing: '0.06em',
              opacity: 0, animation: 'fade-in 0.3s ease forwards',
            }}>
              <span style={{ color: '#6A8A82' }}>{'>'} </span>
              {line}
              {i === visibleLines.length - 1 && phase !== 'brand' && (
                <span style={{ opacity: cursorVisible ? 1 : 0, color: '#EE6100' }}>_</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Brand Phase: Logo + Name + Tagline ─────────────────────────── */}
      {(phase === 'brand' || phase === 'services' || phase === 'cta') && (
        <div style={{
          position: 'relative', zIndex: 3,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          opacity: (phase === 'services' || phase === 'cta') ? 0 : 1,
          transform: (phase === 'services' || phase === 'cta') ? 'translateY(-20px) scale(0.95)' : 'translateY(0) scale(1)',
          transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Brand name */}
          <div style={{
            fontSize: 'clamp(18px, 3vw, 28px)', fontWeight: 700,
            fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
            color: '#F4F1EA', letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 6, opacity: 0, animation: 'fade-in 0.6s ease 0.2s forwards',
          }}>
            {BRAND_NAME}
          </div>

          {/* Tagline */}
          <div style={{
            fontSize: 'clamp(12px, 2vw, 15px)',
            fontFamily: "'Share Tech Mono', monospace",
            color: '#2BB6A3', letterSpacing: '0.15em', textTransform: 'uppercase',
            marginBottom: 30, opacity: 0, animation: 'fade-in 0.6s ease 0.5s forwards',
          }}>
            {TAGLINE}
          </div>

          {/* Logo image */}
          <div style={{ opacity: 0, animation: 'fade-in 0.8s ease 0.3s forwards' }}>
            <img
              src="/postera-wordmark.png"
              alt={BRAND_NAME}
              style={{
                height: 'clamp(60px, 12vh, 110px)',
                width: 'auto', objectFit: 'contain',
                filter: 'drop-shadow(0 0 40px rgba(43,182,163,0.35)) drop-shadow(0 0 80px rgba(238,97,0,0.12))',
              }}
            />
          </div>

          {/* Location */}
          <div style={{
            marginTop: 20, fontSize: 11, color: '#6A8A82',
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6,
            opacity: 0, animation: 'fade-in 0.6s ease 0.8s forwards',
          }}>
            <span>📍</span> {LOCATION}
          </div>
        </div>
      )}

      {/* ── Services Phase: 6-service showcase grid ────────────────────── */}
      {(phase === 'services' || phase === 'cta') && (
        <div style={{
          position: 'relative', zIndex: 3,
          width: '100%', maxWidth: 720, padding: '0 24px',
          opacity: phase === 'cta' ? 0 : 1,
          transform: phase === 'cta' ? 'translateY(-10px)' : 'translateY(0)',
          transition: 'all 0.7s ease',
        }}>
          {/* Section label */}
          <div style={{
            textAlign: 'center', marginBottom: 24,
            fontSize: 10, color: '#EE6100', fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            fontFamily: "'Share Tech Mono', monospace",
            opacity: 0, animation: 'fade-in 0.5s ease 0.1s forwards',
          }}>
            Our Services
          </div>

          {/* 3×2 grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
          }}>
            {SERVICES.map(({ icon, label, color }, i) => (
              <div key={label} style={{
                background: `linear-gradient(160deg, rgba(${hexToRgb(color)},0.08) 0%, rgba(${hexToRgb(color)},0.02) 100%)`,
                border: `1px solid rgba(${hexToRgb(color)},0.2)`,
                borderRadius: 10,
                padding: '16px 10px',
                textAlign: 'center',
                opacity: 0,
                animation: `fade-in 0.4s ease ${0.15 + i * 0.1}s forwards`,
                transition: 'all 0.3s ease',
              }}>
                <div style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', marginBottom: 6 }}>{icon}</div>
                <div style={{
                  fontSize: 'clamp(10px, 1.4vw, 12px)', fontWeight: 600,
                  color, letterSpacing: '0.04em',
                  fontFamily: "'Poppins', sans-serif",
                  lineHeight: 1.3,
                }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA Phase: Final marketing impression ──────────────────────── */}
      {phase === 'cta' && (
        <div style={{
          position: 'relative', zIndex: 3,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 18, opacity: 0, animation: 'fade-in 0.7s ease 0.15s forwards',
        }}>
          {/* Divider */}
          <div style={{
            width: 120, height: 1,
            background: 'linear-gradient(90deg, transparent, #2BB6A3, #EE6100, #2BB6A3, transparent)',
            opacity: 0.6,
          }} />

          {/* Welcome headline */}
          <div style={{
            fontSize: 'clamp(16px, 3vw, 24px)', fontWeight: 700,
            fontFamily: "'Rajdhani', 'Poppins', sans-serif",
            color: '#F4F1EA', letterSpacing: '0.06em',
            textAlign: 'center',
          }}>
            Welcome to {BRAND_SHORT}
          </div>

          {/* Service summary tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 600 }}>
            {SERVICES.map(({ label, color }) => (
              <span key={label} style={{
                padding: '3px 10px', borderRadius: 20,
                border: `1px solid rgba(${hexToRgb(color)},0.3)`,
                background: `rgba(${hexToRgb(color)},0.06)`,
                color, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                fontFamily: "'Share Tech Mono', monospace",
                whiteSpace: 'nowrap',
              }}>{label}</span>
            ))}
          </div>

          {/* Contact + Trust */}
          <div style={{
            display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center',
            fontSize: 11, color: '#6A8A82',
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: '0.06em',
          }}>
            <span>✉️ {CONTACT_EMAIL}</span>
            <span>💬 WhatsApp Us</span>
            <span>🇰🇪 Made in Kenya</span>
          </div>
        </div>
      )}

      {/* ── Bottom brand bar (always visible) ──────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0,
        zIndex: 2, textAlign: 'center',
        fontSize: 10, color: '#6A8A82', letterSpacing: '0.12em', textTransform: 'uppercase',
        fontFamily: "'Share Tech Mono', monospace",
        pointerEvents: 'none',
      }}>
        © 2026 {BRAND_NAME} — Licensed under MIT · MERN · M-Pesa · Made in Kenya 🇰🇪
      </div>

      {/* ── Global animations ──────────────────────────────────────────── */}
      <style>{`
        @keyframes scanline {
          0%   { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes grid-drift {
          0%   { background-position: 0 0, 0 0; }
          100% { background-position: 80px 80px, 80px 80px; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(0.96); opacity: 0.5; }
          50%      { transform: scale(1.02); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ── Helper: hex → r,g,b for rgba() ────────────────────────────────────── */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

/* ── Root container: guaranteed full-viewport cover ─────────────────────── */
const ROOT_STYLE = {
  position: 'fixed',
  inset: 0,
  width: '100vw',
  height: '100vh',
  minWidth: '100vw',
  minHeight: '100vh',
  maxWidth: '100vw',
  maxHeight: '100vh',
  zIndex: 99999,
  background: '#081916',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Share Tech Mono', monospace",
  transition: 'opacity 0.8s ease',
  overflow: 'hidden',
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
