// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../utils/api';
import { formatKES } from '../utils/helpers';
import { Spinner } from '../components/UI';

const CAT_META = {
  internet:      { icon: '🌐', label: 'Internet',       color: '#2BB6A3' },
  printing:      { icon: '🖨️',  label: 'Printing',       color: '#FF8A3D' },
  gaming:        { icon: '🎮', label: 'Gaming',          color: '#9b59b6' },
  'web-dev':     { icon: '💻', label: 'Web Dev',         color: '#2BB6A3' },
  cybersecurity: { icon: '🔒', label: 'Cybersecurity',   color: '#EE6100' },
  hardware:      { icon: '🔧', label: 'Hardware Repair', color: '#e67e22' },
  'it-support':  { icon: '🛠️',  label: 'IT Support',     color: '#27ae60' },
  'social-media':{ icon: '📱', label: 'Social Media',    color: '#244A44' },
  other:         { icon: '📋', label: 'Other',           color: '#7f8c8d' },
};

export default function PublicServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await publicApi.get('/services', { params: { isActive: true, ...(category && { category }) } });
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const categories = [...new Set(services.map((s) => s.category))];

  return (
    <div>
      {/* Hero */}
      <div className="hero-section">
        <div className="section-label">Postera Crescam Laude</div>
        <h1 className="hero-title">Our Services</h1>
        <p className="hero-subtitle">
          Everything you need under one roof — internet, printing, repairs, web development and more at PCL Centre, Nairobi.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/consult/book" className="btn-primary" style={{ display: 'inline-block', padding: '0.75rem 2rem', borderRadius: 8, fontWeight: 700, fontSize: 15 }}>
            Book a Service
          </Link>
          <Link to="/calculator" className="btn-secondary" style={{ display: 'inline-block', padding: '0.75rem 2rem', borderRadius: 8, fontWeight: 700, fontSize: 15 }}>
            Price Calculator
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem' }}>
        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => setCategory('')} className={`cat-pill${category === '' ? ' active' : ''}`}>
            All Services
          </button>
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`cat-pill${category === c ? ' active' : ''}`}>
              {CAT_META[c]?.icon} {CAT_META[c]?.label || c}
            </button>
          ))}
        </div>

        {/* Service grid */}
        {loading ? <Spinner /> : services.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 16 }}>No services found in this category.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {services.map((s, i) => {
              const meta = CAT_META[s.category] || { icon: '📋', color: '#7f8c8d' };
              return (
                <div key={s._id} className="service-card" style={{ animationDelay: `${i * 0.05}s` }}>
                  {/* Icon + category */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <div className="service-icon" style={{ background: `linear-gradient(135deg, ${meta.color}22, ${meta.color}11)`, borderColor: `${meta.color}33` }}>
                      {meta.icon}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="service-name">{s.name}</h3>

                  {/* Description */}
                  {s.description && (
                    <p className="service-desc">{s.description}</p>
                  )}

                  {/* Price + CTA */}
                  <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(244,241,234,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="service-price">{formatKES(s.basePrice)}</span>
                      <span className="service-unit"> {s.priceUnit}</span>
                    </div>
                    <Link to="/consult/book" style={{
                      padding: '0.45rem 1.1rem',
                      background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
                      color: '#fff',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      boxShadow: `0 4px 12px ${meta.color}44`,
                      whiteSpace: 'nowrap',
                    }}>
                      Book Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA strip */}
        <div className="feature-strip" style={{ marginTop: '4rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, marginBottom: '0.5rem' }}>Not sure what you need?</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--white-dim)' }}>
            Use our smart price calculator to get an instant estimate for any service or hardware bundle.
          </p>
          <Link to="/calculator" className="btn-primary" style={{ display: 'inline-block', padding: '0.75rem 2.5rem', borderRadius: 8, fontWeight: 700, fontSize: 15 }}>
            Try the Price Calculator →
          </Link>
        </div>
      </div>
    </div>
  );
}
