// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../utils/api';
import { formatKES, formatDate } from '../../../utils/helpers';
import { Spinner } from '../../../components/UI';
import StatusBadge from '../../../components/StatusBadge';
import toast from 'react-hot-toast';

const STATUSES = ['proposal','active','review','delivered','on-hold','cancelled'];
const STATUS_COLORS = { proposal:'#ffd700', active:'#EE6100', review:'#a78bfa', delivered:'#00ff88', 'on-hold':'#ff8800', cancelled:'#ff3366' };
const EMPTY = { projectName:'', clientName:'', clientEmail:'', clientPhone:'', projectType:'brochure-website', totalValue:'', startDate:'', deadline:'', notes:'', isRetainer:false, retainerMonthlyFee:'' };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter] = useState(''); // filter applied via kanban view; no setter needed in UI
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('kanban');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/dept/projects', { params: { status: statusFilter, limit: 100 } });
      setProjects(data.projects); setTotal(data.total);
    } catch { setProjects([]); }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'create') { await api.post('/dept/projects', form); toast.success('Project created'); }
      else { await api.put(`/dept/projects/${modal._id}`, form); toast.success('Updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  const byStatus = (s) => projects.filter((p) => p.status === s);

  const openEdit = (p) => setForm({
    projectName:p.projectName, clientName:p.clientName, clientEmail:p.clientEmail||'',
    clientPhone:p.clientPhone||'', projectType:p.projectType||'brochure-website',
    totalValue:p.totalValue||'', startDate:p.startDate?.slice(0,10)||'',
    deadline:p.deadline?.slice(0,10)||'', notes:p.notes||'',
    isRetainer:p.isRetainer||false, retainerMonthlyFee:p.retainerMonthlyFee||'',
    status:p.status,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 16, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a78bfa' }}>◫ Projects ({total})</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {['kanban','list'].map((v) => <button key={v} onClick={() => setView(v)} style={tab(view===v)}>{v}</button>)}
          <button onClick={() => { setForm(EMPTY); setModal('create'); }} style={btn('#a78bfa')}>+ New Project</button>
        </div>
      </div>

      {loading ? <Spinner /> : view === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', alignItems: 'start' }}>
          {['proposal','active','review','delivered'].map((s) => (
            <div key={s} style={{ background: 'linear-gradient(160deg,#0F2620,#0F2620)', border: '1px solid rgba(238,97,0,0.1)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '0.6rem 0.8rem', borderBottom: `2px solid ${STATUS_COLORS[s]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: STATUS_COLORS[s] }}>{s}</span>
                <span style={{ fontSize: 10, color: '#6A8A82' }}>{byStatus(s).length}</span>
              </div>
              <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {byStatus(s).map((p) => (
                  <div key={p._id} onClick={() => { openEdit(p); setModal(p); }} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '0.6rem', cursor: 'pointer', border: '1px solid rgba(238,97,0,0.06)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#F4F1EA', marginBottom: 4 }}>{p.projectName}</div>
                    <div style={{ fontSize: 11, color: '#6A8A82' }}>{p.clientName}</div>
                    {p.totalValue && <div style={{ fontSize: 11, color: '#a78bfa', marginTop: 4 }}>{formatKES(p.totalValue)}</div>}
                    {p.deadline && <div style={{ fontSize: 10, color: '#6A8A82', marginTop: 2 }}>Due: {formatDate(p.deadline)}</div>}
                  </div>
                ))}
                {byStatus(s).length === 0 && <p style={{ fontSize: 11, color: '#2a4a6a', textAlign: 'center', padding: '0.5rem' }}>Empty</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tbl}>
            <thead><tr style={{ background: 'rgba(238,97,0,0.04)', borderBottom: '1px solid rgba(238,97,0,0.15)' }}>
              {['Project','Client','Type','Value','Status','Deadline','Actions'].map((h) => <th key={h} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p._id} style={{ borderBottom: '1px solid rgba(26,58,92,0.4)' }}>
                  <td style={td}><span style={{ fontWeight: 700, color: '#F4F1EA' }}>{p.projectName}</span></td>
                  <td style={td}>{p.clientName}</td>
                  <td style={td}>{p.projectType}</td>
                  <td style={td}>{p.totalValue ? formatKES(p.totalValue) : '—'}</td>
                  <td style={td}><StatusBadge status={p.status} /></td>
                  <td style={td}>{p.deadline ? formatDate(p.deadline) : '—'}</td>
                  <td style={td}><button onClick={() => { openEdit(p); setModal(p); }} style={btnSm('#a78bfa')}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={overlay}>
          <div style={box}>
            <h3 style={{ margin: '0 0 1rem', color: '#a78bfa' }}>{modal === 'create' ? 'New Project' : 'Edit Project'}</h3>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['projectName','Project Name'],['clientName','Client Name'],['clientEmail','Client Email'],['clientPhone','Client Phone']].map(([k,l]) => (
                  <div key={k}><label style={lbl}>{l}</label><input value={form[k]} onChange={(e) => setForm({...form,[k]:e.target.value})} required={['projectName','clientName'].includes(k)} style={inp} /></div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><label style={lbl}>Project Type</label>
                  <select value={form.projectType} onChange={(e) => setForm({...form,projectType:e.target.value})} style={inp}>
                    {['brochure-website','ecommerce','web-app','mobile-app','maintenance','retainer','other'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Total Value (KES)</label><input type="number" value={form.totalValue} onChange={(e) => setForm({...form,totalValue:e.target.value})} style={inp} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><label style={lbl}>Start Date</label><input type="date" value={form.startDate} onChange={(e) => setForm({...form,startDate:e.target.value})} style={inp} /></div>
                <div><label style={lbl}>Deadline</label><input type="date" value={form.deadline} onChange={(e) => setForm({...form,deadline:e.target.value})} style={inp} /></div>
              </div>
              {modal !== 'create' && (
                <div><label style={lbl}>Status</label>
                  <select value={form.status} onChange={(e) => setForm({...form,status:e.target.value})} style={inp}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div><label style={lbl}>Notes</label><textarea value={form.notes} onChange={(e) => setForm({...form,notes:e.target.value})} rows={2} style={{...inp,resize:'vertical'}} /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModal(null)} style={btn('#6A8A82')}>Cancel</button>
                <button type="submit" disabled={saving} style={btn('#a78bfa')}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const btn  = (c) => ({ padding:'0.45rem 1rem', background:`${c}18`, color:c, border:`1px solid ${c}44`, borderRadius:4, cursor:'pointer', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' });
const btnSm= (c) => ({ ...btn(c), padding:'2px 8px' });
const tab  = (a) => ({ padding:'3px 12px', borderRadius:3, border:`1px solid ${a?'rgba(238,97,0,0.4)':'rgba(74,101,128,0.3)'}`, background:a?'rgba(238,97,0,0.08)':'transparent', color:a?'#EE6100':'#6A8A82', cursor:'pointer', fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' });
const tbl  = { width:'100%', borderCollapse:'collapse', background:'linear-gradient(160deg,#0F2620,#0F2620)', borderRadius:8, overflow:'hidden' };
const th   = { padding:'0.6rem 0.8rem', textAlign:'left', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#EE6100' };
const td   = { padding:'0.6rem 0.8rem', fontSize:13, color:'#a8c0d8' };
const overlay = { position:'fixed', inset:0, background:'rgba(2,4,8,0.88)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 };
const box  = { background:'linear-gradient(160deg,#0F2620,#0F2620)', border:'1px solid rgba(238,97,0,0.25)', borderRadius:8, padding:'1.5rem', width:'100%', maxWidth:580, maxHeight:'90vh', overflowY:'auto' };
const inp  = { width:'100%', padding:'0.5rem 0.7rem', background:'rgba(6,13,20,0.8)', border:'1px solid rgba(238,97,0,0.15)', borderRadius:4, color:'#F4F1EA', fontSize:13, outline:'none', boxSizing:'border-box' };
const lbl  = { display:'block', marginBottom:4, fontSize:10, color:'#EE6100', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' };
