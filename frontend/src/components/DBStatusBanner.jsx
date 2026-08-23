// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Circuit Canopy DBStatusBanner
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import useSocket from '../hooks/useSocket';

export default function DBStatusBanner() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.get('/health')
      .then(({ data }) => setStatus(data.status))
      .catch(() => setStatus('degraded'));
  }, []);

  useSocket({
    'system:status': ({ status: s }) => { setStatus(s === 'ok' ? 'ok' : 'degraded'); },
    connect: () => setStatus('ok'),
    disconnect: () => {
      setTimeout(() => {
        api.get('/health')
          .then(({ data }) => setStatus(data.status))
          .catch(() => setStatus('degraded'));
      }, 4000);
    },
  });

  if (status === 'ok' || status === null) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#FF3B3B',
      borderBottom: '1px solid rgba(255,59,59,0.6)',
      padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>⚠</span>
        <div>
          <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', color: '#fff', fontFamily: "'Share Tech Mono',monospace" }}>
            DATABASE NOT CONNECTED
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginLeft: 12 }}>
            Open <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 3 }}>backend/.env</code>
            {' '}→ set <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 3 }}>MONGO_URI</code>
            {' '}→ restart
          </span>
        </div>
      </div>
      <a href="https://cloud.mongodb.com" target="_blank" rel="noreferrer"
        style={{ padding: '3px 12px', background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.4)', borderRadius: 3, color: '#fff',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          textDecoration: 'none', whiteSpace: 'nowrap', fontFamily: "'Share Tech Mono',monospace" }}>
        Get Atlas URI →
      </a>
    </div>
  );
}
