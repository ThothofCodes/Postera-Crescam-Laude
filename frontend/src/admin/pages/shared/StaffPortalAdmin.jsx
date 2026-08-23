// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = { ROUTINE:'#A9C4BE', IMPORTANT:'#ffd700', URGENT:'#ff3366' };
const STATUS_COLORS   = { PENDING_LOG:'#4a6a8a', LOG_SUBMITTED:'#ffd700', ASSESSED:'#00ff88', REVIEWED:'#EE6100' };

const Tag = ({ label, map }) => {
  const color = (map||{})[label] || '#A9C4BE';
  return <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
    background:`${color}22`, color, border:`1px solid ${color}44` }}>{label}</span>;
};

const Textarea = ({ label, ...props }) => (
  <label style={{ display:'flex', flexDirection:'column', gap:4, fontSize:11, color:'#A9C4BE' }}>
    {label}
    <textarea {...props} style={{ padding:'0.45rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)',
      borderRadius:5, color:'#F4F1EA', fontSize:13, resize:'vertical', outline:'none', ...props.style }} />
  </label>
);

export default function StaffPortalAdmin({ color = '#EE6100' }) {
  const [tab, setTab]               = useState('memos');
  const [memos, setMemos]           = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showMemoForm, setShowMemoForm] = useState(false);
  const [showAssessForm, setShowAssessForm] = useState(false);
  const [staff, setStaff]           = useState([]);
  const [warrantyTracking, setWarrantyTracking] = useState([]); // For warranty tracking feature
  const [showWarrantyForm, setShowWarrantyForm] = useState(false);
  const [warrantyForm, setWarrantyForm] = useState({
    staffId: '',
    deviceName: '',
    issueDate: '',
    warrantyPeriod: 90, // in days
    warrantyEndDate: '',
    description: ''
  });
  const [memoForm, setMemoForm]     = useState({ title:'', body:'', priority:'ROUTINE', requiresAck:false, recipients:'ALL' });
  const [assessForm, setAssessForm] = useState({ 
    staffId:'', adminFeedback:'', adminComments:'',
    kpiScores:[
      { kpiLabel:'Attendance', score:8, weight:1 },
      { kpiLabel:'Task Completion', score:8, weight:1 },
      { kpiLabel:'Quality of Work', score:8, weight:1 },
      { kpiLabel:'Punctuality', score:8, weight:1 },
      { kpiLabel:'Communication', score:8, weight:1 },
      { kpiLabel:'Problem Solving', score:8, weight:1 }
    ]
  });

  const loadMemos = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/staff-portal/memos');
      setMemos(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load memos'); }
    finally { setLoading(false); }
  }, []);

  const loadAssessments = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().slice(0,10);
      const { data } = await api.get('/staff-portal/assessments', { params: { date: today } });
      setAssessments(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load assessments'); }
    finally { setLoading(false); }
  }, []);

  const loadWarrantyTracking = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/staff-portal/warranty-tracking');
      setWarrantyTracking(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load warranty tracking'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'memos') loadMemos();
    else if (tab === 'assessments') loadAssessments();
    else loadWarrantyTracking();
  }, [tab, loadMemos, loadAssessments, loadWarrantyTracking]);

  useEffect(() => {
    api.get('/users?role=STAFF').then(r => setStaff(r.data?.users || r.data || [])).catch(() => {});
  }, []);

  const sendMemo = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff-portal/memos', memoForm);
      toast.success('Memo published');
      setShowMemoForm(false);
      setMemoForm({ title:'', body:'', priority:'ROUTINE', requiresAck:false, recipients:'ALL' });
      loadMemos();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const archiveMemo = async (id) => {
    try { await api.patch(`/staff-portal/memos/${id}/archive`); toast.success('Archived'); loadMemos(); }
    catch { toast.error('Failed to archive'); }
  };

  const submitAssessment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff-portal/assessments/score', {
        staffId: assessForm.staffId,
        date: new Date().toISOString().slice(0,10),
        kpiScores: assessForm.kpiScores.map(k => ({ ...k, score: Number(k.score), weight: Number(k.weight) })),
        adminFeedback: assessForm.adminFeedback,
        adminComments: assessForm.adminComments,
      });
      toast.success('Assessment saved');
      setShowAssessForm(false);
      loadAssessments();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const submitWarrantyRecord = async (e) => {
    e.preventDefault();
    try {
      // Calculate warranty end date
      const startDate = new Date(warrantyForm.issueDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + parseInt(warrantyForm.warrantyPeriod));
      
      const warrantyData = {
        ...warrantyForm,
        warrantyEndDate: endDate.toISOString().split('T')[0]
      };
      
      await api.post('/staff-portal/warranty-tracking', warrantyData);
      toast.success('Warranty record saved');
      setShowWarrantyForm(false);
      setWarrantyForm({
        staffId: '',
        deviceName: '',
        issueDate: '',
        warrantyPeriod: 90,
        warrantyEndDate: '',
        description: ''
      });
      loadWarrantyTracking();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const TABS = [['memos','📋 Memos'],['assessments','📊 Assessments'], ['warranty','🔧 Warranty Tracking']];

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", color:'#c0d8f0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:700, color }}>Staff Portal Management</h2>
        {tab === 'memos' ? (
          <button onClick={() => setShowMemoForm(true)} style={{ padding:'0.5rem 1.2rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer' }}>+ NEW MEMO</button>
        ) : tab === 'assessments' ? (
          <button onClick={() => setShowAssessForm(true)} style={{ padding:'0.5rem 1.2rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer' }}>+ ASSESS STAFF</button>
        ) : (
          <button onClick={() => setShowWarrantyForm(true)} style={{ padding:'0.5rem 1.2rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer' }}>+ NEW WARRANTY</button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:'1.25rem', borderBottom:'1px solid #0a2040', paddingBottom:8 }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:'0.35rem 0.9rem', borderRadius:4, border:'none', fontSize:11, fontWeight:700, letterSpacing:'0.06em',
              background: tab===key ? `${color}22` : 'transparent',
              color: tab===key ? color : '#4a6a8a', cursor:'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color:'#4a6a8a' }}>Loading…</p> : tab === 'memos' ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {memos.map(memo => (
            <div key={memo._id} style={{ background:'#0F2620', borderRadius:10, padding:'1rem',
              borderLeft:`3px solid ${PRIORITY_COLORS[memo.priority] || '#4a6a8a'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontWeight:700, color:'#F4F1EA', fontSize:14, marginBottom:4 }}>{memo.title}</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <Tag label={memo.priority} map={PRIORITY_COLORS} />
                    <Tag label={memo.status} map={{ DRAFT:'#ffd700', PUBLISHED:'#00ff88', ARCHIVED:'#4a6a8a' }} />
                    {memo.requiresAck && <Tag label="ACK REQUIRED" map={{ 'ACK REQUIRED':'#ff8800' }} />}
                    <span style={{ fontSize:10, color:'#4a6a8a' }}>
                      {(memo.readBy || []).length} read · {new Date(memo.createdAt).toLocaleDateString('en-KE')}
                    </span>
                  </div>
                </div>
                {memo.status !== 'ARCHIVED' && (
                  <button onClick={() => archiveMemo(memo._id)}
                    style={{ padding:'3px 8px', background:'#ff336622', color:'#ff3366', border:'1px solid #ff336644', borderRadius:4, fontSize:10, cursor:'pointer' }}>ARCHIVE</button>
                )}
              </div>
              <p style={{ margin:'0.5rem 0 0', fontSize:12, color:'#A9C4BE', lineHeight:1.5,
                display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                {memo.body}
              </p>
            </div>
          ))}
          {memos.length === 0 && <p style={{ color:'#2a4a6a', textAlign:'center', padding:'2rem' }}>No memos yet</p>}
        </div>
      ) : tab === 'assessments' ? (
        <div>
          <p style={{ fontSize:12, color:'#4a6a8a', marginTop:0 }}>Today's assessments — {new Date().toLocaleDateString('en-KE')}</p>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #0a2040' }}>
                {['Staff','Score','Status','Feedback','Date'].map(h => (
                  <th key={h} style={{ padding:'0.5rem 0.75rem', textAlign:'left', color:'#4a6a8a', fontSize:10, fontWeight:600, textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assessments.map((a, i) => (
                <tr key={a._id} style={{ borderBottom:'1px solid #040c1a', background: i%2===0?'transparent':'#050d1a' }}>
                  <td style={{ padding:'0.6rem 0.75rem', color:'#F4F1EA', fontWeight:600 }}>{a.staffId?.name || a.staffId}</td>
                  <td style={{ padding:'0.6rem 0.75rem', fontWeight:700,
                    color: (a.compositeScore||0) >= 7 ? '#00ff88' : (a.compositeScore||0) >= 4 ? '#ffd700' : '#ff3366' }}>
                    {a.compositeScore?.toFixed(1) || '—'} / 10
                  </td>
                  <td style={{ padding:'0.6rem 0.75rem' }}><Tag label={a.status} map={STATUS_COLORS} /></td>
                  <td style={{ padding:'0.6rem 0.75rem', color:'#A9C4BE', maxWidth:200 }}>
                    <span style={{ display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {a.adminFeedback || '—'}
                    </span>
                  </td>
                  <td style={{ padding:'0.6rem 0.75rem', color:'#4a6a8a' }}>{a.date}</td>
                </tr>
              ))}
              {assessments.length === 0 && (
                <tr><td colSpan={5} style={{ padding:'2rem', textAlign:'center', color:'#2a4a6a' }}>No assessments today yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <p style={{ fontSize:12, color:'#4a6a8a', marginTop:0 }}>Warranty tracking for staff devices and equipment</p>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #0a2040' }}>
                {['Staff','Device','Issue Date','Warranty End','Status','Description'].map(h => (
                  <th key={h} style={{ padding:'0.5rem 0.75rem', textAlign:'left', color:'#4a6a8a', fontSize:10, fontWeight:600, textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {warrantyTracking.map((w, i) => (
                <tr key={w._id} style={{ borderBottom:'1px solid #040c1a', background: i%2===0?'transparent':'#050d1a' }}>
                  <td style={{ padding:'0.6rem 0.75rem', color:'#F4F1EA', fontWeight:600 }}>{w.staffId?.name || w.staffId}</td>
                  <td style={{ padding:'0.6rem 0.75rem', color:'#F4F1EA' }}>{w.deviceName}</td>
                  <td style={{ padding:'0.6rem 0.75rem', color:'#A9C4BE' }}>{w.issueDate}</td>
                  <td style={{ padding:'0.6rem 0.75rem', color: new Date(w.warrantyEndDate) < new Date() ? '#ff3366' : '#00ff88' }}>
                    {w.warrantyEndDate} {new Date(w.warrantyEndDate) < new Date() ? '(EXPIRED)' : ''}
                  </td>
                  <td style={{ padding:'0.6rem 0.75rem' }}>
                    <Tag label={new Date(w.warrantyEndDate) < new Date() ? 'EXPIRED' : 'ACTIVE'} 
                         map={{ 'ACTIVE':'#00ff88', 'EXPIRED':'#ff3366' }} />
                  </td>
                  <td style={{ padding:'0.6rem 0.75rem', color:'#A9C4BE', maxWidth:200 }}>
                    <span style={{ display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {w.description || '—'}
                    </span>
                  </td>
                </tr>
              ))}
              {warrantyTracking.length === 0 && (
                <tr><td colSpan={6} style={{ padding:'2rem', textAlign:'center', color:'#2a4a6a' }}>No warranty records yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Memo Form Modal */}
      {showMemoForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#0B1F1B', border:`1px solid ${color}44`, borderRadius:12, padding:'1.5rem', width:500, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 1rem', color, fontSize:16 }}>New Memo</h3>
            <form onSubmit={sendMemo} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                Title *
                <input value={memoForm.title} onChange={e => setMemoForm(p=>({...p,title:e.target.value}))} required maxLength={120}
                  style={{ padding:'0.45rem 0.7rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13, outline:'none' }} />
              </label>
              <Textarea label="Body *" value={memoForm.body} onChange={e => setMemoForm(p=>({...p,body:e.target.value}))} rows={5} required />
              <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                Priority
                <select value={memoForm.priority} onChange={e => setMemoForm(p=>({...p,priority:e.target.value}))}
                  style={{ padding:'0.45rem 0.7rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13 }}>
                  <option>ROUTINE</option><option>IMPORTANT</option><option>URGENT</option>
                </select>
              </label>
              <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', gap:8, alignItems:'center', cursor:'pointer' }}>
                <input type="checkbox" checked={memoForm.requiresAck} onChange={e => setMemoForm(p=>({...p,requiresAck:e.target.checked}))} />
                Require Acknowledgement
              </label>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" style={{ flex:1, padding:'0.6rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>Publish Memo</button>
                <button type="button" onClick={() => setShowMemoForm(false)}
                  style={{ flex:1, padding:'0.6rem', background:'transparent', color:'#A9C4BE', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, cursor:'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assessment Form Modal */}
      {showAssessForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#0B1F1B', border:`1px solid ${color}44`, borderRadius:12, padding:'1.5rem', width:480, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 1rem', color, fontSize:16 }}>Score Assessment</h3>
            <form onSubmit={submitAssessment} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                Staff Member *
                <select value={assessForm.staffId} onChange={e => setAssessForm(p=>({...p,staffId:e.target.value}))} required
                  style={{ padding:'0.45rem 0.7rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13 }}>
                  <option value="">Select staff…</option>
                  {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </label>

              <div style={{ fontSize:11, color:'#A9C4BE', marginBottom:2 }}>KPI SCORES (1–10)</div>
              {assessForm.kpiScores.map((kpi, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, alignItems:'center' }}>
                  <div style={{ fontSize:12, color:'#c0d8f0' }}>{kpi.kpiLabel}</div>
                  <input type="number" min={1} max={10} value={kpi.score}
                    onChange={e => {
                      const scores = [...assessForm.kpiScores];
                      scores[i] = { ...scores[i], score: e.target.value };
                      setAssessForm(p=>({...p,kpiScores:scores}));
                    }}
                    style={{ width:60, padding:'0.35rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13, textAlign:'center', outline:'none' }} />
                </div>
              ))}

              <Textarea label="Feedback (visible to staff)" value={assessForm.adminFeedback}
                onChange={e => setAssessForm(p=>({...p,adminFeedback:e.target.value}))} rows={3} />
              <Textarea label="Private Comments (admin only)" value={assessForm.adminComments}
                onChange={e => setAssessForm(p=>({...p,adminComments:e.target.value}))} rows={2} />

              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" style={{ flex:1, padding:'0.6rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>Save Assessment</button>
                <button type="button" onClick={() => setShowAssessForm(false)}
                  style={{ flex:1, padding:'0.6rem', background:'transparent', color:'#A9C4BE', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, cursor:'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warranty Tracking Form Modal */}
      {showWarrantyForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#0B1F1B', border:`1px solid ${color}44`, borderRadius:12, padding:'1.5rem', width:480, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 1rem', color, fontSize:16 }}>New Warranty Record</h3>
            <form onSubmit={submitWarrantyRecord} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                Staff Member *
                <select value={warrantyForm.staffId} onChange={e => setWarrantyForm(p=>({...p,staffId:e.target.value}))} required
                  style={{ padding:'0.45rem 0.7rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13 }}>
                  <option value="">Select staff…</option>
                  {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </label>

              <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                Device/Equipment Name *
                <input value={warrantyForm.deviceName} onChange={e => setWarrantyForm(p=>({...p,deviceName:e.target.value}))} required
                  style={{ padding:'0.45rem 0.7rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13, outline:'none' }} />
              </label>

              <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                Issue Date *
                <input type="date" value={warrantyForm.issueDate} onChange={e => setWarrantyForm(p=>({...p,issueDate:e.target.value}))} required
                  style={{ padding:'0.45rem 0.7rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13 }} />
              </label>

              <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                Warranty Period (days) *
                <input type="number" min={1} max={365} value={warrantyForm.warrantyPeriod} 
                  onChange={e => {
                    setWarrantyForm(p=>({...p,warrantyPeriod:e.target.value}));
                    // Update calculated end date
                    if (p.issueDate) {
                      const startDate = new Date(p.issueDate);
                      const endDate = new Date(startDate);
                      endDate.setDate(endDate.getDate() + parseInt(e.target.value));
                      setWarrantyForm(prev => ({
                        ...prev,
                        warrantyEndDate: endDate.toISOString().split('T')[0]
                      }));
                    }
                  }}
                  style={{ padding:'0.45rem 0.7rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13, outline:'none' }} />
              </label>

              {warrantyForm.warrantyEndDate && (
                <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                  Calculated Warranty End Date
                  <div style={{ padding:'0.45rem 0.7rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13 }}>
                    {warrantyForm.warrantyEndDate}
                  </div>
                </label>
              )}

              <Textarea label="Description" value={warrantyForm.description}
                onChange={e => setWarrantyForm(p=>({...p,description:e.target.value}))} rows={3} />

              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" style={{ flex:1, padding:'0.6rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>Save Warranty</button>
                <button type="button" onClick={() => setShowWarrantyForm(false)}
                  style={{ flex:1, padding:'0.6rem', background:'transparent', color:'#A9C4BE', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, cursor:'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}