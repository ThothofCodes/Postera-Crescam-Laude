// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Circuit Canopy ConsultLanding
import { useEffect, useState } from 'react';
import { publicApi } from '../utils/api';
import ConsultationCard from '../components/ConsultationCard';
import { Spinner } from '../components/UI';

const WA_NUMBER = '254140918502';
const WA_LINK   = `https://wa.me/${WA_NUMBER}`;

export default function ConsultLanding() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.get('/consultations/types').then((r) => setTypes(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="hero-section">
        <div className="section-label">EXPERT ADVISORY</div>
        <h1 className="hero-title">Book a Consultation</h1>
        <p className="hero-subtitle">
          One-on-one advisory sessions with our tech experts. Available in-person, phone, WhatsApp, or video call.
        </p>
        <a
          href={`${WA_LINK}?text=${encodeURIComponent('Hi Postera Crescam Laude! I\'d like to book a consultation.')}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: '1.5rem',
            padding: '0.75rem 2rem',
            background: '#25D366',
            color: '#fff',
            borderRadius: 4, fontSize: 15, fontWeight: 700,
            textDecoration: 'none', fontFamily: "'Poppins',sans-serif",
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 0 20px rgba(37,211,102,0.3)'; }}
          onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'none'; }}>
          💬 Chat on WhatsApp
        </a>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem' }}>
        {/* How it works */}
        <div className="feature-strip" style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: '📍', color: '#EE6100', title: 'In-Person',        desc: 'PCL Centre',          href: null },
              { icon: '💬', color: '#25D366', title: 'WhatsApp',          desc: '+254 140 918 502',          href: `${WA_LINK}?text=${encodeURIComponent('Hi! I\'d like a consultation.')}` },
              { icon: '📞', color: '#2BB6A3', title: 'Phone Call',        desc: 'IP Phone — coming soon',    href: null },
              { icon: '🎥', color: '#FFB020', title: 'Video Call',        desc: 'Google Meet / Zoom',        href: null },
              { icon: '⏱', color: '#39FF88', title: 'Flexible Duration', desc: '30, 60, or 90 min',         href: null },
            ].map(({ icon, color, title, desc, href }) => {
              const inner = (
                <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: '#F4F1EA', fontFamily: "'Rajdhani','Poppins',sans-serif" }}>{title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: href ? color : '#6A8A82', fontFamily: "'Poppins',sans-serif", fontWeight: href ? 600 : 400 }}>{desc}</p>
                </div>
              );
              return href ? (
                <a key={title} href={href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', borderRadius: 10, border: '1px solid rgba(36,74,68,0.4)', background: '#0F2620', transition: 'all 0.2s', display: 'block', padding: '0.5rem' }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 20px ${color}22`; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(36,74,68,0.4)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  {inner}
                </a>
              ) : (
                <div key={title} style={{ border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '0.5rem', background: '#0F2620' }}>{inner}</div>
              );
            })}
          </div>
        </div>

        {/* Consultation types */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="section-label">CHOOSE YOUR SESSION</div>
          <h2 style={{ fontSize: 24, fontFamily: "'Rajdhani','Poppins',sans-serif", margin: '4px 0 0', color: '#F4F1EA' }}>Consultation Types</h2>
        </div>

        {loading ? <Spinner /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem' }}>
            {types.map(({ type, fees }) => <ConsultationCard key={type} type={type} fees={fees} />)}
          </div>
        )}

        {/* Bottom WhatsApp CTA */}
        <div style={{ marginTop: '3rem', textAlign: 'center', padding: '2rem', background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10 }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: 18, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani','Poppins',sans-serif" }}>
            Prefer to chat first?
          </p>
          <p style={{ margin: '0 0 1.25rem', fontSize: 13, color: '#6A8A82', fontFamily: "'Poppins',sans-serif" }}>
            Message us on WhatsApp and we'll help you choose the right consultation type.
          </p>
          <a
            href={`${WA_LINK}?text=${encodeURIComponent('Hi Postera Crescam Laude! I need help choosing the right consultation.')}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0.75rem 2rem',
              background: '#25D366',
              color: '#fff', borderRadius: 4, fontSize: 15, fontWeight: 700,
              textDecoration: 'none', fontFamily: "'Poppins',sans-serif",
            }}>
            💬 WhatsApp: +254 140 918 502
          </a>
        </div>
      </div>
    </div>
  );
}
