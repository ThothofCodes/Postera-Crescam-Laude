// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { Link } from 'react-router-dom';
import { formatKES } from '../utils/helpers';

const ICONS = {
  'web-development':      '🌐',
  'cybersecurity':        '🔒',
  'networking':           '📡',
  'hardware-advisory':    '💻',
  'business-digitisation':'📊',
  'social-media-strategy':'📱',
  'data-recovery':        '💾',
  'general-it':           '🛠',
};

const COLORS = {
  'web-development':      '#EE6100',
  'cybersecurity':        '#ff3366',
  'networking':           '#00ff88',
  'hardware-advisory':    '#ffd700',
  'business-digitisation':'#a78bfa',
  'social-media-strategy':'#f472b6',
  'data-recovery':        '#ff8800',
  'general-it':           '#22d3ee',
};

import { memo } from 'react';

function ConsultationCard({ type, fees }) {
  const label = type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const minFee = Math.min(...Object.values(fees));
  const color = COLORS[type] || '#EE6100';

  return (
    <div style={{
      background: 'linear-gradient(160deg, #0F2620 0%, #0F2620 100%)',
      border: `1px solid rgba(${hexToRgb(color)},0.15)`,
      borderRadius: 8,
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.25s ease',
    }}
      onMouseOver={(e) => {
        e.currentTarget.style.border = `1px solid rgba(${hexToRgb(color)},0.4)`;
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(${hexToRgb(color)},0.1)`;
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.border = `1px solid rgba(${hexToRgb(color)},0.15)`;
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}>
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.6 }} />

      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 8,
        background: `rgba(${hexToRgb(color)},0.08)`,
        border: `1px solid rgba(${hexToRgb(color)},0.25)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
        boxShadow: `0 0 12px rgba(${hexToRgb(color)},0.15)`,
      }}>{ICONS[type] || '◈'}</div>

      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#F4F1EA', letterSpacing: '0.02em' }}>{label}</h3>

      {/* Duration/fee chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {Object.entries(fees).map(([min, fee]) => (
          <span key={min} style={{
            background: `rgba(${hexToRgb(color)},0.06)`,
            border: `1px solid rgba(${hexToRgb(color)},0.2)`,
            borderRadius: 3, padding: '2px 8px',
            fontSize: 10, color, fontWeight: 700, letterSpacing: '0.08em',
          }}>
            {min}min · {formatKES(fee)}
          </span>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: 12, color: '#6A8A82' }}>
        From <span style={{ color, fontWeight: 700 }}>{formatKES(minFee)}</span>
      </p>

      <Link to={`/consult/book?type=${type}`} style={{
        display: 'block', textAlign: 'center', marginTop: 'auto',
        padding: '0.5rem',
        background: `rgba(${hexToRgb(color)},0.08)`,
        border: `1px solid rgba(${hexToRgb(color)},0.3)`,
        borderRadius: 4, color, textDecoration: 'none',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        transition: 'all 0.2s ease',
      }}
        onMouseOver={(e) => { e.currentTarget.style.background = `rgba(${hexToRgb(color)},0.18)`; e.currentTarget.style.boxShadow = `0 0 12px rgba(${hexToRgb(color)},0.25)`; }}
        onMouseOut={(e) => { e.currentTarget.style.background = `rgba(${hexToRgb(color)},0.08)`; e.currentTarget.style.boxShadow = 'none'; }}>
        Book Session →
      </Link>
    </div>
  );
}

export default memo(ConsultationCard);

// Helper: hex to r,g,b string for rgba()
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}
