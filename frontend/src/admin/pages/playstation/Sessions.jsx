// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../utils/api';
import { Spinner } from '../../../components/UI';
import toast from 'react-hot-toast';
import useSocket from '../../../hooks/useSocket';

const STATIONS    = Array.from({ length: 8 }, (_, i) => i + 1);
const HOURLY_RATE = 60;

// SessionTimer uses its OWN setInterval to tick every second.
// Socket events reload the session list on start/end — they do NOT replace the timer.
function SessionTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(
    () => Math.floor((Date.now() - new Date(startTime)) / 1000)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startTime)) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const h    = Math.floor(elapsed / 3600);
  const m    = Math.floor((elapsed % 3600) / 60);
  const s    = elapsed % 60;
  const cost = ((elapsed / 3600) * HOURLY_RATE).toFixed(0);

  return (
    <div>
      <div style={{ fontFamily:'monospace', fontSize:18, color:'#ffd700', fontWeight:800 }}>
        {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
      </div>
      <div style={{ fontSize:11, color:'#00ff88' }}>KES {cost}</div>
    </div>
  );
}

// Phase 9 market research, Tier 1 #2 — counts DOWN against a prepaid block
// instead of counting up. The actual auto-close happens server-side (cron/
// psAutoClose.js runs every minute and emits the existing 'session:update'
// event Sessions.js already listens for) — this component is purely the
// visual countdown; it doesn't call any endpoint itself.
function SessionCountdown({ startTime, plannedDurationMinutes, hourlyRate }) {
  const endsAt = new Date(startTime).getTime() + plannedDurationMinutes * 60000;
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor((endsAt - Date.now()) / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, Math.floor((endsAt - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const cost = ((plannedDurationMinutes / 60) * hourlyRate).toFixed(0);
  const expiring = remaining <= 120 && remaining > 0; // last 2 minutes — warn
  const expired   = remaining === 0;
  const color = expired ? '#ff3366' : expiring ? '#ffaa00' : '#EE6100';

  return (
    <div>
      <div style={{ fontFamily:'monospace', fontSize:18, color, fontWeight:800 }}>
        {expired ? "TIME'S UP" : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
      </div>
      <div style={{ fontSize:11, color: expired ? '#ff3366' : '#00ff88' }}>
        {expired ? 'Closing automatically…' : `KES ${cost} prepaid`}
      </div>
    </div>
  );
}

export default function Sessions() {
  const [sessions,    setSessions]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [startModal,  setStartModal]  = useState(null);
  const [form,        setForm]        = useState({
    clientName:'', clientPhone:'', gameTitle:'',
    sessionType:'walk-in', stationNumber:1, hourlyRate:HOURLY_RATE,
    plannedDurationMinutes:'', // empty = open-ended walk-in, unchanged behavior
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/dept/sessions', { params:{ status:'active', limit:50 } });
      setSessions(data.sessions || data || []);
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  }, []);

  // Real-time: reload session list when a session starts or ends
  useSocket({ 'session:update': load });

  useEffect(() => { load(); }, [load]);

  const activeOnStation = (n) =>
    sessions.find((s) => s.stationNumber === n && s.status === 'active');

  const startSession = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/dept/sessions/start', {
        ...form,
        stationNumber: startModal,
        plannedDurationMinutes: form.plannedDurationMinutes ? Number(form.plannedDurationMinutes) : null,
      });
      toast.success(`Station ${startModal} session started`);
      setStartModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error starting session');
    } finally { setSaving(false); }
  };

  const endSession = async (id, stationNum) => {
    if (!window.confirm(`End session on Station ${stationNum}?`)) return;
    try {
      await api.put(`/dept/sessions/${id}/end`);
      toast.success('Session ended');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error ending session');
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      <h2 style={{ margin:0, fontSize:16, letterSpacing:'0.08em', textTransform:'uppercase', color:'#ffd700' }}>
        ◷ Station Map
      </h2>

      {loading ? <Spinner /> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem' }}>
          {STATIONS.map((n) => {
            const active = activeOnStation(n);
            return (
              <div key={n} style={{
                background: active
                  ? 'linear-gradient(160deg,#1a2a10,#0d1f05)'
                  : 'linear-gradient(160deg,#0F2620,#0F2620)',
                border:`1px solid ${active ? 'rgba(0,255,136,0.4)' : 'rgba(238,97,0,0.12)'}`,
                borderRadius:10, padding:'1rem', position:'relative', overflow:'hidden',
              }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
                  background: active ? '#00ff88' : 'rgba(238,97,0,0.2)' }} />

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em',
                    textTransform:'uppercase', color: active ? '#00ff88' : '#6A8A82' }}>
                    Station {n}
                  </span>
                  <span style={{ fontSize:10, padding:'2px 8px', borderRadius:3,
                    background: active ? 'rgba(0,255,136,0.12)' : 'rgba(74,101,128,0.12)',
                    color: active ? '#00ff88' : '#6A8A82',
                    border:`1px solid ${active ? 'rgba(0,255,136,0.3)' : 'rgba(74,101,128,0.3)'}`,
                    fontWeight:700, textTransform:'uppercase' }}>
                    {active ? 'Active' : 'Free'}
                  </span>
                </div>

                {active ? (
                  <>
                    <div style={{ fontSize:13, color:'#F4F1EA', fontWeight:600, marginBottom:4 }}>
                      {active.clientName || 'Walk-in'}
                    </div>
                    <div style={{ fontSize:11, color:'#6A8A82', marginBottom:8 }}>
                      {active.gameTitle || 'No game selected'}
                    </div>
                    {active.plannedDurationMinutes ? (
                      <SessionCountdown startTime={active.startTime}
                        plannedDurationMinutes={active.plannedDurationMinutes}
                        hourlyRate={active.hourlyRate || HOURLY_RATE} />
                    ) : (
                      <SessionTimer startTime={active.startTime} />
                    )}
                    <button onClick={() => endSession(active._id, n)}
                      style={{ marginTop:10, width:'100%', padding:'0.4rem',
                        background:'rgba(255,51,102,0.12)', color:'#ff3366',
                        border:'1px solid rgba(255,51,102,0.3)', borderRadius:4,
                        cursor:'pointer', fontSize:11, fontWeight:700,
                        letterSpacing:'0.08em', textTransform:'uppercase' }}>
                      End Session
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setForm({ clientName:'', clientPhone:'', gameTitle:'',
                        sessionType:'walk-in', stationNumber:n, hourlyRate:HOURLY_RATE,
                        plannedDurationMinutes:'' });
                      setStartModal(n);
                    }}
                    style={{ marginTop:8, width:'100%', padding:'0.5rem',
                      background:'rgba(255,215,0,0.08)', color:'#ffd700',
                      border:'1px solid rgba(255,215,0,0.3)', borderRadius:4,
                      cursor:'pointer', fontSize:11, fontWeight:700,
                      letterSpacing:'0.08em', textTransform:'uppercase' }}>
                    ▶ Start Session
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {startModal && (
        <div style={overlay}>
          <div style={box}>
            <h3 style={{ margin:'0 0 1rem', color:'#ffd700' }}>
              Start Session — Station {startModal}
            </h3>
            <form onSubmit={startSession} style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[['clientName','Client Name (optional)'],['clientPhone','Phone (optional)'],['gameTitle','Game Title']].map(([k,l]) => (
                <div key={k}>
                  <label style={lbl}>{l}</label>
                  <input value={form[k]} onChange={(e) => setForm({ ...form, [k]:e.target.value })} style={inp} />
                </div>
              ))}
              <div>
                <label style={lbl}>Session Type</label>
                <select value={form.sessionType} onChange={(e) => setForm({ ...form, sessionType:e.target.value })} style={inp}>
                  {['walk-in','booking','tournament'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Hourly Rate (KES)</label>
                <input type="number" value={form.hourlyRate}
                  onChange={(e) => setForm({ ...form, hourlyRate:Number(e.target.value) })} style={inp} />
              </div>
              <div>
                <label style={lbl}>Prepaid Duration — minutes (leave blank for open-ended walk-in)</label>
                <input type="number" min="1" placeholder="e.g. 60 for a 1-hour block"
                  value={form.plannedDurationMinutes}
                  onChange={(e) => setForm({ ...form, plannedDurationMinutes:e.target.value })} style={inp} />
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setStartModal(null)} style={btn('#6A8A82')}>Cancel</button>
                <button type="submit" disabled={saving} style={btn('#ffd700')}>
                  {saving ? 'Starting…' : '▶ Start'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const btn     = (c) => ({ padding:'0.45rem 1rem', background:`${c}18`, color:c, border:`1px solid ${c}44`, borderRadius:4, cursor:'pointer', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' });
const overlay = { position:'fixed', inset:0, background:'rgba(2,4,8,0.88)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 };
const box     = { background:'linear-gradient(160deg,#0F2620,#0F2620)', border:'1px solid rgba(238,97,0,0.25)', borderRadius:8, padding:'1.5rem', width:'100%', maxWidth:440 };
const inp     = { width:'100%', padding:'0.5rem 0.7rem', background:'rgba(6,13,20,0.8)', border:'1px solid rgba(238,97,0,0.15)', borderRadius:4, color:'#F4F1EA', fontSize:13, outline:'none', boxSizing:'border-box' };
const lbl     = { display:'block', marginBottom:4, fontSize:10, color:'#EE6100', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' };
