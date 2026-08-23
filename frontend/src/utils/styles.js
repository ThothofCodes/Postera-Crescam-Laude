// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Shared inline style constants for the futuristic metallic theme

export const C = {
  // Backgrounds
  bgVoid:     '#081916',
  bgDeep:     '#0B1F1B',
  bgPanel:    '#0F2620',
  bgCard:     '#0F2620',
  bgElevated: '#112240',
  bgHover:    '#162d4a',

  // Accents
  cyan:       '#EE6100',
  cyanDim:    '#0099bb',
  silver:     '#a8c0d8',
  gold:       '#ffd700',
  green:      '#00ff88',
  red:        '#ff3366',
  orange:     '#ff8800',
  purple:     '#a78bfa',

  // Text
  textPrimary:   '#F4F1EA',
  textSecondary: '#A9C4BE',
  textMuted:     '#6A8A82',
};

// Card container
export const card = {
  background: 'linear-gradient(160deg, #0F2620 0%, #0F2620 100%)',
  border: '1px solid rgba(238,97,0,0.12)',
  borderRadius: 8,
  padding: '1.25rem',
  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
  position: 'relative',
  overflow: 'hidden',
};

// Input field
export const input = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  background: 'rgba(6,13,20,0.8)',
  border: '1px solid rgba(238,97,0,0.15)',
  borderRadius: 4,
  color: '#F4F1EA',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease',
};

// Label
export const label = {
  display: 'block',
  marginBottom: 5,
  fontSize: 10,
  color: '#EE6100',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

// Primary button
export const btnPrimary = (bg = 'rgba(238,97,0,0.15)', color = '#EE6100', border = 'rgba(238,97,0,0.35)') => ({
  padding: '0.5rem 1.1rem',
  background: bg,
  color,
  border: `1px solid ${border}`,
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap',
});

export const btnDanger = btnPrimary('rgba(255,51,102,0.1)', '#ff3366', 'rgba(255,51,102,0.3)');
export const btnSuccess = btnPrimary('rgba(0,255,136,0.1)', '#00ff88', 'rgba(0,255,136,0.3)');
export const btnGhost = btnPrimary('rgba(143,168,192,0.06)', '#A9C4BE', 'rgba(143,168,192,0.2)');

// Table
export const table = {
  width: '100%',
  borderCollapse: 'collapse',
  background: 'linear-gradient(160deg, #0F2620, #0F2620)',
  borderRadius: 8,
  overflow: 'hidden',
  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
};
export const th = {
  padding: '0.7rem 1rem',
  textAlign: 'left',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#EE6100',
  background: 'linear-gradient(90deg, rgba(238,97,0,0.06), rgba(238,97,0,0.02))',
  borderBottom: '1px solid rgba(238,97,0,0.2)',
};
export const td = {
  padding: '0.7rem 1rem',
  fontSize: 13,
  color: '#a8c0d8',
  borderBottom: '1px solid rgba(26,58,92,0.4)',
};

// Modal overlay + box
export const overlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(2,4,8,0.88)',
  backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
};
export const modalBox = {
  background: 'linear-gradient(160deg, #0F2620, #0F2620)',
  border: '1px solid rgba(238,97,0,0.25)',
  borderRadius: 8,
  padding: '1.5rem',
  width: '100%',
  maxWidth: 520,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 40px rgba(238,97,0,0.08)',
  position: 'relative',
};

// Tab button factory
export const tabBtn = (active) => ({
  padding: '4px 14px',
  borderRadius: 3,
  border: `1px solid ${active ? 'rgba(238,97,0,0.4)' : 'rgba(74,101,128,0.4)'}`,
  background: active ? 'rgba(238,97,0,0.08)' : 'transparent',
  color: active ? '#EE6100' : '#6A8A82',
  cursor: 'pointer',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  transition: 'all 0.15s ease',
  boxShadow: active ? '0 0 8px rgba(238,97,0,0.15)' : 'none',
});
