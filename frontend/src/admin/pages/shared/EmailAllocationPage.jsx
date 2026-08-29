// PCL — Email Allocation Page (Super Admin)
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { api } from '../../../utils/api';
import { Spinner } from '../../../components/UI';

export default function EmailAllocationPage({ color = '#EE6100' }) {
  const { token } = useAdminAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', department: 'internet', role: 'staff' });
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/staff', { headers: { Authorization: `Bearer ${token}` } });
      setStaff(data.staff || data || []);
    } catch { setStaff([]); }
    setLoading(false);
  };

  const [departments, setDepartments] = useState([]);
  const [deptColors, setDeptColors] = useState({});

  useEffect(() => { load(); }, []);
  useEffect(() => {
    api.get('/departments').then(({ data }) => {
      setDepartments(data.map(d => d.slug));
      const colors = {};
      data.forEach(d => { colors[d.slug] = d.color || '#2BB6A3'; });
      setDeptColors(colors);
    }).catch(() => {});
  }, []);

  const filtered = filter === 'all' ? staff : staff.filter(s => s.department === filter);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/staff', form, { headers: { Authorization: `Bearer ${token}` } });
      setShowForm(false);
      setForm({ name: '', email: '', department: 'internet', role: 'staff' });
      load();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", margin: 0 }}>Email Allocation</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '6px 14px', background: color, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Allocate Email</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {[
            { label: 'Name', key: 'name', type: 'text' },
            { label: 'Email', key: 'email', type: 'email' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: 10, color: '#6A8A82', marginBottom: 4, fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required style={{ width: '100%', padding: 8, background: '#081916', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, color: '#F4F1EA', fontSize: 13 }} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: 10, color: '#6A8A82', marginBottom: 4, fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Department</label>
            <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} style={{ width: '100%', padding: 8, background: '#081916', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, color: '#F4F1EA', fontSize: 13 }}>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, color: '#6A8A82', marginBottom: 4, fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ width: '100%', padding: 8, background: '#081916', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, color: '#F4F1EA', fontSize: 13 }}>
              {['staff', 'manager', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" style={{ padding: '8px 16px', background: color, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Save</button>
          </div>
        </form>
      )}

      {/* Department filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={{ padding: '4px 12px', borderRadius: 4, border: `1px solid ${filter === 'all' ? color : 'rgba(36,74,68,0.4)'}`, background: filter === 'all' ? `${color}20` : 'transparent', color: filter === 'all' ? color : '#6A8A82', cursor: 'pointer', fontSize: 11, fontFamily: "'Share Tech Mono',monospace" }}>ALL ({staff.length})</button>
        {departments.map(d => (
          <button key={d} onClick={() => setFilter(d)} style={{ padding: '4px 12px', borderRadius: 4, border: `1px solid ${filter === d ? deptColors[d] : 'rgba(36,74,68,0.4)'}`, background: filter === d ? `${deptColors[d]}20` : 'transparent', color: filter === d ? deptColors[d] : '#6A8A82', cursor: 'pointer', fontSize: 11, fontFamily: "'Share Tech Mono',monospace", textTransform: 'uppercase' }}>
            {d} ({staff.filter(s => s.department === d).length})
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6A8A82' }}>No staff members found</div>
      ) : (
        <div style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'rgba(36,74,68,0.3)' }}>
              {['Name', 'Email', 'Department', 'Role', 'Status'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: 10, color: '#2BB6A3', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s._id || i} style={{ borderTop: '1px solid rgba(36,74,68,0.2)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 13, color: '#F4F1EA', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 12, color: '#A9C4BE', fontFamily: "'Share Tech Mono',monospace" }}>{s.email}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: deptColors[s.department] || '#6A8A82', background: `${deptColors[s.department] || '#6A8A82'}15`, fontFamily: "'Share Tech Mono',monospace", textTransform: 'uppercase' }}>{s.department}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 12, color: '#A9C4BE', textTransform: 'capitalize' }}>{s.role}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.isActive !== false ? '#39FF88' : '#FF3B3B', display: 'inline-block', boxShadow: s.isActive !== false ? '0 0 8px rgba(57,255,136,0.4)' : 'none' }} />
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
