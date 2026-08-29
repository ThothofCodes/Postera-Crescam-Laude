// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';

const COND_COLORS = { NEW:'#00ff88', GOOD:'#EE6100', FAIR:'#ffd700', DAMAGED:'#ff8800', SCRAPPED:'#ff3366' };
const MOVE_TYPES = ['RESTOCK','SALE','JOB_USAGE','DAMAGE_LOSS','RETURN','TRANSFER','ADJUSTMENT'];

const Tag = ({ label, color }) => (
  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
    background:`${color}22`, color, border:`1px solid ${color}44` }}>{label}</span>
);

const Input = ({ label, ...props }) => (
  <label style={{ display:'flex', flexDirection:'column', gap:4, fontSize:11, color:'#A9C4BE' }}>
    {label}
    <input {...props} style={{ padding:'0.45rem 0.7rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)',
      borderRadius:5, color:'#F4F1EA', fontSize:13, outline:'none' }} />
  </label>
);

export default function InventoryPage({ color = '#EE6100' }) {
  const [items, setItems]       = useState([]);
  const [total, setItemsTotal]  = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [tab, setTab]           = useState('items'); // items | low-stock | expiring
  const [showForm, setShowForm] = useState(false);
  const [moveTarget, setMoveTarget] = useState(null);
  const [selected, setSelected] = useState(null);
  const [move, setMove]         = useState({ type:'RESTOCK', quantity:1, notes:'' });
  const [form, setForm]         = useState({
    name:'', category:'', sku:'', quantity:0, reorderLevel:5, reorderQty:10,
    unitCost:0, sellingPrice:0, supplier:'', supplierContact:'', location:'', condition:'NEW'
  });
  const [attachments, setAttachments] = useState([]); // Store actual file objects
  const [imagePreviews, setImagePreviews] = useState([]); // Store image previews
  const [qrCode, setQrCode] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const url = tab === 'low-stock' ? '/inventory/low-stock' : tab === 'expiring' ? '/inventory/expiring' : '/inventory';
      const params = {};
      if (search) params.search = search;
      const { data } = await api.get(url, { params });
      const arr = data.items || data;
      setItems(Array.isArray(arr) ? arr : []);
      setItemsTotal(data.total || arr.length);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  }, [tab, search]);

  useEffect(() => { load(); }, [load]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Process each selected file
    const newPreviews = [];
    const newFiles = [...attachments]; // Keep existing files
    
    files.forEach(file => {
      // Add the file to our attachments list
      newFiles.push(file);
      
      // Create preview for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        setImagePreviews(prev => [...prev, ...newPreviews]); // Update previews
      };
      reader.readAsDataURL(file);
    });
    
    setAttachments(newFiles);
  };

  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
    
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const generateQRCode = async (itemId) => {
    try {
      const { data } = await api.get(`/inventory/${itemId}/qr`);
      if (data.success && data.dataUri) {
        setQrCode(data.dataUri);
        toast.success(`QR code generated for ${data.sku || 'item'}`);
      }
    } catch (err) {
      toast.error('Failed to generate QR code');
    }
  };

  const submitItem = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      
      // Add form fields to FormData
      Object.keys(form).forEach(key => {
        if (form[key] !== undefined && form[key] !== null) {
          formData.append(key, form[key]);
        }
      });
      
      // Add attachment files to FormData
      attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });

      if (selected) {
        // For updates, we need to use a different approach since we can't send both JSON and multipart data
        // We'll make a separate request for file uploads if needed
        if (attachments.length > 0) {
          // If there are new attachments, we need to update using multipart/form-data
          await api.patch(`/inventory/${selected._id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } else {
          // If no new attachments, we can use regular patch
          await api.patch(`/inventory/${selected._id}`, form);
        }
        toast.success('Item updated');
      } else {
        await api.post('/inventory', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Item added');
      }
      
      setShowForm(false); 
      setSelected(null);
      setForm({ 
        name:'', category:'', sku:'', quantity:0, reorderLevel:5, reorderQty:10,
        unitCost:0, sellingPrice:0, supplier:'', supplierContact:'', location:'', condition:'NEW'
      });
      setAttachments([]);
      setImagePreviews([]);
      setQrCode(null);
      load();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Error'); 
    }
  };

  const recordMove = async () => {
    if (!moveTarget) return;
    try {
      await api.post('/inventory/movements', { itemId: moveTarget._id, ...move, quantity: Number(move.quantity) });
      toast.success('Movement recorded');
      setMoveTarget(null);
      setMove({ type:'RESTOCK', quantity:1, notes:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const editItem = (item) => {
    setSelected(item);
    setForm({ 
      name:item.name, category:item.category, sku:item.sku||'', quantity:item.quantity,
      reorderLevel:item.reorderLevel, reorderQty:item.reorderQty, unitCost:item.unitCost,
      sellingPrice:item.sellingPrice, supplier:item.supplier||'', supplierContact:item.supplierContact||'',
      location:item.location||'', condition:item.condition
    });
    setImagePreviews(item.attachments || []);
    setQrCode(item.qrCodeUrl || null);
    setAttachments([]); // Reset attachments when editing existing item
    setShowForm(true);
  };

  const TABS = [['items','All Items'],['low-stock','⚠ Low Stock'],['expiring','⏰ Expiring']];

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", color:'#c0d8f0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color }}>Inventory Management</h2>
          <p style={{ margin:'4px 0 0', fontSize:12, color:'#4a6a8a' }}>{total} items</p>
        </div>
        <button onClick={() => { setSelected(null); setShowForm(true); }}
          style={{ padding:'0.5rem 1.2rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer' }}>
          + ADD ITEM
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:'1rem', borderBottom:'1px solid #0a2040', paddingBottom:8 }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:'0.35rem 0.9rem', borderRadius:4, border:'none', fontSize:11, fontWeight:700,
              background: tab===key ? `${color}22` : 'transparent',
              color: tab===key ? color : '#4a6a8a', cursor:'pointer', letterSpacing:'0.06em' }}>
            {label}
          </button>
        ))}
        <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ marginLeft:'auto', padding:'0.35rem 0.75rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)',
            borderRadius:5, color:'#F4F1EA', fontSize:12, outline:'none', width:180 }} />
      </div>

      {loading ? <p style={{ color:'#4a6a8a' }}>Loading…</p> : (
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #0a2040' }}>
              {['Name','Category','Qty','Reorder At','Unit Cost','Sell Price','Condition','Attachments','Actions'].map(h => (
                <th key={h} style={{ padding:'0.5rem 0.75rem', textAlign:'left', color:'#4a6a8a',
                  fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item._id} style={{ borderBottom:'1px solid #040c1a', background: i%2===0?'transparent':'#050d1a' }}>
                <td style={{ padding:'0.6rem 0.75rem', fontWeight:600, color:'#F4F1EA' }}>
                  {item.name}
                  {item.quantity <= item.reorderLevel && (
                    <span style={{ marginLeft:6, fontSize:9, color:'#ff8800', fontWeight:700 }}>⚠ LOW</span>
                  )}
                </td>
                <td style={{ padding:'0.6rem 0.75rem', color:'#A9C4BE' }}>{item.category}</td>
                <td style={{ padding:'0.6rem 0.75rem', fontWeight:700,
                  color: item.quantity === 0 ? '#ff3366' : item.quantity <= item.reorderLevel ? '#ff8800' : '#00ff88' }}>
                  {item.quantity}
                </td>
                <td style={{ padding:'0.6rem 0.75rem', color:'#A9C4BE' }}>{item.reorderLevel}</td>
                <td style={{ padding:'0.6rem 0.75rem', color:'#A9C4BE' }}>KES {item.unitCost?.toLocaleString()}</td>
                <td style={{ padding:'0.6rem 0.75rem', color:'#A9C4BE' }}>KES {item.sellingPrice?.toLocaleString()}</td>
                <td style={{ padding:'0.6rem 0.75rem' }}><Tag label={item.condition} color={COND_COLORS[item.condition]} /></td>
                <td style={{ padding:'0.6rem 0.75rem', color:'#A9C4BE' }}>
                  {item.attachments && item.attachments.length > 0 ? (
                    <span style={{ color: '#EE6100' }}>📸 {item.attachments.length}</span>
                  ) : (
                    <span>—</span>
                  )}
                </td>
                <td style={{ padding:'0.6rem 0.75rem' }}>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => editItem(item)}
                      style={{ padding:'3px 8px', background:`${color}22`, color, border:`1px solid ${color}44`, borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700 }}>EDIT</button>
                    <button onClick={() => setMoveTarget(item)}
                      style={{ padding:'3px 8px', background:'#1a304022', color:'#A9C4BE', border:'1px solid rgba(36,74,68,0.4)', borderRadius:4, fontSize:10, cursor:'pointer' }}>MOVE</button>
                    {item.qrCodeUrl && (
                      <a 
                        href={item.qrCodeUrl} 
                        download={`qr-${item.sku || item.name}.png`}
                        style={{ padding:'3px 8px', background:'#EE610022', color:'#EE6100', border:'1px solid #EE610044', borderRadius:4, fontSize:10, cursor:'pointer', textDecoration: 'none' }}
                      >
                        QR
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={9} style={{ padding:'2rem', textAlign:'center', color:'#2a4a6a' }}>
                {tab === 'low-stock' ? 'All stock levels are healthy ✓' : tab === 'expiring' ? 'No items expiring soon ✓' : 'No inventory items found'}
              </td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* Add/Edit Item Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#0B1F1B', border:`1px solid ${color}44`, borderRadius:12, padding:'1.5rem', width:500, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 1rem', color, fontSize:16 }}>{selected ? 'Edit Item' : 'Add Item'}</h3>
            <form onSubmit={submitItem} style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <Input label="Name *" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} required style={{ gridColumn:'span 2' }} />
                <Input label="Category *" value={form.category} onChange={e => setForm(p=>({...p,category:e.target.value}))} required />
                <Input label="SKU" value={form.sku} onChange={e => setForm(p=>({...p,sku:e.target.value}))} />
                <Input label="Quantity" type="number" value={form.quantity} onChange={e => setForm(p=>({...p,quantity:e.target.value}))} min={0} />
                <Input label="Reorder At" type="number" value={form.reorderLevel} onChange={e => setForm(p=>({...p,reorderLevel:e.target.value}))} min={0} />
                <Input label="Unit Cost (KES)" type="number" value={form.unitCost} onChange={e => setForm(p=>({...p,unitCost:e.target.value}))} min={0} />
                <Input label="Sell Price (KES)" type="number" value={form.sellingPrice} onChange={e => setForm(p=>({...p,sellingPrice:e.target.value}))} min={0} />
                <Input label="Supplier" value={form.supplier} onChange={e => setForm(p=>({...p,supplier:e.target.value}))} />
                <Input label="Supplier Contact" value={form.supplierContact} onChange={e => setForm(p=>({...p,supplierContact:e.target.value}))} />
                <Input label="Location" value={form.location} onChange={e => setForm(p=>({...p,location:e.target.value}))} />
                <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                  Condition
                  <select value={form.condition} onChange={e => setForm(p=>({...p,condition:e.target.value}))}
                    style={{ padding:'0.45rem 0.7rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13 }}>
                    {['NEW','GOOD','FAIR','DAMAGED','SCRAPPED'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                
                {/* Image Upload for Hardware Repair Photos */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                    Attachments (Photos for repair documentation)
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={handleImageChange}
                      style={{ padding:'0.45rem 0.7rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13 }}
                    />
                  </label>
                  
                  {/* Display image previews */}
                  {imagePreviews.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {imagePreviews.map((preview, index) => (
                        <div key={index} style={{ position: 'relative', width: '80px', height: '80px' }}>
                          <img 
                            src={preview} 
                            alt={`Attachment ${index + 1}`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '5px', border: '1px solid rgba(36,74,68,0.4)' }}
                          />
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            style={{
                              position: 'absolute',
                              top: '-5px',
                              right: '-5px',
                              background: '#ff3366',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {attachments.length > 0 && (
                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#A9C4BE' }}>
                      {attachments.length} file(s) selected for upload
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button 
                  type="button" 
                  onClick={() => generateQRCode(form.sku || form.name)}
                  style={{ flex:1, padding:'0.6rem', background:'#EE6100', color:'#000', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}
                >
                  Generate QR Code
                </button>
                <button type="submit" style={{ flex:1, padding:'0.6rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>
                  {selected ? 'Update' : 'Add Item'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setSelected(null); setAttachments([]); setImagePreviews([]); setQrCode(null); }}
                  style={{ flex:1, padding:'0.6rem', background:'transparent', color:'#A9C4BE', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Movement Modal */}
      {moveTarget && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#0B1F1B', border:'1px solid rgba(36,74,68,0.4)', borderRadius:12, padding:'1.5rem', width:380 }}>
            <h3 style={{ margin:'0 0 0.75rem', color:'#F4F1EA', fontSize:15 }}>Stock Movement — {moveTarget.name}</h3>
            <p style={{ fontSize:12, color:'#4a6a8a', margin:'0 0 1rem' }}>Current stock: <strong style={{ color:'#F4F1EA' }}>{moveTarget.quantity}</strong></p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                Movement Type
                <select value={move.type} onChange={e => setMove(p=>({...p,type:e.target.value}))}
                  style={{ padding:'0.45rem 0.7rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13 }}>
                  {MOVE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </label>
              <Input label="Quantity" type="number" value={move.quantity} onChange={e => setMove(p=>({...p,quantity:e.target.value}))} min={1} />
              <label style={{ fontSize:11, color:'#A9C4BE', display:'flex', flexDirection:'column', gap:4 }}>
                Notes
                <textarea value={move.notes} onChange={e => setMove(p=>({...p,notes:e.target.value}))} rows={2}
                  style={{ padding:'0.45rem', background:'#0F2620', border:'1px solid rgba(36,74,68,0.4)', borderRadius:5, color:'#F4F1EA', fontSize:13, resize:'none', outline:'none' }} />
              </label>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:14 }}>
              <button onClick={recordMove}
                style={{ flex:1, padding:'0.6rem', background:color, color:'#000', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>Record</button>
              <button onClick={() => setMoveTarget(null)}
                style={{ flex:1, padding:'0.6rem', background:'transparent', color:'#A9C4BE', border:'1px solid rgba(36,74,68,0.4)', borderRadius:6, cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}