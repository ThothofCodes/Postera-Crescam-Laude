// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Department Admin Allocation Page
import { useEffect, useState } from 'react';
import { api } from '../../../utils/api';
import { Spinner, EmptyState } from '../../../components/UI';
import toast from 'react-hot-toast';

const FALLBACK_DEPTS = ['internet', 'webdev', 'playstation', 'repair', 'cybersecurity', 'govadmin'];
const ROLES = ['DEPT_HEAD_OWNER', 'STAFF'];

export default function DepartmentAdminAllocation() {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [depts, setDepts] = useState(FALLBACK_DEPTS);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    departmentSlug: '',
    adminEmail: '',
    adminName: '',
    role: 'STAFF',
    permissions: {
      canManageUsers: false,
      canManageInventory: false,
      canManageBilling: false,
      canViewReports: true,
      canManageTickets: false,
    },
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [createdAllocation, setCreatedAllocation] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/departments').then(({ data }) => {
      const slugs = data.filter(d => d.isActive !== false).map(d => d.slug);
      if (slugs.length > 0) setDepts(slugs);
    }).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/department-admins');
      setAllocations(data);
    } catch (err) {
      toast.error('Failed to load allocations');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/department-admins', form);
      setCreatedAllocation(data);
      toast.success('Admin allocated successfully');
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
    setSaving(false);
  };

  const updateAllocation = async (id, updates) => {
    try {
      await api.put(`/department-admins/${id}`, updates);
      toast.success('Allocation updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const removeAllocation = async (id) => {
    if (!window.confirm('Remove this admin allocation?')) return;
    try {
      await api.delete(`/department-admins/${id}`);
      toast.success('Allocation removed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const filteredAllocations = allocations.filter(a => {
    if (!filter) return true;
    return a.departmentSlug === filter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 16, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#EE6100' }}>
          ◉ Department Admin Allocation ({filteredAllocations.length})
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="">All Departments</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={() => { setForm({ departmentSlug: '', adminEmail: '', adminName: '', role: 'STAFF', permissions: { canManageUsers: false, canManageInventory: false, canManageBilling: false, canViewReports: true, canManageTickets: false }, notes: '' }); setModal('create'); }} style={btn('#EE6100')}>
            + Allocate Admin
          </button>
        </div>
      </div>

      {/* Allocations Table */}
      {loading ? <Spinner /> : filteredAllocations.length === 0 ? (
        <EmptyState icon="◉" message="No admin allocations found" />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr style={{ background: 'rgba(238,97,0,0.04)', borderBottom: '1px solid rgba(238,97,0,0.15)' }}>
                {['Admin', 'Department', 'Role', 'Permissions', 'Status', 'Allocated By', 'Actions'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAllocations.map(a => (
                <tr key={a._id} style={{ borderBottom: '1px solid rgba(26,58,92,0.4)', opacity: a.isActive ? 1 : 0.4 }}>
                  <td style={td}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#F4F1EA' }}>{a.adminName}</span>
                      <br />
                      <span style={{ fontSize: 11, color: '#6A8A82' }}>{a.adminEmail}</span>
                    </div>
                  </td>
                  <td style={td}>
                    <span style={deptBadge}>{a.departmentSlug}</span>
                  </td>
                  <td style={td}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, background: 'rgba(238,97,0,0.08)', border: '1px solid rgba(238,97,0,0.2)', color: '#EE6100', fontWeight: 700, letterSpacing: '0.08em' }}>
                      {a.role}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {a.permissions?.canManageUsers && <span style={permBadge}>Users</span>}
                      {a.permissions?.canManageInventory && <span style={permBadge}>Inventory</span>}
                      {a.permissions?.canManageBilling && <span style={permBadge}>Billing</span>}
                      {a.permissions?.canViewReports && <span style={permBadge}>Reports</span>}
                      {a.permissions?.canManageTickets && <span style={permBadge}>Tickets</span>}
                    </div>
                  </td>
                  <td style={td}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, background: a.isActive ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)', border: `1px solid ${a.isActive ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)'}`, color: a.isActive ? '#00ff88' : '#ff3366', fontWeight: 700 }}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={td}>
                    <span style={{ fontSize: 11, color: '#A9C4BE' }}>
                      {a.allocatedBy?.name || 'System'}
                    </span>
                  </td>
                  <td style={td}>
                    <button onClick={() => updateAllocation(a._id, { isActive: !a.isActive })} style={btnSm(a.isActive ? '#ff3366' : '#00ff88')}>
                      {a.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => removeAllocation(a._id)} style={btnSm('#ff3366')}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {modal === 'create' && (
        <div style={overlay}>
          <div style={box}>
            <h3 style={{ margin: '0 0 1rem', color: '#EE6100' }}>Allocate Admin to Department</h3>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={lbl}>Department</label>
                <select value={form.departmentSlug} onChange={(e) => setForm({ ...form, departmentSlug: e.target.value })} required style={inp}>
                  <option value="">Select Department</option>
                  {depts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Admin Email (Personal Email)</label>
                <input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} required style={inp} placeholder="admin@example.com" />
              </div>
              <div>
                <label style={lbl}>Admin Name</label>
                <input value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} required style={inp} placeholder="John Doe" />
              </div>
              <div>
                <label style={lbl}>Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={inp}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              
              {/* Permissions */}
              <div>
                <label style={lbl}>Permissions</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {Object.entries(form.permissions).map(([key, value]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#A9C4BE' }}>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setForm({
                          ...form,
                          permissions: { ...form.permissions, [key]: e.target.checked }
                        })}
                      />
                      {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label style={lbl}>Notes (Optional)</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inp, minHeight: 60 }} placeholder="Additional notes about this allocation..." />
              </div>
              
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModal(null)} style={btn('#6A8A82')}>Cancel</button>
                <button type="submit" disabled={saving} style={btn('#EE6100')}>{saving ? 'Allocating...' : 'Allocate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Created Allocation Modal */}
      {createdAllocation && (
        <div style={overlay}>
          <div style={{ ...box, maxWidth: 480 }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: 48 }}>✅</span>
              <h3 style={{ margin: '0.5rem 0', color: '#00ff88' }}>Admin Allocated Successfully!</h3>
            </div>
            
            <div style={{ background: 'rgba(0, 255, 136, 0.05)', border: '1px solid rgba(0, 255, 136, 0.2)', borderRadius: 6, padding: '1rem', marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: 12, color: '#A9C4BE' }}><strong>Admin:</strong> {createdAllocation.user.name}</p>
              <p style={{ margin: '0 0 0.5rem', fontSize: 12, color: '#A9C4BE' }}><strong>Email:</strong> {createdAllocation.user.email}</p>
              
              {createdAllocation.tempPassword && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: 4 }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: 11, color: '#ffd700', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    🔐 Temporary Password
                  </p>
                  <p style={{ margin: 0, fontSize: 16, fontFamily: 'monospace', color: '#F4F1EA', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 4, wordBreak: 'break-all' }}>
                    {createdAllocation.tempPassword}
                  </p>
                  <p style={{ margin: '0.5rem 0 0', fontSize: 11, color: '#A9C4BE' }}>
                    Admin must change this password on first login.
                  </p>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {createdAllocation.tempPassword && (
                <button onClick={() => { navigator.clipboard.writeText(createdAllocation.tempPassword); toast.success('Password copied!'); }} style={btn('#00ff88')}>📋 Copy Password</button>
              )}
              <button onClick={() => setCreatedAllocation(null)} style={btn('#EE6100')}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const btn = (c) => ({ padding: '0.45rem 1rem', background: `${c}18`, color: c, border: `1px solid ${c}44`, borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' });
const btnSm = (c) => ({ ...btn(c), padding: '2px 8px', marginRight: 4 });
const tbl = { width: '100%', borderCollapse: 'collapse', background: 'linear-gradient(160deg,#0F2620,#0F2620)', borderRadius: 8, overflow: 'hidden' };
const th = { padding: '0.6rem 0.8rem', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#EE6100' };
const td = { padding: '0.6rem 0.8rem', fontSize: 13, color: '#a8c0d8' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(2,4,8,0.88)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const box = { background: 'linear-gradient(160deg,#0F2620,#0F2620)', border: '1px solid rgba(238,97,0,0.25)', borderRadius: 8, padding: '1.5rem', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' };
const inp = { width: '100%', padding: '0.5rem 0.7rem', background: 'rgba(6,13,20,0.8)', border: '1px solid rgba(238,97,0,0.15)', borderRadius: 4, color: '#F4F1EA', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
const lbl = { display: 'block', marginBottom: 4, fontSize: 10, color: '#EE6100', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' };
const selectStyle = { padding: '0.4rem 0.6rem', background: 'rgba(6,13,20,0.8)', border: '1px solid rgba(238,97,0,0.15)', borderRadius: 4, color: '#F4F1EA', fontSize: 11, outline: 'none' };
const deptBadge = { fontSize: 10, padding: '2px 8px', borderRadius: 3, background: 'rgba(43,182,163,0.1)', border: '1px solid rgba(43,182,163,0.3)', color: '#2BB6A3', fontWeight: 700, letterSpacing: '0.08em' };
const permBadge = { fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', fontWeight: 700 };
