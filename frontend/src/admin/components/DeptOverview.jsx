// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../utils/api';
import { formatKES } from '../../utils/helpers';
import IncomeProjectionChart from './IncomeProjectionChart';
import { Spinner } from '../../components/UI';

export default function DeptOverview({ slug, title, color = '#EE6100', departmentId, extraStats = [] }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/finance/income', { params: { departmentId, year: new Date().getFullYear() } });
      setStats(data);
    } catch { setStats(null); }
    setLoading(false);
  }, [departmentId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(238,97,0,0.08)' }}>
        <h2 style={{ margin: 0, fontSize: 18, letterSpacing: '0.08em', textTransform: 'uppercase', color }}>{title}</h2>
        <span style={{ fontSize: 10, color: '#6A8A82', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Income', value: formatKES(stats?.totalIncome || 0), accent: '#00ff88' },
          { label: 'Total Expenses', value: formatKES(stats?.totalExpense || 0), accent: '#ff3366' },
          { label: 'Net Profit', value: formatKES(stats?.netProfit || 0), accent: color },
          { label: 'Growth Rate', value: `${stats?.growthRate || 0}%`, accent: '#ffd700' },
          ...extraStats,
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ background: 'linear-gradient(160deg,#0F2620,#0F2620)', border: '1px solid rgba(238,97,0,0.1)', borderRadius: 8, padding: '1rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: accent, opacity: 0.7 }} />
            <div style={{ fontSize: 10, color: '#6A8A82', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, background: `linear-gradient(90deg,${accent},#a8c0d8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Income chart */}
      <IncomeProjectionChart departmentId={departmentId} departmentLabel={title} range="monthly" />
    </div>
  );
}
