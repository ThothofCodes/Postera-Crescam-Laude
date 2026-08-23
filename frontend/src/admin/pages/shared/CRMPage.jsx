// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';

const SEGMENT_COLORS = { LEAD:'#ffd700', ACTIVE:'#00ff88', INACTIVE:'#ff8800', CHURNED:'#ff3366' };
const KYC_COLORS     = { UNVERIFIED:'#ff3366', PARTIAL:'#ffd700', VERIFIED:'#00ff88' };
const APPLICATION_TYPES = {
  'BUSINESS_REGISTRATION': {
    name: 'Business Registration via eCitizen',
    steps: ['Application Submitted', 'Documents Verified', 'Payment Confirmed', 'Certificate Issued'],
    requiredDocs: ['National ID', 'PIN Certificate', 'Physical Address Proof']
  },
  'TIN_APPLICATION': {
    name: 'TIN Application',
    steps: ['Application Form Filled', 'Documents Submitted', 'Verification Process', 'TIN Generated'],
    requiredDocs: ['National ID', 'Business Registration Certificate', 'KRA Compliance Certificate']
  },
  'NHIF_ENROLLMENT': {
    name: 'NHIF Enrollment',
    steps: ['Personal Details Captured', 'Documents Uploaded', 'Verification', 'Activation'],
    requiredDocs: ['National ID', 'Passport Photo', 'Bank Statement']
  },
  'GOVERNMENT_PERMIT': {
    name: 'Government Permit Application',
    steps: ['Application Filed', 'Inspection Scheduled', 'Compliance Verified', 'Permit Issued'],
    requiredDocs: ['Business License', 'Fire Safety Certificate', 'Environmental Clearance']
  }
};

const Tag = ({ label, color = '#4a6a8a' }) => (
  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
    background:`${color}22`, color, border:`1px solid ${color}44`, letterSpacing:'0.06em' }}>
    {label}
  </span>
);

const Input = ({ label, ...props }) => (
  <label style={{ display:'flex', flexDirection:'column', gap:4, fontSize:11, color:'#A9C4BE', letterSpacing:'0.06em' }}>
    {label}
    <input {...props} style={{ padding:'0.5rem 0.75rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)',
      borderRadius:6, color:'#F4F1EA', fontSize:13, outline:'none', ...props.style }} />
  </label>
);

const Select = ({ label, children, ...props }) => (
  <label style={{ display:'flex', flexDirection:'column', gap:4, fontSize:11, color:'#A9C4BE', letterSpacing:'0.06em' }}>
    {label}
    <select {...props} style={{ padding:'0.5rem 0.75rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)',
      borderRadius:6, color:'#F4F1EA', fontSize:13, outline:'none' }}>
      {children}
    </select>
  </label>
);

export default function CRMPage({ slug, color = '#EE6100' }) {
  const [clients, setClients]         = useState([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [segment, setSegment]         = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [selected, setSelected]       = useState(null);
  const [interacting, setInteracting] = useState(null);
  const [interNote, setInterNote]     = useState('');
  const [form, setForm]               = useState({
    fullName:'', phone:'', email:'', idType:'NATIONAL_ID',
    idNumber:'', segment:'LEAD', address:'', notes:'', 
    govApplications: [], // For government admin assistance
    bundledServices: []  // For multi-service bundling
  });
  const [showGovForm, setShowGovForm] = useState(false);
  const [govForm, setGovForm]         = useState({
    applicationType: '',
    currentStep: 0,
    submittedDocuments: [],
    notes: ''
  });
  const [showBundleForm, setShowBundleForm] = useState(false);
  const [bundleForm, setBundleForm] = useState({
    services: [],
    totalPrice: 0
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search)  params.search  = search;
      if (segment) params.segment = segment;
      const { data } = await api.get('/crm', { params });
      setClients(data.clients || data);
      setTotal(data.total || (data.clients || data).length);
    } catch { toast.error('Failed to load clients'); }
    finally { setLoading(false); }
  }, [search, segment]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (selected) {
        await api.patch(`/crm/${selected._id}`, form);
        toast.success('Client updated');
      } else {
        await api.post('/crm', form);
        toast.success('Client created');
      }
      setShowForm(false); setSelected(null);
      setForm({ 
        fullName:'', phone:'', email:'', idType:'NATIONAL_ID', 
        idNumber:'', segment:'LEAD', address:'', notes:'', 
        govApplications: [], bundledServices: [] 
      });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const logInteraction = async () => {
    if (!interNote.trim()) return;
    try {
      await api.post(`/crm/${interacting._id}/interactions`, { summary: interNote, type:'NOTE', outcome:'NEUTRAL' });
      toast.success('Interaction logged');
      setInteracting(null); setInterNote('');
    } catch { toast.error('Failed to log'); }
  };

  const sendPortalInvite = async (id) => {
    try {
      await api.post(`/crm/${id}/portal-invite`);
      toast.success('Portal invite sent via SMS');
    } catch { toast.error('Failed to send invite'); }
  };

  // Function to add government application
  const addGovApplication = async () => {
    if (!selected || !govForm.applicationType) return;
    
    try {
      const updatedApplications = [...(selected.govApplications || []), {
        ...govForm,
        id: Date.now(), // temporary ID
        createdAt: new Date().toISOString()
      }];
      
      await api.patch(`/crm/${selected._id}`, {
        ...selected,
        govApplications: updatedApplications
      });
      
      toast.success('Government application added');
      setShowGovForm(false);
      setGovForm({ applicationType: '', currentStep: 0, submittedDocuments: [], notes: '' });
      // Reload the client data
      const { data } = await api.get(`/crm/${selected._id}`);
      setSelected(data);
    } catch (err) {
      toast.error('Failed to add application');
    }
  };

  // Function to add bundled services
  const addBundledServices = async () => {
    if (!selected || bundleForm.services.length === 0) return;
    
    try {
      const updatedBundles = [...(selected.bundledServices || []), {
        ...bundleForm,
        id: Date.now(), // temporary ID
        createdAt: new Date().toISOString()
      }];
      
      await api.patch(`/crm/${selected._id}`, {
        ...selected,
        bundledServices: updatedBundles
      });
      
      toast.success('Bundled services added');
      setShowBundleForm(false);
      setBundleForm({ services: [], totalPrice: 0 });
      // Reload the client data
      const { data } = await api.get(`/crm/${selected._id}`);
      setSelected(data);
    } catch (err) {
      toast.error('Failed to add bundled services');
    }
  };

  const editClient = (c) => {
    setSelected(c);
    setForm({ 
      fullName:c.fullName, phone:c.phone, email:c.email||'', idType:c.idType||'NATIONAL_ID',
      idNumber:c.idNumber||'', segment:c.segment, address:c.address||'', notes:c.notes||'',
      govApplications: c.govApplications || [],
      bundledServices: c.bundledServices || []
    });
    setShowForm(true);
  };

  // Function to advance government application workflow
  const advanceGovApplication = async (clientId, appId, newStep) => {
    try {
      const updatedApps = selected.govApplications.map(app => 
        app.id === appId ? { ...app, currentStep: newStep } : app
      );
      
      await api.patch(`/crm/${clientId}`, {
        ...selected,
        govApplications: updatedApps
      });
      
      toast.success('Application step updated');
      // Reload the client data
      const { data } = await api.get(`/crm/${clientId}`);
      setSelected(data);
    } catch (err) {
      toast.error('Failed to update application step');
    }
  };

  // Function to check document completeness
  const checkDocumentCompleteness = (applicationType, submittedDocs) => {
    if (!APPLICATION_TYPES[applicationType]) return { missing: [], complete: false };
    
    const requiredDocs = APPLICATION_TYPES[applicationType].requiredDocs;
    const missingDocs = requiredDocs.filter(doc => !submittedDocs.includes(doc));
    
    return {
      missing: missingDocs,
      complete: missingDocs.length === 0
    };
  };

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", color:'#c0d8f0' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color }}>CRM — Client Management</h2>
          <p style={{ margin:'4px 0 0', fontSize:12, color:'#4a6a8a' }}>{total} clients in department</p>
        </div>
        <button onClick={() => { setSelected(null); setShowForm(true); }}
          style={{ padding:'0.5rem 1.2rem', background:color, color:'#000', border:'none', borderRadius:6,
            fontWeight:700, fontSize:12, cursor:'pointer', letterSpacing:'0.06em' }}>
          + NEW CLIENT
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:'1rem' }}>
        <input placeholder="Search name or phone…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex:1, padding:'0.5rem 0.75rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)',
            borderRadius:6, color:'#F4F1EA', fontSize:13, outline:'none' }} />
        <select value={segment} onChange={e => setSegment(e.target.value)}
          style={{ padding:'0.5rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, color:'#F4F1EA', fontSize:13 }}>
          <option value="">All Segments</option>
          {['LEAD','ACTIVE','INACTIVE','CHURNED'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Client table */}
      {loading ? <p style={{ color:'#4a6a8a' }}>Loading…</p> : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #0a2040' }}>
                {['Name','Phone','Email','Segment','KYC','Balance (KES)','Gov Apps','Bundled','Actions'].map(h => (
                  <th key={h} style={{ padding:'0.6rem 0.75rem', textAlign:'left', color:'#4a6a8a',
                    letterSpacing:'0.08em', fontWeight:600, textTransform:'uppercase', fontSize:10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={c._id} style={{ borderBottom:'1px solid #040c1a', background: i%2===0?'transparent':'#050d1a' }}>
                  <td style={{ padding:'0.6rem 0.75rem', fontWeight:600, color:'#F4F1EA' }}>{c.fullName}</td>
                  <td style={{ padding:'0.6rem 0.75rem', color:'#A9C4BE' }}>{c.phone}</td>
                  <td style={{ padding:'0.6rem 0.75rem', color:'#A9C4BE' }}>{c.email || '—'}</td>
                  <td style={{ padding:'0.6rem 0.75rem' }}><Tag label={c.segment} color={SEGMENT_COLORS[c.segment]} /></td>
                  <td style={{ padding:'0.6rem 0.75rem' }}><Tag label={c.kycStatus} color={KYC_COLORS[c.kycStatus]} /></td>
                  <td style={{ padding:'0.6rem 0.75rem', color: c.outstandingBalance > 0 ? '#ff3366':'#00ff88' }}>
                    {c.outstandingBalance?.toLocaleString() || '0'}
                  </td>
                  <td style={{ padding:'0.6rem 0.75rem', color: '#A9C4BE' }}>
                    {c.govApplications && c.govApplications.length > 0 ? (
                      <span style={{ color: '#EE6100' }}>📋 {c.govApplications.length}</span>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td style={{ padding:'0.6rem 0.75rem', color: '#A9C4BE' }}>
                    {c.bundledServices && c.bundledServices.length > 0 ? (
                      <span style={{ color: '#00ff88' }}>묶 {c.bundledServices.length}</span>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td style={{ padding:'0.6rem 0.75rem' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => editClient(c)}
                        style={{ padding:'3px 10px', background:`${color}22`, color, border:`1px solid ${color}44`, borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700 }}>EDIT</button>
                      <button onClick={() => setInteracting(c)}
                        style={{ padding:'3px 10px', background:'#1a304022', color:'#A9C4BE', border:'1px solid rgba(36,74,68,0.4)', borderRadius:4, fontSize:10, cursor:'pointer' }}>LOG</button>
                      {!c.portalAccess && (
                        <button onClick={() => sendPortalInvite(c._id)}
                          style={{ padding:'3px 10px', background:'#00ff8822', color:'#00ff88', border:'1px solid #00ff8844', borderRadius:4, fontSize:10, cursor:'pointer' }}>INVITE</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={9} style={{ padding:'2rem', textAlign:'center', color:'#2a4a6a' }}>No clients found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#0B1F1B', border:`1px solid ${color}44`, borderRadius:12, padding:'1.5rem', width:480, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 1rem', color, fontSize:16, fontWeight:700 }}>{selected ? 'Edit Client' : 'New Client'}</h3>
            <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <Input label="Full Name *" value={form.fullName} onChange={e => setForm(p=>({...p,fullName:e.target.value}))} required />
              <Input label="Phone (E.164 e.g. 254712…) *" value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} required />
              <Input label="Email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} type="email" />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Select label="ID Type" value={form.idType} onChange={e => setForm(p=>({...p,idType:e.target.value}))}>
                  <option>NATIONAL_ID</option><option>PASSPORT</option><option>ALIEN_ID</option>
                </Select>
                <Input label="ID Number" value={form.idNumber} onChange={e => setForm(p=>({...p,idNumber:e.target.value}))} />
              </div>
              <Select label="Segment" value={form.segment} onChange={e => setForm(p=>({...p,segment:e.target.value}))}>
                {['LEAD','ACTIVE','INACTIVE','CHURNED'].map(s => <option key={s}>{s}</option>)}
              </Select>
              <Input label="Address" value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} />
              <label style={{ fontSize:11, color:'#A9C4BE', letterSpacing:'0.06em', display:'flex', flexDirection:'column', gap:4 }}>
                Internal Notes
                <textarea value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} rows={3}
                  style={{ padding:'0.5rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6,
                    color:'#F4F1EA', fontSize:13, resize:'vertical', outline:'none' }} />
              </label>
              
              {/* Government Applications Section */}
              <div style={{ borderTop: '1px solid rgba(36,74,68,0.4)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, color: '#F4F1EA', fontSize: '14px' }}>Government Applications</h4>
                  <button 
                    type="button" 
                    onClick={() => setShowGovForm(true)}
                    style={{ padding: '4px 8px', background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                  >
                    + Add
                  </button>
                </div>
                
                {selected && selected.govApplications && selected.govApplications.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {selected.govApplications.map((app, idx) => (
                      <div key={idx} style={{ background: '#0F2620', borderRadius: '6px', padding: '0.5rem', fontSize: '11px' }}>
                        <div style={{ color: '#EE6100', fontWeight: 'bold' }}>{APPLICATION_TYPES[app.applicationType]?.name || app.applicationType}</div>
                        <div>Step: {app.currentStep + 1}/{APPLICATION_TYPES[app.applicationType]?.steps.length || 'N/A'}</div>
                        
                        {/* Document completeness check */}
                        {app.applicationType && (
                          <div>
                            {(() => {
                              const completeness = checkDocumentCompleteness(app.applicationType, app.submittedDocuments || []);
                              return completeness.complete ? (
                                <span style={{ color: '#00ff88', fontSize: '10px' }}>✓ Complete</span>
                              ) : (
                                <span style={{ color: '#ff3366', fontSize: '10px' }}>{completeness.missing.length} docs missing</span>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#4a6a8a', fontStyle: 'italic', marginBottom: '1rem' }}>No government applications</div>
                )}
              </div>
              
              {/* Bundled Services Section */}
              <div style={{ borderTop: '1px solid rgba(36,74,68,0.4)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, color: '#F4F1EA', fontSize: '14px' }}>Bundled Services</h4>
                  <button 
                    type="button" 
                    onClick={() => setShowBundleForm(true)}
                    style={{ padding: '4px 8px', background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                  >
                    + Bundle
                  </button>
                </div>
                
                {selected && selected.bundledServices && selected.bundledServices.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {selected.bundledServices.map((bundle, idx) => (
                      <div key={idx} style={{ background: '#0F2620', borderRadius: '6px', padding: '0.5rem', fontSize: '11px' }}>
                        <div style={{ color: '#00ff88', fontWeight: 'bold' }}>{bundle.services.length} services</div>
                        <div>Total: KES {bundle.totalPrice}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#4a6a8a', fontStyle: 'italic', marginBottom: '1rem' }}>No bundled services</div>
                )}
              </div>
              
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="submit" style={{ flex:1, padding:'0.6rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  {selected ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setSelected(null); }}
                  style={{ flex:1, padding:'0.6rem', background:'transparent', color:'#A9C4BE', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Government Application Modal */}
      {showGovForm && selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#0B1F1B', border:`1px solid ${color}44`, borderRadius:12, padding:'1.5rem', width:480, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 1rem', color, fontSize:16, fontWeight:700 }}>Add Government Application</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <Select 
                label="Application Type" 
                value={govForm.applicationType} 
                onChange={e => {
                  setGovForm({...govForm, applicationType: e.target.value});
                }}
              >
                <option value="">Select application type...</option>
                {Object.entries(APPLICATION_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>{value.name}</option>
                ))}
              </Select>
              
              {govForm.applicationType && (
                <>
                  <div style={{ fontSize: '12px', color: '#A9C4BE', marginBottom: '0.5rem' }}>
                    Steps: {APPLICATION_TYPES[govForm.applicationType]?.steps.join(' → ')}
                  </div>
                  
                  <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                    Current Step
                    <select 
                      value={govForm.currentStep} 
                      onChange={e => setGovForm({...govForm, currentStep: parseInt(e.target.value)})}
                      style={{ padding:'0.5rem 0.75rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, color:'#F4F1EA', fontSize:13, outline:'none' }}
                    >
                      {APPLICATION_TYPES[govForm.applicationType]?.steps.map((step, index) => (
                        <option key={index} value={index}>{index + 1}. {step}</option>
                      ))}
                    </select>
                  </label>
                  
                  <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                    Required Documents
                    <div style={{ fontSize: '11px', color: '#b8c8e0' }}>
                      {APPLICATION_TYPES[govForm.applicationType]?.requiredDocs.map((doc, idx) => (
                        <div key={idx}>• {doc}</div>
                      ))}
                    </div>
                  </label>
                  
                  <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                    Submitted Documents
                    <textarea 
                      value={govForm.submittedDocuments.join('\n')} 
                      onChange={e => setGovForm({
                        ...govForm, 
                        submittedDocuments: e.target.value.split('\n').filter(d => d.trim() !== '')
                      })}
                      placeholder="List submitted documents, one per line"
                      rows={3}
                      style={{ padding:'0.5rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6,
                        color:'#F4F1EA', fontSize:13, resize:'vertical', outline:'none' }}
                    />
                  </label>
                  
                  <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                    Notes
                    <textarea 
                      value={govForm.notes} 
                      onChange={e => setGovForm({...govForm, notes: e.target.value})}
                      rows={3}
                      style={{ padding:'0.5rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6,
                        color:'#F4F1EA', fontSize:13, resize:'vertical', outline:'none' }}
                    />
                  </label>
                  
                  <div style={{ display:'flex', gap:10, marginTop:4 }}>
                    <button 
                      onClick={addGovApplication}
                      style={{ flex:1, padding:'0.6rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                      Add Application
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowGovForm(false);
                        setGovForm({ applicationType: '', currentStep: 0, submittedDocuments: [], notes: '' });
                      }}
                      style={{ flex:1, padding:'0.6rem', background:'transparent', color:'#A9C4BE', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bundle Services Modal */}
      {showBundleForm && selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#0B1F1B', border:`1px solid ${color}44`, borderRadius:12, padding:'1.5rem', width:480, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 1rem', color, fontSize:16, fontWeight:700 }}>Bundle Services</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                Select Services
                <select 
                  multiple
                  style={{ padding:'0.5rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, color:'#F4F1EA', fontSize:13, outline:'none', height: '120px' }}
                  onChange={e => {
                    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
                    setBundleForm({...bundleForm, services: selectedOptions});
                  }}
                >
                  <option value="business_registration">Business Registration</option>
                  <option value="tin_application">TIN Application</option>
                  <option value="nhif_enrollment">NHIF Enrollment</option>
                  <option value="permit_application">Permit Application</option>
                  <option value="license_renewal">License Renewal</option>
                  <option value="document_legalization">Document Legalization</option>
                </select>
              </label>
              
              <Input 
                label="Total Price (KES)" 
                type="number" 
                value={bundleForm.totalPrice} 
                onChange={e => setBundleForm({...bundleForm, totalPrice: e.target.value})}
              />
              
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button 
                  onClick={addBundledServices}
                  style={{ flex:1, padding:'0.6rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  Add Bundle
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowBundleForm(false);
                    setBundleForm({ services: [], totalPrice: 0 });
                  }}
                  style={{ flex:1, padding:'0.6rem', background:'transparent', color:'#A9C4BE', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Interaction Modal */}
      {interacting && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#0B1F1B', border:'1px solid rgba(36,74,68,0.4)', borderRadius:12, padding:'1.5rem', width:420 }}>
            <h3 style={{ margin:'0 0 0.75rem', color:'#F4F1EA', fontSize:15 }}>Log Interaction — {interacting.fullName}</h3>
            <textarea value={interNote} onChange={e => setInterNote(e.target.value)} rows={4} placeholder="Summarise the interaction…"
              style={{ width:'100%', padding:'0.5rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6,
                color:'#F4F1EA', fontSize:13, resize:'none', outline:'none', boxSizing:'border-box' }} />
            <div style={{ display:'flex', gap:10, marginTop:12 }}>
              <button onClick={logInteraction}
                style={{ flex:1, padding:'0.6rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>Log</button>
              <button onClick={() => { setInteracting(null); setInterNote(''); }}
                style={{ flex:1, padding:'0.6rem', background:'transparent', color:'#A9C4BE', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}