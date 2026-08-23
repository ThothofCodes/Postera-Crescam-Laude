// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState } from 'react';
import toast from 'react-hot-toast';
import { T } from '../utils/theme';

const WA_NUMBER = '254140918502';
const WA_LINK   = `https://wa.me/${WA_NUMBER}`;

const card = { background: 'linear-gradient(160deg,#0F2620,#0F2620)', border: '1px solid rgba(244,241,234,0.08)', borderRadius: 14, padding: '1.5rem' };

export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const wa = `${WA_LINK}?text=${encodeURIComponent(`Hi Postera Crescam Laude!\n\nName: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}\n\nMessage:\n${form.message}`)}`;
    window.open(wa, '_blank');
    setSent(true);
    toast.success('Opening WhatsApp with your message!');
  };

  return (
    <div>
      <div className="hero-section">
        <div className="section-label">Get in Touch</div>
        <h1 className="hero-title">Contact Us</h1>
        <p style={{ color: 'var(--white-dim)', maxWidth: 500, margin: '0 auto', fontFamily: "'Inter',sans-serif" }}>
          We're based in Ruai Town Centre, Nairobi. Walk in or reach us online.
        </p>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 1rem', color: '#F4F1EA', fontFamily: "'Poppins',sans-serif" }}>📍 Find Us</h3>
              {[['📍', 'Ruai Town Centre, Nairobi County, Kenya'], ['📞', 'IP Phone — coming soon'], ['✉️', 'info@posteracrescamlaude.co.ke']].map(([icon, text]) => (
                <p key={text} style={{ margin: '0 0 10px', fontSize: 14, color: '#A9C4BE', display: 'flex', gap: 10, fontFamily: "'Inter',sans-serif" }}>
                  <span>{icon}</span><span>{text}</span>
                </p>
              ))}
              <a href={WA_LINK} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '0.55rem 1.25rem', background: 'rgba(46,204,113,0.12)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: 8, color: '#2ecc71', fontSize: 14, fontWeight: 600, textDecoration: 'none', fontFamily: "'Inter',sans-serif" }}>
                💬 WhatsApp Us
              </a>
            </div>

            <div style={card}>
              <h3 style={{ margin: '0 0 1rem', color: '#F4F1EA', fontFamily: "'Poppins',sans-serif" }}>🕐 Opening Hours</h3>
              {[['Mon – Fri', '8:00 AM – 8:00 PM'], ['Saturday', '9:00 AM – 7:00 PM'], ['Sunday', '10:00 AM – 5:00 PM']].map(([day, hours]) => (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8, fontFamily: "'Inter',sans-serif" }}>
                  <span style={{ color: '#6A8A82' }}>{day}</span>
                  <span style={{ color: '#F4F1EA', fontWeight: 600 }}>{hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ margin: '0 0 1.25rem', color: '#F4F1EA', fontFamily: "'Poppins',sans-serif" }}>Send Us a Message</h3>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
                <p style={{ fontWeight: 600, color: '#F4F1EA', fontFamily: "'Poppins',sans-serif" }}>Message sent via WhatsApp!</p>
                <button onClick={() => setSent(false)} style={{ marginTop: 12, padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg,#EE6100,#FF8A3D)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[['name', 'Your Name', 'text'], ['phone', 'Phone Number', 'tel'], ['email', 'Email Address', 'email']].map(([k, l, t]) => (
                  <div key={k}>
                    <label style={T.label}>{l}</label>
                    <input type={t} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required={k !== 'email'} style={T.input} />
                  </div>
                ))}
                <div>
                  <label style={T.label}>Message</label>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={5} style={{ ...T.input, resize: 'vertical' }} placeholder="How can we help you?" />
                </div>
                <button type="submit" style={{ padding: '0.8rem', background: 'linear-gradient(135deg,#27ae60,#2ecc71)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 15, fontFamily: "'Poppins',sans-serif", boxShadow: '0 4px 16px rgba(39,174,96,0.3)' }}>
                  💬 Send via WhatsApp
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
