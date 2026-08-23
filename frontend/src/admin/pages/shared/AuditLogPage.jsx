// PCL — Audit Log Page (shared across all departments + super admin)
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { api } from '../../../utils/api';
import { Spinner } from '../../../components/UI';

const actionIcons = { create: '＋', update: '✎', delete: '✕', login: '▶', logout: '■', export: '↗', import: '↙', payment: '₦', refund: '↩' };
const actionColors = { create: '#39FF88', update: '#2BB6A3', delete: '#FF3B3B', login: '#EE6100', logout: '#6A8A82', export: '#A78BFA', import: '#60A5FA', payment: '#39FF88', refund: '#FFB020' };

export default function AuditLogPage({ color = '#EE6100', department }) {
  const { token } = useAdminAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (filter !== 'all') params.action = filter;
      if (department) params.department = department;
      const { data } = await api.get('/admin/audit', { headers: { Authorization: `Bearer ${token}` }, params });
      setLogs(data.logs || data || []);
    } catch { setLogs([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter, page]);

  const actionTypes = ['all', 'create', 'update', 'delete', 'login', 'logout', 'payment', 'export'];

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", margin: 0 }}>Audit Log{department ? ` — ${department}` : ''}</h2>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: '#6A8A82' }}>{logs.length} entries</span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {actionTypes.map(a => (
          <button key={a} onClick={() => { setFilter(a); setPage(1); }} style={{ padding: '4px 12px', borderRadius: 4, border: `1px solid ${filter === a ? (actionColors[a] || color) : 'rgba(36,74,68,0.4)'}`, background: filter === a ? `${actionColors[a] || color}20` : 'transparent', color: filter === a ? (actionColors[a] || color) : '#6A8A82', cursor: 'pointer', fontSize: 11, fontFamily: "'Share Tech Mono',monospace", textTransform: 'uppercase' }}>{a}</button>
        ))}
      </div>

      {loading ? <Spinner /> : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6A8A82' }}>No audit entries found</div>
      ) : (
        <div style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'rgba(36,74,68,0.3)' }}>
              {['', 'User', 'Action', 'Target', 'Details', 'Time'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: 10, color: '#2BB6A3', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log._id || i} style={{ borderTop: '1px solid rgba(36,74,68,0.2)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 16, width: 40 }}>{actionIcons[log.action] || '·'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 13, color: '#F4F1EA' }}>{log.user?.name || log.userName || 'System'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: actionColors[log.action] || '#6A8A82', background: `${actionColors[log.action] || '#6A8A82'}15`, fontFamily: "'Share Tech Mono',monospace", textTransform: 'uppercase' }}>{log.action || '—'}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 12, color: '#A9C4BE', fontFamily: "'Share Tech Mono',monospace" }}>{log.target || log.entity || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 12, color: '#6A8A82', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details || log.message || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 11, color: '#6A8A82', fontFamily: "'Share Tech Mono',monospace", whiteSpace: 'nowrap' }}>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: '1rem', justifyContent: 'center' }}>
        {page > 1 && <button onClick={() => setPage(p => p - 1)} style={{ padding: '0.4rem 1rem', background: '#0F2620', color: '#2BB6A3', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: "'Share Tech Mono',monospace" }}>← Prev</button>}
        {logs.length === 50 && <button onClick={() => setPage(p => p + 1)} style={{ padding: '0.4rem 1rem', background: '#0F2620', color: '#2BB6A3', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: "'Share Tech Mono',monospace" }}>Next →</button>}
      </div>
    </div>
  );
}
