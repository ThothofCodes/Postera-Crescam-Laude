// PCL — Government Documents Page (Gov Admin / Branch: Civic)
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { api } from '../../../utils/api';
import { Spinner } from '../../../components/UI';

const COLOR = '#60A5FA';

export default function GovDocs() {
  const { token } = useAdminAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/documents', { headers: { Authorization: `Bearer ${token}` }, params: { type: filter === 'all' ? undefined : filter } });
      setDocs(data.documents || data || []);
    } catch { setDocs([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const docTypes = ['all', 'business_permit', 'tax_compliance', 'kra_pin', 'nssf', 'nhif', 'id_renewal', 'certificate', 'other'];
  const statusColors = { pending: '#FFB020', processing: COLOR, completed: '#39FF88', rejected: '#FF3B3B' };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", margin: 0 }}>Government Documents</h2>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: '#6A8A82' }}>{docs.length} total</span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {docTypes.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ padding: '4px 10px', borderRadius: 4, border: `1px solid ${filter === t ? COLOR : 'rgba(36,74,68,0.4)'}`, background: filter === t ? `${COLOR}20` : 'transparent', color: filter === t ? COLOR : '#6A8A82', cursor: 'pointer', fontSize: 10, fontFamily: "'Share Tech Mono',monospace", textTransform: 'uppercase' }}>{t.replace('_', ' ')}</button>
        ))}
      </div>

      {loading ? <Spinner /> : docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6A8A82' }}>No documents found</div>
      ) : (
        <div style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'rgba(36,74,68,0.3)' }}>
              {['Client', 'Document Type', 'Status', 'Submitted', 'Deadline', 'Actions'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: 10, color: '#2BB6A3', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={d._id || i} style={{ borderTop: '1px solid rgba(36,74,68,0.2)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 13, color: '#F4F1EA' }}>{d.clientName || d.client?.name || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 12, color: '#A9C4BE', textTransform: 'capitalize' }}>{(d.type || d.documentType || '—').replace('_', ' ')}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: statusColors[d.status] || '#6A8A82', background: `${statusColors[d.status] || '#6A8A82'}15`, fontFamily: "'Share Tech Mono',monospace", textTransform: 'uppercase' }}>{d.status || 'pending'}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 12, color: '#6A8A82', fontFamily: "'Share Tech Mono',monospace" }}>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 12, color: d.deadline && new Date(d.deadline) < new Date(Date.now() + 7 * 86400000) ? '#FFB020' : '#6A8A82', fontFamily: "'Share Tech Mono',monospace" }}>{d.deadline ? new Date(d.deadline).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button style={{ padding: '3px 8px', borderRadius: 3, border: `1px solid ${COLOR}40`, background: 'transparent', color: COLOR, cursor: 'pointer', fontSize: 11, fontFamily: "'Share Tech Mono',monospace" }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
