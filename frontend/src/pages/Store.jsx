// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Circuit Canopy Store
import { useEffect, useState } from 'react';
import { publicApi } from '../utils/api';
import ProductCard from '../components/ProductCard';
import { Spinner, EmptyState } from '../components/UI';

const CATS = ['electronics', 'accessories', 'software', 'services'];

export default function Store() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await publicApi.get('/products', { params: { search, category, sort, page, limit: 12 } });
      setProducts(data.products); setTotal(data.total);
    } catch { setProducts([]); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [search, category, sort, page]);

  return (
    <div>
      {/* Hero */}
      <div className="hero-section" style={{ padding: '5rem 1rem 4rem' }}>
        <div className="scanline-overlay" style={{ opacity: 0.3 }} />
        <div className="section-label">POSTERA CRESCAM LAUDE</div>
        <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Tech Store</h1>
        <p style={{ color: '#A9C4BE', fontSize: 14, margin: 0, fontFamily: "'Poppins', sans-serif" }}>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", color: '#2BB6A3' }}>{total}</span> products · Laptops, accessories, software &amp; service packages
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Search + sort */}
        <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <input
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field"
              style={{ paddingLeft: '2.4rem', fontSize: 14 }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6A8A82', fontSize: 14 }}>🔍</span>
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field" style={{ width: 'auto', fontSize: 13, cursor: 'pointer' }}>
            <option value="-createdAt">Newest</option>
            <option value="price">Price: Low → High</option>
            <option value="-price">Price: High → Low</option>
            <option value="-soldCount">Best Selling</option>
          </select>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '2rem', flexWrap: 'wrap' }}>
          {['', ...CATS].map((c) => (
            <button key={c} onClick={() => { setCategory(c); setPage(1); }} className={`cat-pill${category === c ? ' active' : ''}`}>
              {c || 'All'}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? <Spinner /> : products.length === 0 ? <EmptyState icon="🛍️" message="No products found" /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        <div style={{ display: 'flex', gap: 10, marginTop: '2.5rem', justifyContent: 'center' }}>
          {page > 1 && <button onClick={() => setPage(p => p - 1)} className="page-btn">← Previous</button>}
          {products.length === 12 && <button onClick={() => setPage(p => p + 1)} className="page-btn">Next →</button>}
        </div>
      </div>
    </div>
  );
}
