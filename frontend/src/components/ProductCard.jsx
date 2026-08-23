// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Circuit Canopy ProductCard
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatKES, noImagePlaceholder } from '../utils/helpers';

import { memo } from 'react';

function ProductCard({ product }) {
  const { addItem } = useCart();
  const img = product.images?.[0] || noImagePlaceholder(300, 200);
  const outOfStock = !product.isDigital && product.stock === 0;

  return (
    <div style={{
      background: '#0F2620',
      border: '1px solid rgba(36,74,68,0.4)',
      borderRadius: 10,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.25s ease',
      position: 'relative',
    }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = 'rgba(43,182,163,0.3)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 0 20px rgba(43,182,163,0.05)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = 'rgba(36,74,68,0.4)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}>

      {/* Featured badge */}
      {product.featured && (
        <div style={{
          position: 'absolute', top: 14, right: 12,
          background: 'rgba(238,97,0,0.15)',
          border: '1px solid rgba(238,97,0,0.3)',
          borderRadius: 4, padding: '2px 10px',
          fontSize: 10, fontWeight: 400, color: '#EE6100',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          fontFamily: "'Share Tech Mono',monospace",
          zIndex: 2,
        }}>Featured</div>
      )}

      {/* Image */}
      <Link to={`/store/${product.slug}`}>
        <div style={{ position: 'relative', overflow: 'hidden', height: 190, background: '#081916' }}>
          <img src={img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.6s ease' }}
            onMouseOver={(e) => { e.target.style.transform = 'scale(1.04)'; }}
            onMouseOut={(e) => { e.target.style.transform = 'scale(1)'; }} />
        </div>
      </Link>

      {/* Content */}
      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 10, color: '#EE6100', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace" }}>
          {product.category}
        </span>

        <Link to={`/store/${product.slug}`} style={{ fontWeight: 700, color: '#F4F1EA', textDecoration: 'none', fontSize: 15, lineHeight: 1.3, fontFamily: "'Rajdhani','Poppins', sans-serif" }}>
          {product.name}
        </Link>

        {product.shortDesc && (
          <p style={{ fontSize: 12.5, color: '#6A8A82', margin: 0, lineHeight: 1.5, fontFamily: "'Poppins', sans-serif" }}>{product.shortDesc}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto', paddingTop: 8 }}>
          <span style={{
            fontWeight: 700, fontSize: 18,
            color: '#F4F1EA',
            fontFamily: "'Rajdhani','Poppins', sans-serif",
          }}>{formatKES(product.price)}</span>
          {product.comparePrice && (
            <span style={{ textDecoration: 'line-through', color: '#6A8A82', fontSize: 12, fontFamily: "'Share Tech Mono',monospace" }}>
              {formatKES(product.comparePrice)}
            </span>
          )}
        </div>

        {outOfStock ? (
          <span style={{ fontSize: 12, color: '#FF3B3B', fontWeight: 600, fontFamily: "'Share Tech Mono',monospace" }}>Out of stock</span>
        ) : (
          <button onClick={() => addItem(product)} style={{
            padding: '0.55rem',
            background: 'transparent',
            color: '#2BB6A3',
            border: '1px solid rgba(43,182,163,0.4)',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'Poppins', sans-serif",
            transition: 'all 0.2s ease',
          }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(43,182,163,0.1)'; e.currentTarget.style.borderColor = '#2BB6A3'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(43,182,163,0.4)'; }}>
            + Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(ProductCard);
