import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import api from '../../utils/api';

const STATUS_COLORS = {
  paid: { bg: '#0d94881a', text: '#0d9488', border: '#0d948844' },
  unpaid: { bg: '#ea580c1a', text: '#ea580c', border: '#ea580c44' },
  partial: { bg: '#ca8a041a', text: '#ca8a04', border: '#ca8a0444' },
  refunded: { bg: '#7c3aed1a', text: '#7c3aed', border: '#7c3aed44' },
};

const METHOD_ICONS = { mpesa: '📱', cash: '💵', bank: '🏦' };
const SOURCE_ICONS = { order: '🛍️', consultation: '🤝', invoice: '📄' };

function formatCurrency(n) {
  return `KES ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PaymentHistory() {
  const { token } = useAdminAuth();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalPaid: 0, totalUnpaid: 0, totalCount: 0, paidCount: 0, unpaidCount: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', '30');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (methodFilter) params.set('method', methodFilter);
      if (sourceFilter) params.set('source', sourceFilter);

      const res = await api.get(`/payment-history?${params.toString()}`);
      setPayments(res.data.payments || []);
      setSummary(res.data.summary || {});
      setPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, methodFilter, sourceFilter, token]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, methodFilter, sourceFilter]);

  const handleExportPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (methodFilter) params.set('method', methodFilter);
      if (sourceFilter) params.set('source', sourceFilter);
      window.open(`/api/payment-history/pdf?${params.toString()}`, '_blank');
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  const statusStyle = (status) => {
    const c = STATUS_COLORS[status] || STATUS_COLORS.unpaid;
    return { background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 16, padding: '2px 10px', fontSize: 12, fontWeight: 600, letterSpacing: '0.3px' };
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: 'var(--admin-bg, #0a0e1a)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>💰 Payment History</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: 14 }}>{total} transactions found</p>
        </div>
        <button onClick={handleExportPDF} style={{
          padding: '10px 20px', background: 'linear-gradient(135deg, #ee6100, #f97316)', color: '#fff',
          border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14
        }}>
          📥 Export PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Transactions', value: summary.totalCount, icon: '📊', color: '#6366f1' },
          { label: 'Paid', value: `${summary.paidCount}`, icon: '✅', color: '#0d9488' },
          { label: 'Unpaid / Partial', value: `${summary.unpaidCount}`, icon: '⏳', color: '#ea580c' },
          { label: 'Total Collected', value: formatCurrency(summary.totalPaid), icon: '💵', color: '#0d9488' },
          { label: 'Outstanding', value: formatCurrency(summary.totalUnpaid), icon: '🔴', color: '#dc2626' },
        ].map((card, i) => (
          <div key={i} style={{
            background: '#111827', border: '1px solid #1e293b', borderRadius: 12,
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 28 }}>{card.icon}</span>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>{card.label}</div>
              <div style={{ color: card.color, fontSize: 20, fontWeight: 700 }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center',
        background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: '12px 16px'
      }}>
        <input
          type="text"
          placeholder="🔍 Search by order #, M-Pesa ref, or customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 300px', padding: '10px 14px', background: '#0a0e1a', border: '1px solid #334155',
            borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none',
          }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={filterStyle}>
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} style={filterStyle}>
          <option value="">All Methods</option>
          <option value="mpesa">M-Pesa</option>
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} style={filterStyle}>
          <option value="">All Sources</option>
          <option value="order">Orders</option>
          <option value="consultation">Consultations</option>
          <option value="invoice">Invoices</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No payments found</div>
            <div style={{ fontSize: 14, marginTop: 4 }}>Try adjusting your filters</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#0a0e1a', borderBottom: '1px solid #1e293b' }}>
                  {['Source', 'Reference', 'Customer', 'Amount', 'Status', 'Method', 'M-Pesa Ref', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <>
                    <tr key={p.id} style={{ borderBottom: '1px solid #1e293b', cursor: 'pointer' }}
                      onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    >
                      <td style={tdStyle}>
                        <span style={{ fontSize: 18, marginRight: 6 }}>{SOURCE_ICONS[p.type] || '📋'}</span>
                        {p.type}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'monospace', color: '#818cf8', fontWeight: 600 }}>{p.reference}</span>
                      </td>
                      <td style={tdStyle}>{p.customerName || '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#e2e8f0' }}>{formatCurrency(p.amount)}</td>
                      <td style={tdStyle}>
                        <span style={statusStyle(p.status)}>{p.status}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ marginRight: 4 }}>{METHOD_ICONS[p.method] || '💳'}</span>
                        {p.method?.toUpperCase() || 'N/A'}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'monospace', color: '#64748b', fontSize: 12 }}>{p.mpesaRef || '—'}</span>
                      </td>
                      <td style={tdStyle}>{formatDate(p.createdAt)}</td>
                      <td style={tdStyle}>
                        <span style={{ color: '#64748b', transition: 'transform 0.2s', display: 'inline-block', transform: expandedId === p.id ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                      </td>
                    </tr>
                    {expandedId === p.id && (
                      <tr key={`${p.id}-detail`}>
                        <td colSpan={9} style={{ padding: '16px 20px', background: '#0a0e1a', borderBottom: '1px solid #1e293b' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                            <div><span style={{ color: '#64748b', fontSize: 12 }}>Phone</span><br /><span style={{ color: '#e2e8f0' }}>{p.customerPhone || '—'}</span></div>
                            <div><span style={{ color: '#64748b', fontSize: 12 }}>Checkout Request ID</span><br /><span style={{ fontFamily: 'monospace', color: '#e2e8f0', fontSize: 12 }}>{p.checkoutRequestId || '—'}</span></div>
                            <div><span style={{ color: '#64748b', fontSize: 12 }}>Retry Count</span><br /><span style={{ color: p.retryCount > 0 ? '#ea580c' : '#e2e8f0' }}>{p.retryCount || 0}</span></div>
                            {p.type === 'invoice' && (
                              <>
                                <div><span style={{ color: '#64748b', fontSize: 12 }}>Paid Amount</span><br /><span style={{ color: '#0d9488' }}>{formatCurrency(p.paid)}</span></div>
                                <div><span style={{ color: '#64748b', fontSize: 12 }}>Balance Due</span><br /><span style={{ color: '#dc2626' }}>{formatCurrency(p.balance)}</span></div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={pageBtnStyle(page <= 1)}>← Prev</button>
          <span style={{ color: '#64748b', fontSize: 14, padding: '8px 16px' }}>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} style={pageBtnStyle(page >= pages)}>Next →</button>
        </div>
      )}
    </div>
  );
}

const filterStyle = {
  padding: '10px 12px', background: '#0a0e1a', border: '1px solid #334155',
  borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none', minWidth: 120,
};

const tdStyle = {
  padding: '12px 16px', color: '#cbd5e1', whiteSpace: 'nowrap',
};

const pageBtnStyle = (disabled) => ({
  padding: '8px 16px', background: disabled ? '#1e293b' : '#1e293b',
  border: '1px solid #334155', borderRadius: 8, color: disabled ? '#475569' : '#e2e8f0',
  cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
});
