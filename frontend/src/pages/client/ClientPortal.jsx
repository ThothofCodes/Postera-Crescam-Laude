// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

// Dedicated axios instance — uses clientPortalToken, NEVER touches the
// shared admin 'token' key so client and admin sessions stay isolated.
const CLIENT_TOKEN_KEY = 'clientPortalToken';

const buildClientApi = (token) => {
  const inst = axios.create({ baseURL: '/api', timeout: 30000,
    headers: { 'Content-Type': 'application/json' } });
  inst.interceptors.request.use((cfg) => {
    const t = token || localStorage.getItem(CLIENT_TOKEN_KEY);
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
  });
  inst.interceptors.response.use(
    (r) => r,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem(CLIENT_TOKEN_KEY);
        localStorage.removeItem('clientData');
        window.location.reload();
      }
      return Promise.reject(err);
    }
  );
  return inst;
};

// Public axios (no auth) for OTP endpoints
const publicApi = axios.create({ baseURL: '/api', timeout: 30000,
  headers: { 'Content-Type': 'application/json' } });

const STATUS_COLORS = {
  DRAFT:'#A9C4BE', SENT:'#EE6100', PAYMENT_SENT:'#ffd700',
  PAID:'#00ff88', PARTIAL:'#ff8800', OVERDUE:'#ff3366', CANCELLED:'#4a6a8a',
  OPEN:'#EE6100', IN_PROGRESS:'#a78bfa', AWAITING_CLIENT:'#ffd700',
  ESCALATED:'#ff3366', RESOLVED:'#00ff88', CLOSED:'#4a6a8a',
};

const Tag = ({ label }) => {
  const color = STATUS_COLORS[label] || '#A9C4BE';
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
      background:`${color}22`, color, border:`1px solid ${color}44` }}>{label}</span>
  );
};

const Card = ({ title, children, accent='#EE6100' }) => (
  <div style={{ background:'#0B1F1B', borderRadius:10, border:`1px solid ${accent}22`, overflow:'hidden', marginBottom:'1rem' }}>
    <div style={{ padding:'0.6rem 1rem', borderBottom:`1px solid ${accent}22`,
      fontSize:11, fontWeight:700, color:accent, letterSpacing:'0.1em', textTransform:'uppercase' }}>{title}</div>
    <div style={{ padding:'1rem' }}>{children}</div>
  </div>
);

const DEPT_COLORS = {
  internet:'#2BB6A3', webdev:'#a78bfa', playstation:'#ffd700',
  repair:'#ff8800', cybersecurity:'#ff3366', govadmin:'#00ff88',
};

// ── OTP Login ─────────────────────────────────────────────
function ClientLogin({ slug, onLogin }) {
  const color = DEPT_COLORS[slug] || '#EE6100';
  const [phone, setPhone]   = useState('');
  const [otp, setOtp]       = useState('');
  const [step, setStep]     = useState('phone');
  const [loading, setLoading] = useState(false);

  const requestOTP = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await publicApi.post('/crm/request-otp', { phone });
      toast.success('OTP sent via SMS');
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data } = await publicApi.post('/crm/verify-otp', { phone, otp });
      // Store under separate key — never overwrites admin token
      localStorage.setItem(CLIENT_TOKEN_KEY, data.token);
      localStorage.setItem('clientData', JSON.stringify(data.client));
      onLogin(data.client, data.token);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#081916', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:"'Inter',sans-serif" }}>
      <div style={{ width:380, background:'#0B1F1B', border:`1px solid ${color}33`, borderRadius:14, padding:'2rem' }}>
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ fontSize:28, fontWeight:800, color, letterSpacing:'0.05em' }}>PCL</div>
          <div style={{ fontSize:11, color:'#4a6a8a', letterSpacing:'0.15em', textTransform:'uppercase', marginTop:4 }}>
            Client Portal — {slug.toUpperCase()}
          </div>
        </div>

        {step === 'phone' ? (
          <form onSubmit={requestOTP} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:6 }}>
              Your Phone Number
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="254712345678" required
                style={{ padding:'0.6rem 0.75rem', background:'#0F2620', border:`1px solid ${color}44`,
                  borderRadius:6, color:'#F4F1EA', fontSize:15, outline:'none', textAlign:'center',
                  letterSpacing:'0.05em' }} />
            </label>
            <p style={{ fontSize:11, color:'#4a6a8a', textAlign:'center', margin:0 }}>
              Enter your registered phone number. We'll send a one-time code.
            </p>
            <button type="submit" disabled={loading}
              style={{ padding:'0.7rem', background: loading ? 'rgba(36,74,68,0.4)' : color, color:'#000',
                border:'none', borderRadius:6, fontWeight:700, fontSize:14,
                cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Sending…' : 'Send OTP →'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOTP} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ textAlign:'center', fontSize:12, color:'#A9C4BE' }}>
              OTP sent to <strong style={{ color:'#F4F1EA' }}>{phone}</strong>
            </div>
            <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:6 }}>
              Enter 6-Digit OTP
              <input value={otp} onChange={e => setOtp(e.target.value)}
                placeholder="123456" required maxLength={6}
                style={{ padding:'0.75rem', background:'#0F2620', border:`1px solid ${color}44`,
                  borderRadius:6, color:'#F4F1EA', fontSize:22, outline:'none',
                  textAlign:'center', letterSpacing:'0.3em', fontWeight:700 }} />
            </label>
            <button type="submit" disabled={loading}
              style={{ padding:'0.7rem', background: loading ? 'rgba(36,74,68,0.4)' : color, color:'#000',
                border:'none', borderRadius:6, fontWeight:700, fontSize:14,
                cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Verifying…' : 'Verify & Enter Portal'}
            </button>
            <button type="button" onClick={() => setStep('phone')}
              style={{ padding:'0.5rem', background:'transparent', color:'#4a6a8a',
                border:'none', fontSize:11, cursor:'pointer' }}>
              ← Use a different number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Client Portal Dashboard ────────────────────────────────
function ClientPortal({ slug, client, token, onLogout }) {
  const color    = DEPT_COLORS[slug] || '#EE6100';
  const clientApi = buildClientApi(token);

  const [tab, setTab]         = useState('home');
  const [invoices, setInvoices] = useState([]);
  const [tickets, setTickets]   = useState([]);
  const [newTicket, setNewTicket] = useState({ title:'', description:'', category:'General', priority:'MEDIUM' });
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadInvoices(); loadTickets(); }, []);

  const loadInvoices = async () => {
    try {
      const { data } = await clientApi.get('/billing/my');
      setInvoices(Array.isArray(data) ? data : data.invoices || []);
    } catch {}
  };

  const loadTickets = async () => {
    try {
      const { data } = await clientApi.get('/tickets/my');
      setTickets(Array.isArray(data) ? data : data.tickets || []);
    } catch {}
  };

  const requestPayment = async (invoiceId) => {
    try {
      await clientApi.post(`/billing/${invoiceId}/pay`);
      toast.success('Payment request sent to your phone');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate payment');
    }
  };

  const submitTicket = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await clientApi.post('/tickets', newTicket);
      toast.success('Support ticket raised');
      setShowTicketForm(false);
      setNewTicket({ title:'', description:'', category:'General', priority:'MEDIUM' });
      loadTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to raise ticket');
    } finally { setLoading(false); }
  };

  const TABS = [['home','◈ Home'],['invoices','◆ Invoices'],['tickets','◉ Support'],['profile','◫ Profile']];

  const outstandingBalance = invoices
    .filter(i => !['PAID','CANCELLED'].includes(i.status))
    .reduce((s, i) => s + (i.balance || 0), 0);
  const openTickets = tickets.filter(t => !['CLOSED','RESOLVED'].includes(t.status)).length;

  return (
    <div style={{ minHeight:'100vh', background:'#081916', fontFamily:"'Inter',sans-serif", color:'#c0d8f0' }}>
      {/* Topbar */}
      <header style={{ height:52, background:'linear-gradient(90deg,#0B1F1B,#0F2620)',
        borderBottom:`1px solid ${color}22`, display:'flex', alignItems:'center',
        justifyContent:'space-between', padding:'0 1.5rem' }}>
        <div style={{ fontSize:13, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color }}>
          Postera — {slug.toUpperCase()} Portal
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:11, color:'#4a6a8a' }}>{client?.fullName || 'Client'}</span>
          <button onClick={onLogout}
            style={{ padding:'3px 10px', background:'#ff336618', color:'#ff3366',
              border:'1px solid #ff336644', borderRadius:4, fontSize:10, fontWeight:700, cursor:'pointer' }}>
            LOGOUT
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div style={{ background:'#0B1F1B', borderBottom:'1px solid #0a2040', display:'flex', padding:'0 1rem' }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:'0.55rem 1rem', border:'none', background:'transparent', fontSize:11,
              fontWeight:700, color: tab===key ? color : '#4a6a8a',
              borderBottom: tab===key ? `2px solid ${color}` : '2px solid transparent',
              cursor:'pointer', letterSpacing:'0.06em' }}>
            {label}
          </button>
        ))}
      </div>

      <main style={{ maxWidth:860, margin:'0 auto', padding:'1.5rem' }}>

        {/* HOME */}
        {tab === 'home' && (
          <div>
            <h2 style={{ margin:'0 0 1.25rem', fontSize:18, fontWeight:700, color:'#F4F1EA' }}>
              Welcome back, {client?.fullName?.split(' ')[0] || 'Client'} 👋
            </h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',
              gap:'1rem', marginBottom:'1.5rem' }}>
              {[
                { label:'Outstanding Balance', value:`KES ${outstandingBalance.toLocaleString()}`,
                  color: outstandingBalance > 0 ? '#ff3366' : '#00ff88',
                  action: outstandingBalance > 0 ? () => setTab('invoices') : null, cta:'View Invoices' },
                { label:'Open Tickets', value: openTickets,
                  color: openTickets > 0 ? '#ffd700' : '#00ff88',
                  action: () => setTab('tickets'), cta:'View Tickets' },
                { label:'Total Invoices', value: invoices.length, color, action: () => setTab('invoices'), cta:'View All' },
                { label:'Loyalty Points', value: client?.loyaltyPoints || 0, color:'#a78bfa', action:null },
              ].map(({ label, value, color: c, action, cta }) => (
                <div key={label} style={{ background:'#0B1F1B', borderRadius:10, padding:'1rem',
                  border:`1px solid ${c}22`, cursor: action ? 'pointer' : 'default' }}
                  onClick={action || undefined}>
                  <div style={{ fontSize:11, color:'#4a6a8a', letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
                  <div style={{ fontSize:26, fontWeight:800, color:c }}>{value}</div>
                  {action && <div style={{ fontSize:10, color:c, marginTop:4 }}>{cta} →</div>}
                </div>
              ))}
            </div>
            <Card title="Recent Invoices" accent={color}>
              {invoices.slice(0,3).map(inv => (
                <div key={inv._id} style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', padding:'0.5rem 0', borderBottom:'1px solid #0a2040' }}>
                  <div>
                    <div style={{ fontSize:12, fontFamily:'monospace', color:'#EE6100' }}>{inv.invoiceId}</div>
                    <div style={{ fontSize:11, color:'#4a6a8a' }}>
                      KES {inv.totalAmount?.toLocaleString()} · Due {new Date(inv.dueDate).toLocaleDateString('en-KE')}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <Tag label={inv.status} />
                    {['SENT','PARTIAL'].includes(inv.status) && (
                      <button onClick={() => requestPayment(inv._id)}
                        style={{ padding:'3px 10px', background:'#00ff8822', color:'#00ff88',
                          border:'1px solid #00ff8844', borderRadius:4, fontSize:10,
                          cursor:'pointer', fontWeight:700 }}>PAY NOW</button>
                    )}
                  </div>
                </div>
              ))}
              {invoices.length === 0 && <p style={{ fontSize:12, color:'#4a6a8a', margin:0 }}>No invoices yet</p>}
            </Card>
          </div>
        )}

        {/* INVOICES */}
        {tab === 'invoices' && (
          <div>
            <h2 style={{ margin:'0 0 1.25rem', fontSize:18, fontWeight:700, color:'#F4F1EA' }}>My Invoices</h2>
            {invoices.length === 0
              ? <div style={{ textAlign:'center', padding:'3rem', color:'#2a4a6a' }}>No invoices yet</div>
              : invoices.map(inv => (
                <div key={inv._id} style={{ background:'#0B1F1B', borderRadius:10, padding:'1rem',
                  marginBottom:'0.75rem', border:'1px solid #0a2040' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:11, fontFamily:'monospace', color:'#EE6100', marginBottom:2 }}>{inv.invoiceId}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#F4F1EA' }}>KES {inv.totalAmount?.toLocaleString()}</div>
                      <div style={{ fontSize:11, color:'#4a6a8a', marginTop:2 }}>
                        Balance: <span style={{ color: inv.balance > 0 ? '#ff3366' : '#00ff88', fontWeight:700 }}>
                          KES {inv.balance?.toLocaleString()}
                        </span>{' · '}Due: {new Date(inv.dueDate).toLocaleDateString('en-KE')}
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                      <Tag label={inv.status} />
                      {['SENT','PARTIAL'].includes(inv.status) && (
                        <button onClick={() => requestPayment(inv._id)}
                          style={{ padding:'4px 14px', background:'#00ff8822', color:'#00ff88',
                            border:'1px solid #00ff8844', borderRadius:4, fontSize:11,
                            cursor:'pointer', fontWeight:700 }}>PAY VIA M-PESA</button>
                      )}
                    </div>
                  </div>
                  {inv.lineItems?.length > 0 && (
                    <div style={{ background:'#0F2620', borderRadius:6, padding:'0.5rem 0.75rem' }}>
                      {inv.lineItems.map((line, j) => (
                        <div key={j} style={{ display:'flex', justifyContent:'space-between',
                          fontSize:11, color:'#A9C4BE', padding:'2px 0' }}>
                          <span>{line.description} × {line.qty}</span>
                          <span>KES {(line.total || line.qty * line.unitPrice)?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {/* SUPPORT TICKETS */}
        {tab === 'tickets' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#F4F1EA' }}>Support Tickets</h2>
              <button onClick={() => setShowTicketForm(true)}
                style={{ padding:'0.45rem 1.1rem', background:color, color:'#000', border:'none',
                  borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer' }}>
                + NEW TICKET
              </button>
            </div>

            {tickets.length === 0
              ? <div style={{ textAlign:'center', padding:'3rem', color:'#2a4a6a' }}>No tickets raised yet</div>
              : tickets.map(t => (
                <div key={t._id} style={{ background:'#0B1F1B', borderRadius:10, padding:'1rem',
                  marginBottom:'0.75rem', border:'1px solid #0a2040',
                  borderLeft:`3px solid ${STATUS_COLORS[t.status] || '#4a6a8a'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontSize:10, fontFamily:'monospace', color:'#4a6a8a', marginBottom:2 }}>{t.ticketId}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#F4F1EA' }}>{t.title}</div>
                      <div style={{ fontSize:11, color:'#4a6a8a', marginTop:2 }}>
                        {t.category} · {new Date(t.createdAt).toLocaleDateString('en-KE')}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <Tag label={t.priority} />
                      <Tag label={t.status} />
                    </div>
                  </div>
                  {t.thread?.length > 0 && (
                    <div style={{ marginTop:8, background:'#0F2620', borderRadius:6, padding:'0.5rem 0.75rem' }}>
                      <div style={{ fontSize:10, color:'#4a6a8a', marginBottom:4 }}>Latest response:</div>
                      <div style={{ fontSize:12, color:'#c0d8f0', lineHeight:1.5 }}>
                        {t.thread[t.thread.length-1]?.message?.slice(0,200)}
                      </div>
                    </div>
                  )}
                </div>
              ))
            }

            {showTicketForm && (
              <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex',
                alignItems:'center', justifyContent:'center', zIndex:1000 }}>
                <div style={{ background:'#0B1F1B', border:`1px solid ${color}44`, borderRadius:12,
                  padding:'1.5rem', width:460 }}>
                  <h3 style={{ margin:'0 0 1rem', color, fontSize:16 }}>Raise Support Ticket</h3>
                  <form onSubmit={submitTicket} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {[['Title *','title','text',true],['Category','category','text',false]].map(([label,key,type,required]) => (
                      <label key={key} style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                        {label}
                        <input type={type} value={newTicket[key]} required={required}
                          onChange={e => setNewTicket(p => ({...p,[key]:e.target.value}))}
                          style={{ padding:'0.45rem 0.7rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)',
                            borderRadius:5, color:'#F4F1EA', fontSize:13, outline:'none' }} />
                      </label>
                    ))}
                    <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                      Priority
                      <select value={newTicket.priority}
                        onChange={e => setNewTicket(p => ({...p,priority:e.target.value}))}
                        style={{ padding:'0.45rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)',
                          borderRadius:5, color:'#F4F1EA', fontSize:13 }}>
                        <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
                      </select>
                    </label>
                    <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                      Description *
                      <textarea value={newTicket.description} required rows={4}
                        onChange={e => setNewTicket(p => ({...p,description:e.target.value}))}
                        style={{ padding:'0.45rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)',
                          borderRadius:5, color:'#F4F1EA', fontSize:13, resize:'vertical', outline:'none' }} />
                    </label>
                    <div style={{ display:'flex', gap:10 }}>
                      <button type="submit" disabled={loading}
                        style={{ flex:1, padding:'0.6rem', background: loading ? 'rgba(36,74,68,0.4)' : color,
                          color:'#000', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>
                        {loading ? 'Submitting…' : 'Submit Ticket'}
                      </button>
                      <button type="button" onClick={() => setShowTicketForm(false)}
                        style={{ flex:1, padding:'0.6rem', background:'transparent', color:'#A9C4BE',
                          border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, cursor:'pointer' }}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROFILE */}
        {tab === 'profile' && (
          <div style={{ maxWidth:440 }}>
            <h2 style={{ margin:'0 0 1.25rem', fontSize:18, fontWeight:700, color:'#F4F1EA' }}>My Profile</h2>
            <Card title="Account Details" accent={color}>
              {[
                ['Full Name',      client?.fullName],
                ['Phone',          client?.phone],
                ['Department',     slug.toUpperCase()],
                ['Loyalty Points', client?.loyaltyPoints || 0],
                ['Referral Code',  client?.referralCode || '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between',
                  padding:'0.45rem 0', borderBottom:'1px solid #0a2040', fontSize:13 }}>
                  <span style={{ color:'#A9C4BE' }}>{label}</span>
                  <span style={{ fontWeight:600, color:'#F4F1EA' }}>{value}</span>
                </div>
              ))}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Root export — manages auth state ──────────────────────
export default function ClientPortalPage() {
  const { slug } = useParams();

  const [client, setClient] = useState(() => {
    try { return JSON.parse(localStorage.getItem('clientData')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem(CLIENT_TOKEN_KEY));

  const handleLogin = (clientData, clientToken) => {
    setClient(clientData);
    setToken(clientToken);
  };

  const handleLogout = () => {
    localStorage.removeItem(CLIENT_TOKEN_KEY);
    localStorage.removeItem('clientData');
    setClient(null);
    setToken(null);
  };

  if (!client || !token) {
    return <ClientLogin slug={slug} onLogin={handleLogin} />;
  }

  return <ClientPortal slug={slug} client={client} token={token} onLogout={handleLogout} />;
}
