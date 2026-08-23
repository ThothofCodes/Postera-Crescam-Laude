// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  DRAFT:'#A9C4BE', SENT:'#EE6100', PAYMENT_SENT:'#ffd700',
  PAID:'#00ff88', PARTIAL:'#ff8800', OVERDUE:'#ff3366', CANCELLED:'#4a6a8a'
};

const Tag = ({ label }) => {
  const color = STATUS_COLORS[label] || '#A9C4BE';
  return <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
    background:`${color}22`, color, border:`1px solid ${color}44` }}>{label}</span>;
};

export default function BillingPage({ color = '#EE6100' }) {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showETIMSModal, setShowETIMSModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [clients, setClients]   = useState([]);
  const [form, setForm]         = useState({ 
    clientId:'', dueDate:'', notes:'', lineItems:[{ description:'', qty:1, unitPrice:0 }], 
    etimsInvoiceNumber: null, // Track eTIMS invoice number
    etimsStatus: 'NOT_SENT' // Track eTIMS status
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/billing', { params });
      setInvoices(data.invoices || data);
      setTotal(data.total || (data.invoices || data).length);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/crm').then(r => setClients(r.data.clients || r.data || [])).catch(() => {});
  }, []);

  const addLine = () => setForm(p => ({ ...p, lineItems:[...p.lineItems, { description:'', qty:1, unitPrice:0 }] }));
  const removeLine = (i) => setForm(p => ({ ...p, lineItems: p.lineItems.filter((_,idx)=>idx!==i) }));
  const updateLine = (i, field, val) => setForm(p => {
    const items = [...p.lineItems];
    items[i] = { ...items[i], [field]: val };
    return { ...p, lineItems: items };
  });

  const subtotal = form.lineItems.reduce((s,i) => s + Number(i.qty||0)*Number(i.unitPrice||0), 0);
  const tax      = subtotal * 0.16;
  const total_   = subtotal + tax;

  const createInvoice = async (e) => {
    e.preventDefault();
    if (!form.clientId) { toast.error('Select a client'); return; }
    try {
      await api.post('/billing', { 
        ...form, 
        lineItems: form.lineItems.map(i=>({ ...i, qty:Number(i.qty), unitPrice:Number(i.unitPrice) }))
      });
      toast.success('Invoice created');
      setShowForm(false);
      setForm({ clientId:'', dueDate:'', notes:'', lineItems:[{ description:'', qty:1, unitPrice:0 }], etimsInvoiceNumber: null, etimsStatus: 'NOT_SENT' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const sendInvoice = async (id) => {
    try { await api.patch(`/billing/${id}/send`); toast.success('Invoice sent'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const requestPayment = async (inv) => {
    try { await api.post(`/billing/${inv._id}/pay`); toast.success('STK push sent to client'); }
    catch (err) { toast.error(err.response?.data?.message || 'Could not initiate payment'); }
  };

  const cancelInvoice = async (id) => {
    if (!window.confirm('Cancel this invoice?')) return;
    try { await api.patch(`/billing/${id}/cancel`); toast.success('Invoice cancelled'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  // Function to submit invoice to KRA eTIMS
  const submitToETIMS = async (invoiceId) => {
    try {
      const response = await api.post(`/billing/${invoiceId}/etims-submit`);
      toast.success('Invoice submitted to KRA eTIMS');
      // Update the invoice with eTIMS info
      const updatedInvoices = invoices.map(inv => 
        inv._id === invoiceId 
          ? { ...inv, etimsInvoiceNumber: response.data.etimsInvoiceNumber, etimsStatus: 'SUBMITTED' } 
          : inv
      );
      setInvoices(updatedInvoices);
    } catch (err) {
      toast.error('Failed to submit to KRA eTIMS: ' + (err.response?.data?.message || 'Error'));
    }
  };

  const STATUSES = ['','DRAFT','SENT','PAYMENT_SENT','PAID','PARTIAL','OVERDUE','CANCELLED'];

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", color:'#c0d8f0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color }}>Billing & Invoices</h2>
          <p style={{ margin:'4px 0 0', fontSize:12, color:'#4a6a8a' }}>{total} invoices</p>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding:'0.5rem 1.2rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer' }}>
          + NEW INVOICE
        </button>
      </div>

      {/* Filter */}
      <div style={{ marginBottom:'1rem' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding:'0.45rem 0.75rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:12 }}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      {loading ? <p style={{ color:'#4a6a8a' }}>Loading…</p> : (
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #0a2040' }}>
              {['Invoice ID','Client','Total (KES)','Balance (KES)','Due Date','Status','eTIMS','Actions'].map(h => (
                <th key={h} style={{ padding:'0.5rem 0.75rem', textAlign:'left', color:'#4a6a8a',
                  fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={inv._id} style={{ borderBottom:'1px solid #040c1a', background: i%2===0?'transparent':'#050d1a' }}>
                <td style={{ padding:'0.6rem 0.75rem', fontFamily:'monospace', fontSize:11, color:'#EE6100' }}>{inv.invoiceId}</td>
                <td style={{ padding:'0.6rem 0.75rem', color:'#F4F1EA' }}>{inv.client?.fullName || '—'}</td>
                <td style={{ padding:'0.6rem 0.75rem', fontWeight:700, color:'#F4F1EA' }}>{inv.totalAmount?.toLocaleString()}</td>
                <td style={{ padding:'0.6rem 0.75rem', color: inv.balance > 0 ? '#ff3366' : '#00ff88' }}>{inv.balance?.toLocaleString()}</td>
                <td style={{ padding:'0.6rem 0.75rem', color:'#A9C4BE' }}>{new Date(inv.dueDate).toLocaleDateString('en-KE')}</td>
                <td style={{ padding:'0.6rem 0.75rem' }}><Tag label={inv.status} /></td>
                <td style={{ padding:'0.6rem 0.75rem', color: '#A9C4BE' }}>
                  {inv.etimsStatus === 'SUBMITTED' ? (
                    <span style={{ color: '#00ff88' }}>✓ {inv.etimsInvoiceNumber || 'Submitted'}</span>
                  ) : inv.etimsStatus === 'FAILED' ? (
                    <span style={{ color: '#ff3366' }}>✗ Failed</span>
                  ) : (
                    <span style={{ color: '#A9C4BE' }}>Not sent</span>
                  )}
                </td>
                <td style={{ padding:'0.6rem 0.75rem' }}>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {inv.status === 'DRAFT' && (
                      <button onClick={() => sendInvoice(inv._id)}
                        style={{ padding:'3px 8px', background:'#EE610022', color:'#EE6100', border:'1px solid #EE610044', borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700 }}>SEND</button>
                    )}
                    {['SENT','PARTIAL'].includes(inv.status) && (
                      <button onClick={() => requestPayment(inv)}
                        style={{ padding:'3px 8px', background:'#00ff8822', color:'#00ff88', border:'1px solid #00ff8844', borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700 }}>PAY</button>
                    )}
                    {!['PAID','CANCELLED'].includes(inv.status) && (
                      <button onClick={() => cancelInvoice(inv._id)}
                        style={{ padding:'3px 8px', background:'#ff336622', color:'#ff3366', border:'1px solid #ff336644', borderRadius:4, fontSize:10, cursor:'pointer' }}>CANCEL</button>
                    )}
                    {inv.status === 'PAID' && !inv.etimsInvoiceNumber && (
                      <button onClick={() => submitToETIMS(inv._id)}
                        style={{ padding:'3px 8px', background:'#EE610022', color:'#EE6100', border:'1px solid #EE610044', borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700 }}>eTIMS</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={8} style={{ padding:'2rem', textAlign:'center', color:'#2a4a6a' }}>No invoices found</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* Create Invoice Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#0B1F1B', border:`1px solid ${color}44`, borderRadius:12, padding:'1.5rem', width:540, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 1rem', color, fontSize:16 }}>New Invoice</h3>
            <form onSubmit={createInvoice} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                Client *
                <select value={form.clientId} onChange={e => setForm(p=>({...p,clientId:e.target.value}))} required
                  style={{ padding:'0.45rem 0.7rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13 }}>
                  <option value="">Select client…</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.fullName} — {c.phone}</option>)}
                </select>
              </label>
              <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                Due Date *
                <input type="date" value={form.dueDate} onChange={e => setForm(p=>({...p,dueDate:e.target.value}))} required
                  style={{ padding:'0.45rem 0.7rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13 }} />
              </label>

              {/* Line Items */}
              <div>
                <div style={{ fontSize:11, color:'#A9C4BE', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  LINE ITEMS
                  <button type="button" onClick={addLine}
                    style={{ fontSize:10, padding:'2px 8px', background:`${color}22`, color, border:`1px solid ${color}44`, borderRadius:4, cursor:'pointer' }}>+ Add Line</button>
                </div>
                {form.lineItems.map((line, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:6, marginBottom:6, alignItems:'center' }}>
                    <input placeholder="Description" value={line.description} onChange={e => updateLine(i,'description',e.target.value)}
                      style={{ padding:'0.4rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:4, color:'#F4F1EA', fontSize:12, outline:'none' }} />
                    <input placeholder="Qty" type="number" value={line.qty} min={1} onChange={e => updateLine(i,'qty',e.target.value)}
                      style={{ padding:'0.4rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:4, color:'#F4F1EA', fontSize:12, outline:'none' }} />
                    <input placeholder="Unit Price" type="number" value={line.unitPrice} min={0} onChange={e => updateLine(i,'unitPrice',e.target.value)}
                      style={{ padding:'0.4rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:4, color:'#F4F1EA', fontSize:12, outline:'none' }} />
                    <button type="button" onClick={() => removeLine(i)}
                      style={{ background:'transparent', border:'none', color:'#ff3366', fontSize:14, cursor:'pointer', padding:0 }}>✕</button>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ background:'#0F2620', borderRadius:8, padding:'0.75rem', fontSize:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', color:'#A9C4BE', marginBottom:4 }}>
                  <span>Subtotal</span><span>KES {subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', color:'#A9C4BE', marginBottom:4 }}>
                  <span>VAT (16%)</span><span>KES {tax.toFixed(2)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', color, fontWeight:700, fontSize:14, borderTop:'1px solid rgba(36,74,68,0.4)', paddingTop:6, marginTop:6 }}>
                  <span>TOTAL</span><span>KES {total_.toFixed(2)}</span>
                </div>
              </div>

              <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                Notes
                <textarea value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} rows={2}
                  style={{ padding:'0.45rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13, resize:'none', outline:'none' }} />
              </label>

              {/* KRA eTIMS Integration Notice */}
              <div style={{ background:'#0F2620', borderLeft:`3px solid ${color}`, borderRadius:6, padding:'0.75rem', fontSize:11, color:'#A9C4BE' }}>
                <div style={{ fontWeight:700, color, marginBottom:4 }}>KRA eTIMS Compliance</div>
                <div>After payment is confirmed, submit this invoice to KRA eTIMS for tax compliance.</div>
                <div style={{ marginTop: 4, fontSize:10, color:'#4a6a8a' }}>Required for invoices over KES 500</div>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" style={{ flex:1, padding:'0.6rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>Create Invoice</button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex:1, padding:'0.6rem', background:'transparent', color:'#A9C4BE', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, cursor:'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}