// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { T } from '../utils/theme';
import { publicApi } from '../utils/api';
import { formatKES } from '../utils/helpers';
import { Spinner } from '../components/UI';

const WA_NUMBER = '254140918502';

const TYPES = ['web-development','cybersecurity','networking','hardware-advisory','business-digitisation','social-media-strategy','data-recovery','general-it'];
const FEES = {
  'web-development': { 60: 1500, 90: 2000 }, 'cybersecurity': { 60: 2000, 90: 3000 },
  'business-digitisation': { 60: 1500, 90: 2500 }, 'networking': { 30: 800, 60: 1500 },
  'hardware-advisory': { 30: 500, 60: 1000 }, 'social-media-strategy': { 60: 1000, 90: 1800 },
  'data-recovery': { 30: 800, 60: 1500 }, 'general-it': { 30: 500, 60: 1000 },
};

const card = { background: 'linear-gradient(160deg,#0F2620,#0F2620)', border: '1px solid rgba(244,241,234,0.08)', borderRadius: 12, padding: '1.25rem' };

export default function ConsultBook() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const initialType = TYPES.includes(params.get('type')) ? params.get('type') : TYPES[0];
  const [form, setForm] = useState({ consultationType: initialType, duration: Object.keys(FEES[initialType])[0] * 1, medium: 'in-person', preferredDate: '', topic: '', description: '', name: '', phone: '', email: '', payNow: true });

  useEffect(() => {
    const available = Object.keys(FEES[form.consultationType] || {}).map(Number);
    if (!available.includes(form.duration)) setForm((f) => ({ ...f, duration: available[0] }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.consultationType]);

  const durations = Object.keys(FEES[form.consultationType] || {}).map(Number);
  const fee = FEES[form.consultationType]?.[form.duration] || 0;

  const submit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      let clientId;
      try {
        const { data: newClient } = await api.post('/clients', { name: form.name, phone: form.phone, email: form.email });
        clientId = newClient._id;
      } catch (err) {
        if (err.response?.status === 400 || err.response?.data?.code === 11000) {
          toast.error('Phone number already registered. Please contact us to book.'); setSubmitting(false); return;
        }
        throw err;
      }
      await api.post('/consultations', { client: clientId, consultationType: form.consultationType, duration: form.duration, medium: form.medium, preferredDate: form.preferredDate, topic: form.topic, description: form.description, payNow: form.payNow });
      toast.success('Consultation booked! Check your phone for confirmation SMS.');

      // If WhatsApp medium selected, open WhatsApp with session details
      if (form.medium === 'whatsapp') {
        const msg = encodeURIComponent(
          `Hi Postera Crescam Laude! I've just booked a consultation.\n\n` +
          `Type: ${form.consultationType.replace(/-/g,' ')}\n` +
          `Duration: ${form.duration} minutes\n` +
          `Date: ${new Date(form.preferredDate).toLocaleString('en-KE')}\n` +
          `Topic: ${form.topic}\n` +
          `Fee: KES ${fee}\n\n` +
          `Name: ${form.name}\nPhone: ${form.phone}`
        );
        window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
      }

      navigate('/consult');
    } catch (err) { toast.error(err.response?.data?.message || 'Booking failed. Please try again.'); }
    setSubmitting(false);
  };

  const selBtn = (active, color = '#FF8A3D') => ({ flex: 1, padding: '0.55rem', borderRadius: 8, border: `2px solid ${active ? color : 'rgba(244,241,234,0.1)'}`, background: active ? `${color}18` : 'transparent', color: active ? '#F4F1EA' : '#6A8A82', cursor: 'pointer', fontWeight: 600, fontFamily: "'Inter',sans-serif", transition: 'all 0.15s' });

  return (
    <div style={{ maxWidth: 620, margin: '2rem auto', padding: '0 1.5rem' }}>
      <h1 style={{ margin: '0 0 1.5rem', fontFamily: "'Poppins',sans-serif", color: '#F4F1EA' }}>Book a Consultation</h1>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        <div style={card}>
          <h3 style={{ margin: '0 0 1rem', color: '#F4F1EA', fontFamily: "'Poppins',sans-serif" }}>Session Details</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={T.label}>Consultation Type</label>
            <select value={form.consultationType} onChange={(e) => setForm({ ...form, consultationType: e.target.value })} style={T.input}>
              {TYPES.map((t) => <option key={t} value={t}>{t.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={T.label}>Duration & Fee</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {durations.map((d) => <button key={d} type="button" onClick={() => setForm({ ...form, duration: d })} style={selBtn(form.duration === d)}>{d} min — {formatKES(FEES[form.consultationType][d])}</button>)}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={T.label}>Medium</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['in-person','🏪'],['phone','📞'],['whatsapp','💬'],['video','🎥']].map(([m, icon]) => (
                <button key={m} type="button" onClick={() => setForm({ ...form, medium: m })} style={{ ...selBtn(form.medium === m), flex: 'none', padding: '0.4rem 0.85rem' }}>{icon} {m}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={T.label}>Preferred Date & Time</label>
            <input type="datetime-local" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} required style={T.input} min={new Date().toISOString().slice(0, 16)} />
          </div>
        </div>

        <div style={card}>
          <h3 style={{ margin: '0 0 1rem', color: '#F4F1EA', fontFamily: "'Poppins',sans-serif" }}>Your Brief</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={T.label}>Topic (short title)</label>
            <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required maxLength={200} style={T.input} placeholder="e.g. Need help choosing a business website platform" />
          </div>
          <div>
            <label style={T.label}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={4} style={{ ...T.input, resize: 'vertical' }} placeholder="Describe what you need help with..." />
          </div>
        </div>

        <div style={card}>
          <h3 style={{ margin: '0 0 1rem', color: '#F4F1EA', fontFamily: "'Poppins',sans-serif" }}>Your Details</h3>
          {[['name','Full Name','text',true],['phone','Phone Number','tel',true],['email','Email (optional)','email',false]].map(([k,l,t,req]) => (
            <div key={k} style={{ marginBottom: 12 }}>
              <label style={T.label}>{l}</label>
              <input type={t} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required={req} style={T.input} />
            </div>
          ))}
        </div>

        <div style={card}>
          <h3 style={{ margin: '0 0 0.75rem', color: '#F4F1EA', fontFamily: "'Poppins',sans-serif" }}>Payment — {formatKES(fee)}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setForm({ ...form, payNow: true })} style={selBtn(form.payNow, '#2ecc71')}>📱 Pay Now (M-Pesa)</button>
            <button type="button" onClick={() => setForm({ ...form, payNow: false })} style={selBtn(!form.payNow)}>💵 Pay on Day</button>
          </div>
        </div>

        <button type="submit" disabled={submitting} style={{ padding: '0.9rem', background: 'linear-gradient(135deg,#EE6100,#FF8A3D)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 16, fontFamily: "'Poppins',sans-serif", boxShadow: '0 4px 20px rgba(238,97,0,0.35)' }}>
          {submitting ? 'Booking...' : `Confirm Booking — ${formatKES(fee)}`}
        </button>
      </form>
    </div>
  );
}
