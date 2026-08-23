import useSocket from '../../../hooks/useSocket';
// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = { LOW:'#A9C4BE', MEDIUM:'#ffd700', HIGH:'#ff8800', CRITICAL:'#ff3366' };
const STATUS_COLORS   = {
  OPEN:'#EE6100', IN_PROGRESS:'#a78bfa', AWAITING_CLIENT:'#ffd700',
  ESCALATED:'#ff3366', RESOLVED:'#00ff88', CLOSED:'#4a6a8a', REOPENED:'#ff8800'
};

const Tag = ({ label, map }) => {
  const color = (map || {})[label] || '#A9C4BE';
  return <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
    background:`${color}22`, color, border:`1px solid ${color}44` }}>{label}</span>;
};

export default function TicketsPage({ color = '#EE6100' }) {
  const [tickets, setTickets]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [detail, setDetail]     = useState(null);
  const [reply, setReply]       = useState('');
  const [staffList, setStaffList] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [workflowStages, setWorkflowStages] = useState(['Diagnostics', 'Parts Ordered', 'In Repair', 'QA', 'Ready']);
  const [selectedStage, setSelectedStage] = useState('');

  // Real-time: update ticket thread when a reply arrives
  const { emit } = useSocket({
    'ticket:reply': (entry) => {
      if (detail) {
        setDetail((prev) => prev
          ? { ...prev, thread: [...(prev.thread || []), entry] }
          : prev);
      }
      // Also refresh the list badge counts
      load();
    },
    'ticket:status-update': (updatedTicket) => {
      // Merge partial updates into existing ticket data to avoid losing fields
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket._id === updatedTicket._id ? { ...ticket, ...updatedTicket } : ticket
        )
      );
      
      // If we're viewing the updated ticket, merge into detail view
      if (detail && detail._id === updatedTicket._id) {
        setDetail(prev => prev ? { ...prev, ...updatedTicket } : prev);
      }
    }
  });

  // Join/leave ticket room when detail panel opens/closes
  useEffect(() => {
    if (detail?._id) emit('ticket:join', detail._id);
    return () => { if (detail?._id) emit('ticket:leave', detail._id); };
  // detail._id controls when to join/leave ticket room
  }, [detail?._id]);

  // Fetch staff list when detail panel opens (for assignment dropdown)
  useEffect(() => {
    if (!detail) return;
    const fetchStaff = async () => {
      try {
        const { data } = await api.get('/staff-invitation/directory');
        setStaffList(data.staff || []);
      } catch { /* staff list unavailable — assignment disabled */ }
    };
    fetchStaff();
  }, [detail]);

  // Reset selected assignee when detail changes
  useEffect(() => {
    setSelectedAssignee(detail?.assignedTo?._id || '');
  }, [detail?._id, detail?.assignedTo?._id]);

  const assignTicket = async (ticketId, staffId) => {
    if (!staffId) return;
    try {
      await api.patch(`/tickets/${ticketId}/assign`, { staffId });
      toast.success('Ticket reassigned');
      const { data: refreshed } = await api.get(`/tickets/${ticketId}`);
      emit('ticket:status-update', refreshed);
      setTickets(prev => prev.map(t => t._id === ticketId ? refreshed : t));
      setDetail(refreshed);
      setSelectedAssignee(staffId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reassign ticket');
    }
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status   = statusFilter;
      if (priority)     params.priority = priority;
      const { data } = await api.get('/tickets', { params });
      setTickets(data.tickets || data);
      setTotal(data.total || (data.tickets || data).length);
    } catch { toast.error('Failed to load tickets'); }
    finally { setLoading(false); }
  }, [statusFilter, priority]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try { 
      await api.patch(`/tickets/${id}/status`, { status }); 
      toast.success(`Status → ${status}`);
      // Refresh full ticket data so list doesn't get corrupted with partial data
      const { data: refreshed } = await api.get(`/tickets/${id}`);
      // Emit socket event to notify other users
      emit('ticket:status-update', refreshed);
      // Update the ticket in the list with full data
      setTickets(prev => prev.map(t => t._id === id ? refreshed : t));
      setDetail(null); 
    }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const escalate = async (id) => {
    try { 
      await api.post(`/tickets/${id}/escalate`); 
      toast.success('Escalated to Super Admin'); 
      // Fetch full ticket to avoid partial data corruption
      const { data: refreshed } = await api.get(`/tickets/${id}`);
      emit('ticket:status-update', refreshed);
      setTickets(prev => prev.map(t => t._id === id ? refreshed : t));
      setDetail(null); 
    }
    catch { toast.error('Failed to escalate'); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !detail) return;
    try {
      await api.post(`/tickets/${detail._id}/reply`, { message: reply });
      toast.success('Reply sent');
      setReply('');
      const { data } = await api.get(`/tickets/${detail._id}`);
      setDetail(data);
    } catch { toast.error('Failed to send reply'); }
  };

  // Function to send SMS notification to customer
  const sendSMSNotification = async (ticketId, message) => {
    try {
      await api.post(`/tickets/${ticketId}/notify`, { 
        message, 
        channel: 'sms' 
      });
      toast.success('SMS notification sent');
    } catch (err) {
      toast.error('Failed to send SMS notification');
    }
  };

  // Function to send WhatsApp notification to customer
  const sendWhatsAppNotification = async (ticketId, message) => {
    try {
      await api.post(`/tickets/${ticketId}/notify`, { 
        message, 
        channel: 'whatsapp' 
      });
      toast.success('WhatsApp notification sent');
    } catch (err) {
      toast.error('Failed to send WhatsApp notification');
    }
  };

  // Function to advance ticket through workflow stages
  const advanceWorkflow = async (ticketId, newStage) => {
    try {
      // Update ticket status based on workflow stage
      let newStatus = 'IN_PROGRESS';
      switch(newStage) {
        case 'Diagnostics':
          newStatus = 'IN_PROGRESS';
          break;
        case 'Parts Ordered':
          newStatus = 'AWAITING_CLIENT';
          break;
        case 'In Repair':
          newStatus = 'IN_PROGRESS';
          break;
        case 'QA':
          newStatus = 'IN_PROGRESS';
          break;
        case 'Ready':
          newStatus = 'AWAITING_CLIENT';
          break;
        default:
          newStatus = 'IN_PROGRESS';
      }
      
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      toast.success(`Ticket advanced to ${newStage} stage`);
      
      // Fetch full ticket and emit to other users
      const { data: refreshed } = await api.get(`/tickets/${ticketId}`);
      emit('ticket:status-update', refreshed);
      setTickets(prev => prev.map(t => t._id === ticketId ? refreshed : t));
      
      // Send notification to customer
      const message = `Your repair ticket ${detail.ticketId || ticketId.slice(-8)} has been updated to ${newStage} stage.`;
      await sendSMSNotification(ticketId, message);
      await sendWhatsAppNotification(ticketId, message);
      
      load();
      setDetail(null);
    } catch (err) {
      toast.error('Failed to advance workflow');
    }
  };

  const STATUSES = ['','OPEN','IN_PROGRESS','AWAITING_CLIENT','ESCALATED','RESOLVED','CLOSED','REOPENED'];

  const timeSince = (dt) => {
    const m = Math.floor((Date.now() - new Date(dt)) / 60000);
    if (m < 60)   return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m/60)}h ago`;
    return `${Math.floor(m/1440)}d ago`;
  };

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", color:'#c0d8f0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color }}>Help Desk — Support Tickets</h2>
          <p style={{ margin:'4px 0 0', fontSize:12, color:'#4a6a8a' }}>{total} tickets</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:'1rem' }}>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          style={{ padding:'0.45rem 0.75rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:12 }}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)}
          style={{ padding:'0.45rem 0.75rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:12 }}>
          <option value="">All Priorities</option>
          {['LOW','MEDIUM','HIGH','CRITICAL'].map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {loading ? <p style={{ color:'#4a6a8a' }}>Loading…</p> : (
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #0a2040' }}>
              {['Ticket ID','Title','Category','Priority','Status','SLA','Created','Actions'].map(h => (
                <th key={h} style={{ padding:'0.5rem 0.75rem', textAlign:'left', color:'#4a6a8a', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.map((t, i) => (
              <tr key={t._id} style={{ borderBottom:'1px solid #040c1a', background: i%2===0?'transparent':'#050d1a' }}>
                <td style={{ padding:'0.6rem 0.75rem', fontFamily:'monospace', fontSize:10, color:'#EE6100' }}>{t.ticketId}</td>
                <td style={{ padding:'0.6rem 0.75rem', fontWeight:600, color:'#F4F1EA', maxWidth:180 }}>
                  <span style={{ display:'block', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.title}</span>
                  {t.slaBreach && <span style={{ fontSize:9, color:'#ff3366', fontWeight:700 }}>⚠ SLA BREACH</span>}
                </td>
                <td style={{ padding:'0.6rem 0.75rem', color:'#A9C4BE' }}>{t.category}</td>
                <td style={{ padding:'0.6rem 0.75rem' }}><Tag label={t.priority} map={PRIORITY_COLORS} /></td>
                <td style={{ padding:'0.6rem 0.75rem' }}><Tag label={t.status} map={STATUS_COLORS} /></td>
                <td style={{ padding:'0.6rem 0.75rem', fontSize:10, color: t.slaBreach ? '#ff3366':'#4a6a8a' }}>
                  {t.slaDeadline ? new Date(t.slaDeadline).toLocaleDateString('en-KE') : '—'}
                </td>
                <td style={{ padding:'0.6rem 0.75rem', color:'#4a6a8a' }}>{timeSince(t.createdAt)}</td>
                <td style={{ padding:'0.6rem 0.75rem' }}>
                  <div style={{ display:'flex', gap:5 }}>
                    <button onClick={() => setDetail(t)}
                      style={{ padding:'3px 8px', background:`${color}22`, color, border:`1px solid ${color}44`, borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700 }}>VIEW</button>
                    {t.status === 'OPEN' && (
                      <button onClick={() => updateStatus(t._id,'IN_PROGRESS')}
                        style={{ padding:'3px 8px', background:'#a78bfa22', color:'#a78bfa', border:'1px solid #a78bfa44', borderRadius:4, fontSize:10, cursor:'pointer' }}>CLAIM</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr><td colSpan={8} style={{ padding:'2rem', textAlign:'center', color:'#2a4a6a' }}>No tickets found</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* Ticket Detail Panel */}
      {detail && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-start', justifyContent:'flex-end', zIndex:1000 }}>
          <div style={{ background:'#0B1F1B', borderLeft:`1px solid ${color}44`, width:480, height:'100vh', overflowY:'auto', padding:'1.5rem', boxSizing:'border-box' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <div>
                <div style={{ fontSize:10, fontFamily:'monospace', color:'#EE6100' }}>{detail.ticketId}</div>
                <h3 style={{ margin:'4px 0 0', color:'#F4F1EA', fontSize:15 }}>{detail.title}</h3>
              </div>
              <button onClick={() => setDetail(null)}
                style={{ background:'transparent', border:'none', color:'#4a6a8a', fontSize:18, cursor:'pointer' }}>✕</button>
            </div>

            <div style={{ display:'flex', gap:6, marginBottom:'1rem', flexWrap:'wrap' }}>
              <Tag label={detail.priority} map={PRIORITY_COLORS} />
              <Tag label={detail.status} map={STATUS_COLORS} />
              {detail.slaBreach && <Tag label="SLA BREACH" map={{ 'SLA BREACH':'#ff3366' }} />}
            </div>

            {/* Assignee Section */}
            <div style={{ background:'#0F2620', borderRadius:8, padding:'0.75rem', marginBottom:'1rem' }}>
              <div style={{ fontSize:10, color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:6, textTransform:'uppercase' }}>Assigned To</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {detail.assignedTo ? (
                  <span style={{ fontSize:12, color:'#A9C4BE', fontWeight:600 }}>{detail.assignedTo.name || detail.assignedTo.email}</span>
                ) : (
                  <span style={{ fontSize:11, color:'#4a6a8a', fontStyle:'italic' }}>Unassigned</span>
                )}
              </div>
              {staffList.length > 0 && (
                <div style={{ display:'flex', gap:6, marginTop:8 }}>
                  <select
                    value={selectedAssignee}
                    onChange={e => setSelectedAssignee(e.target.value)}
                    style={{ flex:1, padding:'0.4rem 0.5rem', background:'#0a1a16', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:11, outline:'none' }}
                  >
                    <option value="">Select staff member...</option>
                    {staffList.map(s => (
                      <option key={s._id} value={s._id}>{s.name || s.email}{s.role === 'DEPT_HEAD_OWNER' ? ' (Head)' : ''}</option>
                    ))}
                  </select>
                  {selectedAssignee && selectedAssignee !== (detail.assignedTo?._id || '') && (
                    <button
                      onClick={() => assignTicket(detail._id, selectedAssignee)}
                      style={{ padding:'4px 10px', background:'#a78bfa22', color:'#a78bfa', border:'1px solid #a78bfa44', borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700, whiteSpace:'nowrap' }}
                    >
                      ASSIGN
                    </button>
                  )}
                </div>
              )}
            </div>

            <div style={{ background:'#0F2620', borderRadius:8, padding:'0.75rem', fontSize:12, color:'#A9C4BE', marginBottom:'1rem', lineHeight:1.5 }}>
              {detail.description}
            </div>

            {/* Thread */}
            <div style={{ marginBottom:'1rem' }}>
              <div style={{ fontSize:10, color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:8, textTransform:'uppercase' }}>Conversation</div>
              {(detail.thread || []).map((entry, i) => (
                <div key={i} style={{ background:'#0F2620', borderRadius:6, padding:'0.6rem 0.75rem', marginBottom:6,
                  borderLeft:`2px solid ${entry.authorRole === 'CLIENT' ? '#ffd700' : color}` }}>
                  <div style={{ fontSize:10, color:'#4a6a8a', marginBottom:3 }}>{entry.authorRole} · {timeSince(entry.createdAt)}</div>
                  <div style={{ fontSize:12, color:'#c0d8f0', lineHeight:1.5 }}>{entry.message}</div>
                </div>
              ))}
            </div>

            {/* Reply */}
            <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder="Write a reply…"
              style={{ width:'100%', padding:'0.5rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6,
                color:'#F4F1EA', fontSize:12, resize:'none', outline:'none', boxSizing:'border-box', marginBottom:8 }} />
            <button onClick={sendReply}
              style={{ width:'100%', padding:'0.5rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer', marginBottom:'1rem' }}>
              Send Reply
            </button>

            {/* Workflow Stage Selector for Hardware Repair */}
            <div style={{ marginBottom:'1rem' }}>
              <div style={{ fontSize:10, color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:8, textTransform:'uppercase' }}>Hardware Repair Workflow</div>
              <select 
                value={selectedStage} 
                onChange={e => setSelectedStage(e.target.value)}
                style={{ width:'100%', padding:'0.45rem 0.75rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:12, outline:'none' }}
              >
                <option value="">Select stage to advance...</option>
                {workflowStages.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
              {selectedStage && (
                <button 
                  onClick={() => advanceWorkflow(detail._id, selectedStage)}
                  style={{ width:'100%', padding:'0.5rem', background:'#EE6100', color:'#000', border:'none', borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer', marginTop:8 }}>
                  Advance to {selectedStage}
                </button>
              )}
            </div>

            {/* Status Actions */}
            <div style={{ fontSize:10, color:'#4a6a8a', letterSpacing:'0.08em', marginBottom:8, textTransform:'uppercase' }}>Actions</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {['IN_PROGRESS','AWAITING_CLIENT','RESOLVED','CLOSED'].filter(s => s !== detail.status).map(s => (
                <button key={s} onClick={() => updateStatus(detail._id, s)}
                  style={{ padding:'4px 10px', background:`${STATUS_COLORS[s] || '#4a6a8a'}22`, color: STATUS_COLORS[s]||'#A9C4BE',
                    border:`1px solid ${STATUS_COLORS[s]||'#4a6a8a'}44`, borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700 }}>
                  → {s}
                </button>
              ))}
              {!['ESCALATED','CLOSED'].includes(detail.status) && (
                <button onClick={() => escalate(detail._id)}
                  style={{ padding:'4px 10px', background:'#ff336622', color:'#ff3366', border:'1px solid #ff336644', borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700 }}>
                  ESCALATE
                </button>
              )}
              {/* Notification buttons */}
              <button onClick={() => sendSMSNotification(detail._id, `Your ticket #${detail.ticketId} has been updated.`)}
                style={{ padding:'4px 10px', background:'#00ff8822', color:'#00ff88', border:'1px solid #00ff8844', borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700 }}>
                SMS Notify
              </button>
              <button onClick={() => sendWhatsAppNotification(detail._id, `Your ticket #${detail.ticketId} has been updated.`)}
                style={{ padding:'4px 10px', background:'#EE610022', color:'#EE6100', border:'1px solid #EE610044', borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700 }}>
                WhatsApp Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper (duplicate for panel use)
function timeSince(dt) {
  const m = Math.floor((Date.now() - new Date(dt)) / 60000);
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m/60)}h ago`;
  return `${Math.floor(m/1440)}d ago`;
}