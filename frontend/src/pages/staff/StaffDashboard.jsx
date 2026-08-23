// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = { ROUTINE:'#A9C4BE', IMPORTANT:'#ffd700', URGENT:'#ff3366' };

const Tag = ({ label, color }) => (
  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
    background:`${color||'#4a6a8a'}22`, color:color||'#A9C4BE', border:`1px solid ${color||'#4a6a8a'}44` }}>{label}</span>
);

const Card = ({ title, children, accent = '#EE6100' }) => (
  <div style={{ background:'#0B1F1B', borderRadius:10, border:`1px solid ${accent}22`, overflow:'hidden' }}>
    <div style={{ padding:'0.75rem 1rem', borderBottom:`1px solid ${accent}22`, fontSize:11,
      fontWeight:700, color:accent, letterSpacing:'0.1em', textTransform:'uppercase' }}>{title}</div>
    <div style={{ padding:'1rem' }}>{children}</div>
  </div>
);

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [memos, setMemos]             = useState([]);
  const [assessment, setAssessment]   = useState(null);
  const [tab, setTab]                 = useState('home');
  const [workLog, setWorkLog]         = useState({ tasks:'', blockers:'', hoursWorked:'', notes:'' });
  const [submitting, setSubmitting]   = useState(false);
  const [notifications, setNotifs]    = useState([]);

  const color = '#EE6100';

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [memosRes, assessRes, notifsRes] = await Promise.allSettled([
        api.get('/staff-portal/memos'),
        api.get('/staff-portal/assessments/today'),
        api.get('/admin/notifications'),
      ]);
      if (memosRes.status === 'fulfilled') setMemos(Array.isArray(memosRes.value.data) ? memosRes.value.data : []);
      if (assessRes.status === 'fulfilled') setAssessment(assessRes.value.data);
      if (notifsRes.status === 'fulfilled') setNotifs(notifsRes.value.data?.notifications || notifsRes.value.data || []);
    } catch {}
  };

  const acknowledge = async (memoId) => {
    try {
      await api.patch(`/staff-portal/memos/${memoId}/ack`);
      toast.success('Memo acknowledged');
      loadData();
    } catch { toast.error('Failed to acknowledge'); }
  };

  const submitLog = async (e) => {
    e.preventDefault();
    if (!workLog.tasks.trim()) { toast.error('Tasks completed is required'); return; }
    try {
      setSubmitting(true);
      await api.post('/staff-portal/assessments/worklog', {
        tasks: workLog.tasks,
        blockers: workLog.blockers,
        hoursWorked: Number(workLog.hoursWorked) || 0,
        notes: workLog.notes,
      });
      toast.success('Work log submitted!');
      setWorkLog({ tasks:'', blockers:'', hoursWorked:'', notes:'' });
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const unreadMemos  = memos.filter(m => !(m.readBy || []).some(r => r.userId === user?._id));
  const unreadNotifs = notifications.filter(n => !n.read).length;

  const TABS = [
    ['home', '◈ Home'],
    ['memos', `◉ Memos ${unreadMemos.length > 0 ? `(${unreadMemos.length})` : ''}`],
    ['worklog', '◆ Work Log'],
    ['notifications', `🔔 ${unreadNotifs > 0 ? unreadNotifs : ''} Alerts`],
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#081916', fontFamily:"'Inter',sans-serif", color:'#c0d8f0' }}>
      {/* Topbar */}
      <header style={{ height:52, background:'linear-gradient(90deg,#0B1F1B,#0F2620)',
        borderBottom:`1px solid ${color}22`, display:'flex', alignItems:'center',
        justifyContent:'space-between', padding:'0 1.5rem' }}>
        <div style={{ fontSize:13, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color }}>
          Postera — Staff Portal
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:11, color:'#4a6a8a' }}>{user?.name} · {user?.departmentSlug?.toUpperCase()}</span>
          <button onClick={logout}
            style={{ padding:'4px 12px', background:'#ff336618', color:'#ff3366', border:'1px solid #ff336644',
              borderRadius:4, fontSize:10, fontWeight:700, cursor:'pointer', letterSpacing:'0.08em' }}>LOGOUT</button>
        </div>
      </header>

      {/* Tab bar */}
      <div style={{ background:'#0B1F1B', borderBottom:'1px solid #0a2040', display:'flex', gap:2, padding:'0 1rem' }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:'0.6rem 1rem', border:'none', background:'transparent', fontSize:11, fontWeight:700,
              color: tab===key ? color : '#4a6a8a', borderBottom: tab===key ? `2px solid ${color}` : '2px solid transparent',
              cursor:'pointer', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      <main style={{ maxWidth:900, margin:'0 auto', padding:'1.5rem' }}>

        {/* HOME */}
        {tab === 'home' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            {/* Today's Assessment */}
            <Card title="Today's Assessment" accent={color}>
              {assessment && assessment.status !== 'PENDING_LOG' ? (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:12, color:'#A9C4BE' }}>Status</span>
                    <span style={{ fontSize:12, fontWeight:700,
                      color: assessment.status === 'ASSESSED' ? '#00ff88' : '#ffd700' }}>
                      {assessment.status.replace('_',' ')}
                    </span>
                  </div>
                  {assessment.compositeScore > 0 && (
                    <div style={{ textAlign:'center', padding:'1rem' }}>
                      <div style={{ fontSize:36, fontWeight:700, color:
                        assessment.compositeScore >= 8 ? '#00ff88' : assessment.compositeScore >= 6 ? '#ffd700' : '#ff3366' }}>
                        {assessment.compositeScore?.toFixed(1)}
                      </div>
                      <div style={{ fontSize:11, color:'#4a6a8a' }}>out of 10</div>
                    </div>
                  )}
                  {assessment.adminFeedback && (
                    <div style={{ background:'#0F2620', borderRadius:6, padding:'0.75rem', fontSize:12, color:'#c0d8f0',
                      borderLeft:`3px solid ${color}`, lineHeight:1.5 }}>
                      {assessment.adminFeedback}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'1rem' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
                  <p style={{ fontSize:12, color:'#4a6a8a', margin:0 }}>No assessment yet today</p>
                  <button onClick={() => setTab('worklog')}
                    style={{ marginTop:12, padding:'0.4rem 1rem', background:`${color}22`, color, border:`1px solid ${color}44`,
                      borderRadius:4, fontSize:11, cursor:'pointer', fontWeight:700 }}>Submit Work Log →</button>
                </div>
              )}
            </Card>

            {/* Recent Memos */}
            <Card title={`Memos ${unreadMemos.length > 0 ? `· ${unreadMemos.length} unread` : ''}`} accent="#ffd700">
              {memos.slice(0,3).map(memo => (
                <div key={memo._id} style={{ padding:'0.5rem 0', borderBottom:'1px solid #0a2040', cursor:'pointer' }}
                  onClick={() => setTab('memos')}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, fontWeight:600, color:'#F4F1EA' }}>{memo.title}</span>
                    <Tag label={memo.priority} color={PRIORITY_COLORS[memo.priority]} />
                  </div>
                  <span style={{ fontSize:10, color:'#4a6a8a' }}>{new Date(memo.createdAt).toLocaleDateString('en-KE')}</span>
                </div>
              ))}
              {memos.length === 0 && <p style={{ fontSize:12, color:'#4a6a8a', margin:0 }}>No memos yet</p>}
            </Card>

            {/* Quick Stats */}
            <Card title="Quick Info" accent="#a78bfa">
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  ['Department', user?.departmentSlug?.toUpperCase() || '—'],
                  ['Role', user?.role || '—'],
                  ['Work Log Today', assessment?.workLog?.tasks ? '✓ Submitted' : '✗ Pending'],
                  ['Unread Memos', unreadMemos.length],
                ].map(([label, value]) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                    <span style={{ color:'#A9C4BE' }}>{label}</span>
                    <span style={{ fontWeight:600, color:'#F4F1EA' }}>{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* MEMOS */}
        {tab === 'memos' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {memos.map(memo => {
              const acked = (memo.readBy || []).some(r => r.userId === user?._id);
              const pColor = PRIORITY_COLORS[memo.priority];
              return (
                <div key={memo._id} style={{ background:'#0B1F1B', borderRadius:10, padding:'1rem',
                  borderLeft:`3px solid ${pColor}`, opacity: acked ? 0.75 : 1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div>
                      <div style={{ fontWeight:700, color:'#F4F1EA', fontSize:14 }}>{memo.title}</div>
                      <div style={{ display:'flex', gap:6, marginTop:4 }}>
                        <Tag label={memo.priority} color={pColor} />
                        {acked && <Tag label="✓ READ" color="#00ff88" />}
                        <span style={{ fontSize:10, color:'#4a6a8a' }}>{new Date(memo.createdAt).toLocaleDateString('en-KE')}</span>
                      </div>
                    </div>
                    {!acked && memo.requiresAck && (
                      <button onClick={() => acknowledge(memo._id)}
                        style={{ padding:'4px 12px', background:`${color}22`, color, border:`1px solid ${color}44`,
                          borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700, flexShrink:0 }}>
                        ACKNOWLEDGE
                      </button>
                    )}
                  </div>
                  <p style={{ margin:0, fontSize:12, color:'#A9C4BE', lineHeight:1.6 }}>{memo.body}</p>
                </div>
              );
            })}
            {memos.length === 0 && (
              <div style={{ textAlign:'center', padding:'3rem', color:'#2a4a6a' }}>No memos yet</div>
            )}
          </div>
        )}

        {/* WORK LOG */}
        {tab === 'worklog' && (
          <div style={{ maxWidth:600 }}>
            <h3 style={{ color, fontSize:16, margin:'0 0 1rem' }}>
              Work Log — {new Date().toLocaleDateString('en-KE', { weekday:'long', day:'numeric', month:'long' })}
            </h3>
            {assessment?.workLog?.tasks ? (
              <div style={{ background:'#0F2620', borderRadius:10, padding:'1rem', borderLeft:`3px solid #00ff88` }}>
                <p style={{ margin:'0 0 0.5rem', fontSize:12, color:'#00ff88', fontWeight:700 }}>✓ Work log submitted today</p>
                <p style={{ margin:0, fontSize:12, color:'#A9C4BE' }}>
                  <strong style={{ color:'#F4F1EA' }}>Tasks:</strong> {assessment.workLog.tasks}
                </p>
              </div>
            ) : (
              <form onSubmit={submitLog} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {[
                  { label:'Tasks Completed Today *', key:'tasks', rows:4, required:true, placeholder:'List all tasks you completed today…' },
                  { label:'Blockers / Challenges', key:'blockers', rows:3, placeholder:'Any obstacles you faced?' },
                  { label:'Notes to Manager', key:'notes', rows:2, placeholder:'Anything your manager should know?' },
                ].map(({ label, key, rows, required, placeholder }) => (
                  <label key={key} style={{ display:'flex', flexDirection:'column', gap:4, fontSize:11, color:'#A9C4BE', letterSpacing:'0.06em' }}>
                    {label}
                    <textarea value={workLog[key]} onChange={e => setWorkLog(p=>({...p,[key]:e.target.value}))}
                      rows={rows} required={required} placeholder={placeholder}
                      style={{ padding:'0.5rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6,
                        color:'#F4F1EA', fontSize:13, resize:'vertical', outline:'none' }} />
                  </label>
                ))}
                <label style={{ display:'flex', flexDirection:'column', gap:4, fontSize:11, color:'#A9C4BE' }}>
                  Hours Worked
                  <input type="number" min={0} max={24} step={0.5} value={workLog.hoursWorked}
                    onChange={e => setWorkLog(p=>({...p,hoursWorked:e.target.value}))}
                    style={{ width:100, padding:'0.45rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13, outline:'none' }} />
                </label>
                <button type="submit" disabled={submitting}
                  style={{ padding:'0.65rem', background: submitting ? 'rgba(36,74,68,0.4)' : color, color:'#000', border:'none',
                    borderRadius:6, fontWeight:700, fontSize:14, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Submitting…' : 'Submit Work Log'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab === 'notifications' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {notifications.map(n => (
              <div key={n._id} style={{ background: n.read ? '#0B1F1B' : '#0F2620', borderRadius:8, padding:'0.75rem 1rem',
                borderLeft:`3px solid ${n.read ? 'rgba(36,74,68,0.4)' : color}` }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, fontWeight: n.read ? 400 : 700, color: n.read ? '#A9C4BE' : '#F4F1EA' }}>{n.message || n.title}</span>
                  <span style={{ fontSize:10, color:'#4a6a8a' }}>{new Date(n.createdAt).toLocaleDateString('en-KE')}</span>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div style={{ textAlign:'center', padding:'3rem', color:'#2a4a6a' }}>No notifications</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
