// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Spinner & EmptyState primitives

export function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: 16 }}>
      <div style={{ position: 'relative', width: 40, height: 40 }}>
        <div style={{
          position: 'absolute', inset: 0,
          border: '3px solid rgba(36,74,68,0.3)',
          borderTop: '3px solid #2BB6A3',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
        }} />
      </div>
      <span style={{ fontSize: 12, color: '#6A8A82', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace" }}>Loading...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function EmptyState({ icon = '📭', message = 'No data found' }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>{icon}</div>
      <p style={{ fontSize: 15, color: '#6A8A82', fontFamily: "'Poppins', sans-serif", margin: 0 }}>{message}</p>
    </div>
  );
}
