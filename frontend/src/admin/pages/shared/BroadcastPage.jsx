// PCL — Broadcast Page (Super Admin — send announcements to all/department staff)
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { api } from '../../../utils/api';
import { Spinner } from '../../../components/UI';

export default function BroadcastPage({ color = '#EE6100' }) {
  const { token } = useAdminAuth();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', target: 'all', priority: 'normal' });
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/broadcasts', { headers: { Authorization: `Bearer ${token}` } });
      setBroadcasts(data.broadcasts || data || []);
    } catch { setBroadcasts([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/admin/broadcasts', form, { headers: { Authorization: `Bearer ${token}` } });
      setShowForm(false);
      setForm({ title: '', message: '', target: 'all', priority: 'normal' });
      load();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    setSending(false);
  };

  const priorityColors = { urgent: '#FF3B3B', high: '#FFB020', normal: '#2BB6A3', low: '#6A8A82' };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", margin: 0 }}>Broadcasts</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '6px 14px', background: color, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ New Broadcast</button>
      </div>

      {showForm && (
        <form onSubmit={handleSend} style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, color: '#6A8A82', marginBottom: 4, fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={{ width: '100%', padding: 8, background: '#081916', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, color: '#F4F1EA', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, color: '#6A8A82', marginBottom: 4, fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Target</label>
              <select value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} style={{ width: '100%', padding: 8, background: '#081916', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, color: '#F4F1EA', fontSize: 13 }}>
                {['all', 'internet', 'webdev', 'playstation', 'repair', 'cybersecurity', 'govadmin', 'managers', 'staff'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, color: '#6A8A82', marginBottom: 4, fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ width: '100%', padding: 8, background: '#081916', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, color: '#F4F1EA', fontSize: 13 }}>
                {['urgent', 'high', 'normal', 'low'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10, color: '#6A8A82', marginBottom: 4, fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Message</label>
            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={3} style={{ width: '100%', padding: 8, background: '#081916', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, color: '#F4F1EA', fontSize: 13, resize: 'vertical' }} />
          </div>
          <button type="submit" disabled={sending} style={{ padding: '8px 20px', background: color, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13, opacity: sending ? 0.6 : 1 }}>{sending ? 'Sending...' : 'Send Broadcast'}</button>
        </form>
      )}

      {loading ? <Spinner /> : broadcasts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6A8A82' }}>No broadcasts yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {broadcasts.map((b, i) => (
            <div key={b._id || i} style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1.25rem', borderLeft: `3px solid ${priorityColors[b.priority] || '#6A8A82'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif" }}>{b.title}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, color: priorityColors[b.priority], background: `${priorityColors[b.priority]}15`, fontFamily: "'Share Tech Mono',monospace", textTransform: 'uppercase' }}>{b.priority}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, color: '#2BB6A3', background: 'rgba(43,182,163,0.1)', fontFamily: "'Share Tech Mono',monospace" }}>→ {b.target}</span>
                </div>
                <span style={{ fontSize: 11, color: '#6A8A82', fontFamily: "'Share Tech Mono',monospace" }}>{b.createdAt ? new Date(b.createdAt).toLocaleString() : '—'}</span>
              </div>
              <p style={{ fontSize: 13, color: '#A9C4BE', lineHeight: 1.6, margin: 0 }}>{b.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
