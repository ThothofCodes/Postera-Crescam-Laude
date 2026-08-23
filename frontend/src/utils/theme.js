// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Shared inline style constants — PCL Circuit Canopy dark theme

export const T = {
  // Page wrapper
  page: { padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },

  // Section header row
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  h2: { margin: 0, fontSize: 20, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani','Poppins',sans-serif" },

  // Card / panel
  card: { background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' },

  // Table
  table: { width: '100%', borderCollapse: 'collapse', background: '#0F2620', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.3)', border: '1px solid rgba(36,74,68,0.4)' },
  thead: { background: 'rgba(36,74,68,0.3)', borderBottom: '1px solid rgba(36,74,68,0.4)' },
  th: { padding: '0.8rem 1rem', textAlign: 'left', fontSize: 11, fontWeight: 400, color: '#2BB6A3', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Share Tech Mono',monospace" },
  td: { padding: '0.8rem 1rem', fontSize: 13, color: '#A9C4BE', borderBottom: '1px solid rgba(36,74,68,0.2)', fontFamily: "'Poppins',sans-serif" },
  tdBold: { padding: '0.8rem 1rem', fontSize: 13, color: '#F4F1EA', fontWeight: 600, borderBottom: '1px solid rgba(36,74,68,0.2)', fontFamily: "'Poppins',sans-serif" },
  trHover: { borderBottom: '1px solid rgba(36,74,68,0.2)' },

  // Input
  input: { width: '100%', padding: '0.6rem 0.85rem', background: '#081916', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, color: '#F4F1EA', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'Poppins',sans-serif" },

  // Label
  label: { display: 'block', marginBottom: 5, fontSize: 11, color: '#6A8A82', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace" },

  // Modal overlay + box
  overlay: { position: 'fixed', inset: 0, background: 'rgba(8,25,22,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1.75rem', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', position: 'relative' },
  modalWide: { background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1.75rem', width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', position: 'relative' },
  modalH3: { margin: '0 0 1.25rem', fontSize: 16, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani','Poppins',sans-serif" },
};

// Button factory
export const btn = (variant = 'primary') => {
  const map = {
    primary: { background: '#EE6100', color: '#FFFFFF', border: 'none' },
    teal:    { background: '#2BB6A3', color: '#081916', border: 'none' },
    green:   { background: '#39FF88', color: '#081916', border: 'none' },
    ghost:   { background: 'transparent', color: '#2BB6A3', border: '1px solid #2BB6A3' },
    danger:  { background: 'rgba(255,59,59,0.15)', color: '#FF3B3B', border: '1px solid rgba(255,59,59,0.3)' },
  };
  return { ...map[variant], padding: '0.5rem 1.1rem', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Poppins',sans-serif", transition: 'all 0.2s ease' };
};

export const btnSm = (variant = 'teal') => ({ ...btn(variant), padding: '3px 10px', fontSize: 12, marginRight: 4 });

// Tab pill
export const tabPill = (active) => ({
  padding: '5px 14px', borderRadius: 4,
  border: `1px solid ${active ? '#EE6100' : 'rgba(36,74,68,0.4)'}`,
  background: active ? 'rgba(238,97,0,0.15)' : 'transparent',
  color: active ? '#EE6100' : '#6A8A82',
  cursor: 'pointer', fontSize: 12, fontWeight: 600,
  fontFamily: "'Share Tech Mono',monospace", transition: 'all 0.15s ease',
  textTransform: 'capitalize',
});

// Badge
export const badge = { background: 'rgba(36,74,68,0.3)', color: '#A9C4BE', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontFamily: "'Share Tech Mono',monospace", border: '1px solid rgba(36,74,68,0.4)' };
