// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Local Tech Hub: Embedded content access within the main application
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ARTICLES = [
  { id: 1, title: 'Understanding Kenya\'s Digital Infrastructure Growth', category: 'networking', excerpt: 'How fiber optic expansion is transforming internet access across Nairobi and beyond.', readTime: '5 min', date: 'Aug 24, 2026', featured: true },
  { id: 2, title: 'Cybersecurity Best Practices for Small Businesses', category: 'cybersecurity', excerpt: 'Essential security measures every Kenyan SME should implement today.', readTime: '8 min', date: 'Aug 22, 2026' },
  { id: 3, title: 'The Rise of AI in East African Tech', category: 'ai', excerpt: 'Local startups are leveraging machine learning to solve uniquely African challenges.', readTime: '6 min', date: 'Aug 20, 2026' },
  { id: 4, title: 'Building Your First Web Application in 2026', category: 'webdev', excerpt: 'A beginner\'s guide to modern web development with React and Node.js.', readTime: '12 min', date: 'Aug 18, 2026' },
  { id: 5, title: 'Hardware Maintenance Tips for Longevity', category: 'hardware', excerpt: 'Keep your devices running smoothly with these professional maintenance tips.', readTime: '4 min', date: 'Aug 15, 2026' },
  { id: 6, title: 'Linux Commands Every Developer Should Know', category: 'software', excerpt: 'Master the terminal with these essential Linux commands.', readTime: '7 min', date: 'Aug 12, 2026' },
];

const TIPS = [
  { id: 1, tip: 'Speed up your Windows PC by disabling startup programs', difficulty: 'Beginner', category: 'Windows' },
  { id: 2, tip: 'Use keyboard shortcuts to boost your productivity by 50%', difficulty: 'Beginner', category: 'General' },
  { id: 3, tip: 'Secure your home Wi-Fi with these 5 essential settings', difficulty: 'Intermediate', category: 'Networking' },
  { id: 4, tip: 'Recover accidentally deleted files from any device', difficulty: 'Intermediate', category: 'General' },
  { id: 5, tip: 'Optimize your browser for faster browsing speeds', difficulty: 'Beginner', category: 'Browser' },
  { id: 6, tip: 'Set up a VPN for secure public Wi-Fi usage', difficulty: 'Advanced', category: 'Security' },
];

const FACTS = [
  { id: 1, fact: 'The first computer bug was an actual bug — a moth found in a Harvard Mark II computer in 1947.', category: 'History' },
  { id: 2, fact: 'The entire Apollo 11 guidance computer had less processing power than a modern pocket calculator.', category: 'Space Tech' },
  { id: 3, fact: 'The first text message ever sent was "Merry Christmas" in 1992.', category: 'Innovation' },
];

const CATEGORY_COLORS = {
  networking: '#2BB6A3',
  cybersecurity: '#ff3366',
  ai: '#00ff88',
  webdev: '#EE6100',
  hardware: '#ffd700',
  software: '#a78bfa',
  general: '#4a6a8a',
};

export default function TechHubLocal() {
  const [activeTab, setActiveTab] = useState('articles');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = ARTICLES.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", color:'#c0d8f0', minHeight:'100vh' }}>
      {/* Header */}
      <div style={{
        background:'linear-gradient(135deg, #0B1F1B 0%, #0a2a24 50%, #0F2620 100%)',
        padding:'2rem',
        borderBottom:'2px solid #EE6100',
      }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'#F4F1EA' }}>
              📡 Tech Hub
            </h1>
            <p style={{ margin:'4px 0 0', fontSize:12, color:'#4a6a8a' }}>
              Empowering Kenya's Digital Future
            </p>
          </div>
          <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding:'0.5rem 1rem',
                background:'#0F2620',
                border:'1px solid rgba(36,74,68,0.4)',
                borderRadius:6,
                color:'#F4F1EA',
                fontSize:12,
                width:200,
              }}
            />
            <a
              href="https://blog.pcl.co.ke"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding:'0.5rem 1rem',
                background:'transparent',
                color:'#2BB6A3',
                border:'1px solid #2BB6A3',
                borderRadius:6,
                fontSize:12,
                fontWeight:600,
                textDecoration:'none',
              }}
            >
              Full Site →
            </a>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'1rem 2rem 0' }}>
        <div style={{ display:'flex', gap:'0.5rem', borderBottom:'1px solid rgba(36,74,68,0.4)', marginBottom:'1.5rem' }}>
          {[
            { key: 'articles', label: '📚 Articles', count: filteredArticles.length },
            { key: 'tips', label: '💡 Tips', count: TIPS.length },
            { key: 'facts', label: '🧠 Facts', count: FACTS.length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding:'0.75rem 1.5rem',
                background:'transparent',
                color: activeTab === key ? '#EE6100' : '#4a6a8a',
                border:'none',
                borderBottom: activeTab === key ? '2px solid #EE6100' : '2px solid transparent',
                fontSize:13,
                fontWeight:600,
                cursor:'pointer',
                transition:'all 0.2s',
              }}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 2rem 2rem' }}>
        {/* Articles */}
        {activeTab === 'articles' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'1.5rem' }}>
            {filteredArticles.map((article, i) => (
              <div
                key={article.id}
                style={{
                  background:'#050d0a',
                  border:`1px solid ${i === 0 ? 'rgba(238,97,0,0.4)' : 'rgba(43,182,163,0.2)'}`,
                  borderRadius:12,
                  padding:'1.25rem',
                  transition:'all 0.2s',
                  cursor:'pointer',
                  gridColumn: i === 0 && searchQuery ? 'auto' : (i === 0 ? 'span 2' : 'auto'),
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#EE6100'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = i === 0 ? 'rgba(238,97,0,0.4)' : 'rgba(43,182,163,0.2)'; e.currentTarget.style.transform = 'none'; }}
              >
                {i === 0 && !searchQuery && (
                  <span style={{
                    display:'inline-block',
                    padding:'2px 8px',
                    background:'#EE6100',
                    color:'#000',
                    borderRadius:4,
                    fontSize:10,
                    fontWeight:700,
                    marginBottom:'0.75rem',
                  }}>
                    ★ FEATURED
                  </span>
                )}
                <span style={{
                  display:'inline-block',
                  fontSize:11,
                  fontWeight:600,
                  color: CATEGORY_COLORS[article.category] || '#4a6a8a',
                  textTransform:'uppercase',
                  marginBottom:'0.5rem',
                }}>
                  {article.category}
                </span>
                <h3 style={{ fontSize: i === 0 && !searchQuery ? '1.25rem' : '1rem', marginBottom:'0.5rem', color:'#F4F1EA' }}>
                  {article.title}
                </h3>
                <p style={{ fontSize:'0.9rem', color:'#A9C4BE', marginBottom:'0.75rem', lineHeight:1.5 }}>
                  {article.excerpt}
                </p>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#4a6a8a' }}>
                  <span>{article.readTime}</span>
                  <span>{article.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        {activeTab === 'tips' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1rem' }}>
            {TIPS.map((tip) => (
              <div
                key={tip.id}
                style={{
                  background:'rgba(43,182,163,0.08)',
                  border:'1px solid rgba(43,182,163,0.3)',
                  borderRadius:8,
                  padding:'1rem',
                }}
              >
                <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.5rem' }}>
                  <span style={{
                    padding:'2px 8px',
                    background: tip.difficulty === 'Beginner' ? '#2BB6A3' : tip.difficulty === 'Intermediate' ? '#ffd700' : '#ff3366',
                    color:'#000',
                    borderRadius:99,
                    fontSize:10,
                    fontWeight:700,
                  }}>
                    {tip.difficulty}
                  </span>
                  <span style={{ fontSize:11, color:'#4a6a8a' }}>{tip.category}</span>
                </div>
                <p style={{ fontSize:'0.9rem', color:'#F4F1EA', lineHeight:1.5 }}>
                  {tip.tip}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Facts */}
        {activeTab === 'facts' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'1rem' }}>
            {FACTS.map((fact) => (
              <div
                key={fact.id}
                style={{
                  background:'rgba(238,97,0,0.08)',
                  border:'1px solid rgba(238,97,0,0.3)',
                  borderRadius:8,
                  padding:'1.5rem',
                }}
              >
                <span style={{
                  display:'inline-block',
                  padding:'2px 8px',
                  background:'rgba(238,97,0,0.2)',
                  color:'#EE6100',
                  borderRadius:4,
                  fontSize:10,
                  fontWeight:700,
                  marginBottom:'0.75rem',
                }}>
                  {fact.category}
                </span>
                <p style={{ fontSize:'1rem', color:'#F4F1EA', lineHeight:1.6, fontStyle:'italic' }}>
                  "{fact.fact}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div style={{
        background:'linear-gradient(135deg, #0a2a24, #0B1F1B)',
        padding:'2rem',
        textAlign:'center',
        borderTop:'1px solid rgba(43,182,163,0.2)',
      }}>
        <p style={{ color:'#A9C4BE', marginBottom:'1rem' }}>
          Want more in-depth content? Visit our full Tech Hub.
        </p>
        <a
          href="https://blog.pcl.co.ke"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:'inline-block',
            padding:'0.7rem 1.5rem',
            background:'#EE6100',
            color:'#000',
            borderRadius:6,
            fontWeight:700,
            fontSize:'0.9rem',
            textDecoration:'none',
          }}
        >
          🔗 Visit PCL Tech Hub
        </a>
      </div>
    </div>
  );
}
