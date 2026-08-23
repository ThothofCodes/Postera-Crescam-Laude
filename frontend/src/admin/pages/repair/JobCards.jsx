// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../utils/api';
import StatusBadge from '../../../components/StatusBadge';
import { Spinner, EmptyState } from '../../../components/UI';
import { formatKES, formatDate } from '../../../utils/helpers';
import toast from 'react-hot-toast';

const STATUSES = ['received','diagnosing','awaiting-parts','in-repair','completed','collected','cancelled'];
const EMPTY = { clientName:'', clientPhone:'', deviceType:'', deviceBrand:'', faultDescription:'', estimatedCost:'', assignedTechnician:'', warrantyDays:0, notes:'' };

export default function JobCards() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/dept/jobcards', { params: { status, page, limit: 20 } });
      setJobs(data.jobs); setTotal(data.total);
    } catch { setJobs([]); }
    setLoading(false);
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'create') { await api.post('/dept/jobcards', form); toast.success('Job card created'); }
      else { await api.put(`/dept/jobcards/${modal._id}`, form); toast.success('Updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 16, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ff8800' }}>◧ Job Cards ({total})</h2>
        <button onClick={() => { setForm(EMPTY); setModal('create'); }} style={btn('#ff8800')}>+ New Job Card</button>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['', ...STATUSES].map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }} style={tab(status === s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : jobs.length === 0 ? <EmptyState icon="◧" message="No job cards found" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tbl}>
            <thead><tr style={{ background: 'rgba(238,97,0,0.04)', borderBottom: '1px solid rgba(238,97,0,0.15)' }}>
              {['Job #','Client','Device','Fault','Est. Cost','Status','Payment','Date','Actions'].map((h) => <th key={h} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j._id} style={{ borderBottom: '1px solid rgba(26,58,92,0.4)' }}>
                  <td style={td}><span style={{ color: '#ff8800', fontWeight: 700 }}>{j.jobNumber}</span></td>
                  <td style={td}><div style={{ fontWeight: 600, color: '#F4F1EA' }}>{j.clientName}</div><div style={{ fontSize: 11, color: '#6A8A82' }}>{j.clientPhone}</div></td>
                  <td style={td}>{j.deviceType} {j.deviceBrand && `(${j.deviceBrand})`}</td>
                  <td style={td}><span style={{ fontSize: 12, color: '#A9C4BE' }}>{j.faultDescription?.slice(0, 40)}...</span></td>
                  <td style={td}>{j.estimatedCost ? formatKES(j.estimatedCost) : '—'}</td>
                  <td style={td}><StatusBadge status={j.status} /></td>
                  <td style={td}><StatusBadge status={j.paymentStatus} /></td>
                  <td style={td}>{formatDate(j.createdAt)}</td>
                  <td style={td}>
                    <button onClick={() => { setForm({ clientName:j.clientName, clientPhone:j.clientPhone, deviceType:j.deviceType, deviceBrand:j.deviceBrand||'', faultDescription:j.faultDescription, estimatedCost:j.estimatedCost||'', assignedTechnician:j.assignedTechnician||'', warrantyDays:j.warrantyDays||0, notes:j.notes||'', status:j.status }); setModal(j); }} style={btnSm('#EE6100')}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {page > 1 && <button onClick={() => setPage(p => p-1)} style={btn('#6A8A82')}>← Prev</button>}
        {jobs.length === 20 && <button onClick={() => setPage(p => p+1)} style={btn('#6A8A82')}>Next →</button>}
      </div>

      {modal && (
        <div style={overlay}>
          <div style={box}>
            <h3 style={{ margin: '0 0 1rem', color: '#ff8800' }}>{modal === 'create' ? 'New Job Card' : `Edit ${modal.jobNumber}`}</h3>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['clientName','Client Name'],['clientPhone','Phone'],['deviceType','Device Type'],['deviceBrand','Brand']].map(([k,l]) => (
                  <div key={k}><label style={lbl}>{l}</label><input value={form[k]} onChange={(e) => setForm({...form,[k]:e.target.value})} required={['clientName','clientPhone','deviceType'].includes(k)} style={inp} /></div>
                ))}
              </div>
              <div><label style={lbl}>Fault Description</label><textarea value={form.faultDescription} onChange={(e) => setForm({...form,faultDescription:e.target.value})} required rows={3} style={{...inp,resize:'vertical'}} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><label style={lbl}>Estimated Cost (KES)</label><input type="number" value={form.estimatedCost} onChange={(e) => setForm({...form,estimatedCost:e.target.value})} style={inp} /></div>
                <div><label style={lbl}>Warranty Days</label><input type="number" value={form.warrantyDays} onChange={(e) => setForm({...form,warrantyDays:e.target.value})} style={inp} /></div>
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
                <button type="submit" disabled={saving} style={btn('#ff8800')}>{saving ? 'Saving...' : 'Save'}</button>
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
const box  = { background:'linear-gradient(160deg,#0F2620,#0F2620)', border:'1px solid rgba(238,97,0,0.25)', borderRadius:8, padding:'1.5rem', width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto' };
const inp  = { width:'100%', padding:'0.5rem 0.7rem', background:'rgba(6,13,20,0.8)', border:'1px solid rgba(238,97,0,0.15)', borderRadius:4, color:'#F4F1EA', fontSize:13, outline:'none', boxSizing:'border-box' };
const lbl  = { display:'block', marginBottom:4, fontSize:10, color:'#EE6100', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' };
