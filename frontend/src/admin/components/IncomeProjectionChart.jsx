// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { api } from '../../utils/api';
import { formatKES } from '../../utils/helpers';
import { Spinner } from '../../components/UI';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0F2620', border: '1px solid rgba(238,97,0,0.3)', borderRadius: 6, padding: '0.75rem 1rem', fontSize: 12 }}>
      <p style={{ color: '#EE6100', fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>{p.name}: {formatKES(p.value)}</p>)}
    </div>
  );
};

export default function IncomeProjectionChart({
  departmentId = null,
  departmentLabel = 'All Departments',
  range = 'monthly',
  showDepartmentBreakdown = false,
  currency = 'KES',
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('bar'); // bar | line
  const [year, setYear] = useState(new Date().getFullYear());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { range, year };
      if (departmentId) params.departmentId = departmentId;
      const { data: res } = await api.get('/finance/income', { params });
      setData(res);
    } catch (err) {
    }
    setLoading(false);
  }, [departmentId, range, year]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (!data) return <p style={{ color: '#6A8A82', textAlign: 'center' }}>No data available</p>;

  const { chartData, totalIncome, totalExpense, netProfit, growthRate } = data;

  return (
    <div style={{ background: 'linear-gradient(160deg,#0F2620,#0F2620)', border: '1px solid rgba(238,97,0,0.12)', borderRadius: 8, padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#EE6100,transparent)' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a8c0d8' }}>
            ◆ {departmentLabel} — Revenue {year}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6A8A82' }}>Growth rate: <span style={{ color: Number(growthRate) >= 0 ? '#00ff88' : '#ff3366' }}>{growthRate}%</span></p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ background: '#0B1F1B', border: '1px solid rgba(238,97,0,0.2)', color: '#A9C4BE', borderRadius: 4, padding: '3px 8px', fontSize: 11 }}>
            {[2024, 2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}
          </select>
          {['bar', 'line'].map((t) => (
            <button key={t} onClick={() => setChartType(t)} style={{ padding: '3px 10px', borderRadius: 3, border: `1px solid ${chartType === t ? 'rgba(238,97,0,0.4)' : 'rgba(74,101,128,0.3)'}`, background: chartType === t ? 'rgba(238,97,0,0.08)' : 'transparent', color: chartType === t ? '#EE6100' : '#6A8A82', cursor: 'pointer', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: '1rem' }}>
        {[['Income', totalIncome, '#00ff88'], ['Expenses', totalExpense, '#ff3366'], ['Net Profit', netProfit, '#EE6100']].map(([l, v, c]) => (
          <div key={l} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '0.6rem', borderBottom: `2px solid ${c}` }}>
            <div style={{ fontSize: 9, color: '#6A8A82', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{l}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: c, marginTop: 2 }}>{formatKES(v)}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        {chartType === 'bar' ? (
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(238,97,0,0.06)" />
            <XAxis dataKey="name" tick={{ fill: '#6A8A82', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fill: '#6A8A82', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, color: '#6A8A82', letterSpacing: '0.08em', textTransform: 'uppercase' }} />
            <Bar dataKey="income"  fill="#00ff88" name="Income"  radius={[3,3,0,0]} opacity={0.85} />
            <Bar dataKey="expense" fill="#ff3366" name="Expense" radius={[3,3,0,0]} opacity={0.85} />
            {chartData.some((d) => d.target > 0) && <Bar dataKey="target" fill="#ffd700" name="Target" radius={[3,3,0,0]} opacity={0.4} />}
          </BarChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(238,97,0,0.06)" />
            <XAxis dataKey="name" tick={{ fill: '#6A8A82', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fill: '#6A8A82', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, color: '#6A8A82', letterSpacing: '0.08em', textTransform: 'uppercase' }} />
            <Line type="monotone" dataKey="income"  stroke="#00ff88" strokeWidth={2} dot={{ fill: '#00ff88', r: 3 }} name="Income" />
            <Line type="monotone" dataKey="expense" stroke="#ff3366" strokeWidth={2} dot={{ fill: '#ff3366', r: 3 }} name="Expense" />
            <Line type="monotone" dataKey="target"  stroke="#ffd700" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Target" />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
