// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { api } from '../utils/api';
import { formatKES, formatDate } from '../utils/helpers';
import { Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';
import { T, btn, btnSm, tabPill } from '../utils/theme';

const CATS = ['booking', 'order', 'consultation', 'salary', 'rent', 'utilities', 'stock', 'marketing', 'other'];
const EMPTY = { type: 'income', category: 'booking', description: '', amount: '', date: new Date().toISOString().slice(0, 10), paymentMethod: 'cash', reference: '' };
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0F2620', border: '1px solid rgba(238,97,0,0.3)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: 13 }}>
      <p style={{ color: '#F4F1EA', fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>{p.name}: {formatKES(p.value)}</p>)}
    </div>
  );
};

export default function Revenue() {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [ledger, sum] = await Promise.all([
      api.get('/revenue', { params: { type, page, limit: 30 } }),
      api.get('/revenue/summary'),
    ]);
    setEntries(ledger.data.entries); setTotal(ledger.data.total);
    setSummary(sum.data);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [type, page]);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post('/revenue', form); toast.success('Entry added'); setModal(false); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm('Delete entry?')) return;
    await api.delete(`/revenue/${id}`); toast.success('Deleted'); load();
  };

  const chartData = MONTHS.map((name, i) => ({
    name,
    income:  summary.find((s) => s._id.month === i + 1 && s._id.type === 'income')?.total  || 0,
    expense: summary.find((s) => s._id.month === i + 1 && s._id.type === 'expense')?.total || 0,
  }));
  const totalIncome  = chartData.reduce((s, d) => s + d.income, 0);
  const totalExpense = chartData.reduce((s, d) => s + d.expense, 0);

  return (
    <div style={T.page}>
      <div style={T.headerRow}>
        <h2 style={T.h2}>Revenue Ledger</h2>
        <button onClick={() => { setForm(EMPTY); setModal(true); }} style={btn('primary')}>+ Add Entry</button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        {[['Total Income', totalIncome, '#2ecc71'], ['Total Expenses', totalExpense, '#FF8A3D'], ['Net Profit', totalIncome - totalExpense, '#2BB6A3']].map(([l, v, c]) => (
          <div key={l} style={{ ...T.card, borderBottom: `3px solid ${c}` }}>
            <div style={{ fontSize: 11, color: '#6A8A82', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{l} (YTD)</div>
            <div style={{ fontWeight: 800, fontSize: 22, background: `linear-gradient(90deg,${c},#A9C4BE)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{formatKES(v)}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ ...T.card, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#EE6100,#244A44,#2BB6A3)', opacity: 0.7 }} />
        <h3 style={{ margin: '0 0 1rem', fontSize: 14, fontWeight: 700, color: '#F4F1EA' }}>Monthly Revenue vs Expenses</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,241,234,0.05)" />
            <XAxis dataKey="name" tick={{ fill: '#6A8A82', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fill: '#6A8A82', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#A9C4BE' }} />
            <Bar dataKey="income"  fill="#2ecc71" name="Income"  radius={[4,4,0,0]} opacity={0.9} />
            <Bar dataKey="expense" fill="#FF8A3D" name="Expense" radius={[4,4,0,0]} opacity={0.9} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['', 'income', 'expense'].map((t) => <button key={t} onClick={() => { setType(t); setPage(1); }} style={tabPill(type === t)}>{t || 'All'}</button>)}
      </div>

      {loading ? <Spinner /> : entries.length === 0 ? <EmptyState icon="💰" message="No entries found" /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={T.table}>
            <thead><tr style={T.thead}>
              {['Date', 'Type', 'Category', 'Description', 'Amount', 'Method', 'Ref', ''].map((h) => <th key={h} style={T.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e._id} style={T.trHover}>
                  <td style={T.td}>{formatDate(e.date)}</td>
                  <td style={T.td}><span style={{ color: e.type === 'income' ? '#2ecc71' : '#FF8A3D', fontWeight: 600, textTransform: 'capitalize' }}>{e.type}</span></td>
                  <td style={T.td}>{e.category}</td>
                  <td style={T.td}>{e.description}</td>
                  <td style={{ ...T.td, fontWeight: 700, color: '#F4F1EA' }}>{formatKES(e.amount)}</td>
                  <td style={T.td}>{e.paymentMethod || '—'}</td>
                  <td style={T.td}>{e.reference || '—'}</td>
                  <td style={T.td}><button onClick={() => del(e._id)} style={btnSm('danger')}>Del</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {page > 1 && <button onClick={() => setPage(p => p - 1)} style={btn('ghost')}>← Prev</button>}
        {entries.length === 30 && <button onClick={() => setPage(p => p + 1)} style={btn('ghost')}>Next →</button>}
      </div>

      {modal && (
        <div style={T.overlay}>
          <div style={T.modal}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#EE6100,#244A44,#2BB6A3)', borderRadius: '14px 14px 0 0' }} />
            <h3 style={T.modalH3}>Add Revenue Entry</h3>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={T.label}>Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={T.input}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label style={T.label}>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={T.input}>
                    {CATS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={T.label}>Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required style={T.input} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={T.label}>Amount (KES)</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min={0} style={T.input} /></div>
                <div><label style={T.label}>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required style={T.input} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={T.label}>Payment Method</label>
                  <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} style={T.input}>
                    {['cash', 'mpesa', 'bank'].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div><label style={T.label}>Reference</label><input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} style={T.input} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModal(false)} style={btn('ghost')}>Cancel</button>
                <button type="submit" disabled={saving} style={btn('primary')}>{saving ? 'Saving...' : 'Add Entry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
