// PCL — Shared Expenses Page
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { api } from '../../../utils/api';
import { formatKES } from '../../../utils/helpers';
import { Spinner } from '../../../components/UI';

export default function ExpensesPage({ color = '#EE6100' }) {
  const { token } = useAdminAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: 'operations' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/expenses', { headers: { Authorization: `Bearer ${token}` } });
      setExpenses(data.expenses || data || []);
    } catch { setExpenses([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', { ...form, amount: Number(form.amount) }, { headers: { Authorization: `Bearer ${token}` } });
      setShowForm(false); setForm({ description: '', amount: '', category: 'operations' }); load();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", margin: 0 }}>Expenses</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 14, color: '#FF3B3B' }}>Total: {formatKES(total)}</span>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '6px 14px', background: color, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Add Expense</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 10, color: '#6A8A82', marginBottom: 4, fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Description</label>
            <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} required style={{ width: '100%', padding: '8px', background: '#081916', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, color: '#F4F1EA', fontSize: 13 }} />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ display: 'block', fontSize: 10, color: '#6A8A82', marginBottom: 4, fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Amount (KES)</label>
            <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required style={{ width: '100%', padding: '8px', background: '#081916', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, color: '#F4F1EA', fontSize: 13 }} />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ display: 'block', fontSize: 10, color: '#6A8A82', marginBottom: 4, fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Category</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ width: '100%', padding: '8px', background: '#081916', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, color: '#F4F1EA', fontSize: 13 }}>
              {['operations', 'utilities', 'rent', 'salaries', 'equipment', 'marketing', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" style={{ padding: '8px 16px', background: color, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Save</button>
        </form>
      )}

      {loading ? <Spinner /> : expenses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6A8A82' }}>No expenses recorded</div>
      ) : (
        <div style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'rgba(36,74,68,0.3)' }}>
              {['Description', 'Category', 'Amount', 'Date'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: 10, color: '#2BB6A3', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {expenses.map((e, i) => (
                <tr key={e._id || i} style={{ borderTop: '1px solid rgba(36,74,68,0.2)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 13, color: '#F4F1EA' }}>{e.description}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 12, color: '#A9C4BE', textTransform: 'capitalize' }}>{e.category}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 13, fontWeight: 600, color: '#FF3B3B', fontFamily: "'Rajdhani',sans-serif" }}>-{formatKES(e.amount || 0)}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: 12, color: '#6A8A82', fontFamily: "'Share Tech Mono',monospace" }}>{e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
