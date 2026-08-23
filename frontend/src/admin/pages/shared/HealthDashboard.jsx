// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — API Health Monitoring Dashboard with real-time polling
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../../utils/api';

// ── Stat Card ──────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = '#EE6100', icon, pulse }) {
  return (
    <div style={{
      background: '#0B1F1B', border: '1px solid rgba(36,74,68,0.3)',
      borderRadius: 8, padding: '16px 18px', position: 'relative', overflow: 'hidden',
    }}>
      {pulse && <div style={{
        position: 'absolute', top: 10, right: 10, width: 8, height: 8,
        borderRadius: '50%', background: color,
        boxShadow: `0 0 12px ${color}80`,
        animation: 'pcl-breathe 2.4s ease-in-out infinite',
      }} />}
      <div style={{ fontSize: 10, color: '#6A8A82', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace", marginBottom: 8 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "'Rajdhani',sans-serif", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#A9C4BE', marginTop: 4, fontFamily: "'Share Tech Mono',monospace" }}>{sub}</div>}
    </div>
  );
}

// ── Status Bar (visual progress) ──────────────────────────────────
function StatusBar({ label, value, max, color = '#EE6100', unit = '' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const barColor = pct > 85 ? '#FF3366' : pct > 60 ? '#FFB020' : color;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#A9C4BE', fontFamily: "'Share Tech Mono',monospace" }}>{label}</span>
        <span style={{ fontSize: 11, color: barColor, fontFamily: "'Share Tech Mono',monospace" }}>{value}{unit} / {max}{unit}</span>
      </div>
      <div style={{ height: 6, background: '#081916', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}CC)`,
          borderRadius: 3, transition: 'width 0.5s ease',
          boxShadow: `0 0 8px ${barColor}40`,
        }} />
      </div>
    </div>
  );
}

// ── Mini Table ────────────────────────────────────────────────────
function MiniTable({ headers, rows, emptyText = 'No data' }) {
  if (!rows.length) return <div style={{ fontSize: 12, color: '#6A8A82', padding: 12, textAlign: 'center' }}>{emptyText}</div>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>{headers.map((h, i) => (
            <th key={i} style={{ textAlign: 'left', padding: '6px 8px', color: '#6A8A82', borderBottom: '1px solid rgba(36,74,68,0.3)', fontFamily: "'Share Tech Mono',monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(36,74,68,0.15)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '6px 8px', color: '#F4F1EA', fontFamily: "'Share Tech Mono',monospace" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function HealthDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pollInterval, setPollInterval] = useState(5);
  const [lastPoll, setLastPoll] = useState(null);
  const timerRef = useRef(null);

  const fetchHealth = useCallback(async () => {
    try {
      const { data: res } = await api.get('/health/detail');
      setData(res);
      setError(null);
      setLastPoll(new Date());
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    timerRef.current = setInterval(fetchHealth, pollInterval * 1000);
    return () => clearInterval(timerRef.current);
  }, [fetchHealth, pollInterval]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#A9C4BE' }}>Loading health data...</div>;

  if (error && !data) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 20, color: '#FF3366', marginBottom: 8 }}>⚠ Connection Error</div>
      <div style={{ fontSize: 12, color: '#A9C4BE' }}>{error}</div>
      <button onClick={fetchHealth} style={{ marginTop: 16, padding: '8px 20px', background: '#EE6100', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Retry</button>
    </div>
  );

  const { db, uptime, memory, requests, responseTime, system, topErrorRoutes, topSlowRoutes, recentErrors } = data || {};
  const statusColor = data?.status === 'ok' ? '#00FF88' : data?.status === 'degraded' ? '#FFB020' : '#FF3366';

  return (
    <div style={{ fontFamily: "'Poppins',sans-serif" }}>
      {/* ── Global CSS ── */}
      <style>{`
        @keyframes pcl-breathe { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .health-poll-btn { transition: all 0.2s; }
        .health-poll-btn:hover { background: rgba(238,97,0,0.15) !important; }
        .health-poll-btn.active { background: rgba(238,97,0,0.25) !important; border-color: #EE6100 !important; color: #EE6100 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%', background: statusColor,
            boxShadow: `0 0 16px ${statusColor}60`,
            animation: 'pcl-breathe 2.4s ease-in-out infinite',
          }} />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.08em' }}>
            ◈ API HEALTH MONITOR
          </h2>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 4,
            background: `${statusColor}20`, color: statusColor,
            fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.1em',
          }}>
            {data?.status?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: '#6A8A82', fontFamily: "'Share Tech Mono',monospace" }}>POLL:</span>
          {[5, 10, 30].map(s => (
            <button key={s} onClick={() => setPollInterval(s)}
              className={`health-poll-btn ${pollInterval === s ? 'active' : ''}`}
              style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 4,
                background: 'transparent', border: '1px solid rgba(36,74,68,0.3)',
                color: pollInterval === s ? '#EE6100' : '#6A8A82',
                cursor: 'pointer', fontFamily: "'Share Tech Mono',monospace",
              }}>
              {s}s
            </button>
          ))}
          <button onClick={fetchHealth} style={{
            fontSize: 10, padding: '3px 10px', borderRadius: 4,
            background: 'rgba(238,97,0,0.1)', border: '1px solid rgba(238,97,0,0.3)',
            color: '#EE6100', cursor: 'pointer', fontFamily: "'Share Tech Mono',monospace",
          }}>↻ REFRESH</button>
        </div>
      </div>

      {lastPoll && (
        <div style={{ fontSize: 10, color: '#6A8A82', fontFamily: "'Share Tech Mono',monospace", marginBottom: 20 }}>
          Last updated: {lastPoll.toLocaleTimeString()} · Node {system?.nodeVersion} · {system?.platform}/{system?.arch}
        </div>
      )}

      {/* ── Top Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="Uptime" value={uptime?.formatted || '—'} sub={`Since ${new Date(uptime?.startedAt).toLocaleDateString()}`} color="#00FF88" icon="⏱" pulse />
        <StatCard label="DB Status" value={db?.connected ? 'Connected' : 'Down'} sub={`${db?.name}@${db?.host}`} color={db?.connected ? '#00FF88' : '#FF3366'} icon="🗄" pulse={!db?.connected} />
        <StatCard label="Total Requests" value={requests?.total?.toLocaleString() || '0'} sub={`${requests?.active || 0} active now`} color="#EE6100" icon="📊" />
        <StatCard label="Error Rate" value={requests?.errorRate || '0%'} sub={`${requests?.errors || 0} errors`} color={parseFloat(requests?.errorRate) > 5 ? '#FF3366' : parseFloat(requests?.errorRate) > 1 ? '#FFB020' : '#00FF88'} icon="⚠" />
        <StatCard label="Avg Response" value={`${responseTime?.avg || 0}ms`} sub={`P50: ${responseTime?.p50 || 0}ms · P95: ${responseTime?.p95 || 0}ms`} color="#2BB6A3" icon="⚡" />
        <StatCard label="Memory" value={memory?.heapUsedFormatted || '—'} sub={`Heap: ${memory?.heapTotalFormatted || '—'} · RSS: ${memory?.rssFormatted || '—'}`} color="#a78bfa" icon="💾" />
      </div>

      {/* ── Memory & System Bars ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#0B1F1B', border: '1px solid rgba(36,74,68,0.3)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, color: '#6A8A82', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace", marginBottom: 12 }}>
            💾 MEMORY USAGE
          </div>
          <StatusBar label="Heap Used" value={memory?.heapUsed || 0} max={memory?.heapTotal || 1} color="#a78bfa" unit=" MB" />
          <StatusBar label="RSS" value={memory?.rss || 0} max={Math.max(memory?.rss || 1, 256)} color="#2BB6A3" unit=" MB" />
          <StatusBar label="External" value={memory?.external || 0} max={Math.max(memory?.external || 1, 64)} color="#FFB020" unit=" MB" />
        </div>
        <div style={{ background: '#0B1F1B', border: '1px solid rgba(36,74,68,0.3)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, color: '#6A8A82', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace", marginBottom: 12 }}>
            🖥 SYSTEM
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['CPU Cores', system?.cpuCount],
              ['Load Avg', system?.loadAverage?.join(' / ')],
              ['Free RAM', system?.freeMemory],
              ['Total RAM', system?.totalMemory],
              ['Platform', `${system?.platform}/${system?.arch}`],
              ['Node.js', system?.nodeVersion],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: '6px 8px', background: '#081916', borderRadius: 4 }}>
                <div style={{ fontSize: 9, color: '#6A8A82', fontFamily: "'Share Tech Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k}</div>
                <div style={{ fontSize: 12, color: '#F4F1EA', fontFamily: "'Share Tech Mono',monospace", marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Status Codes & Response Time ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#0B1F1B', border: '1px solid rgba(36,74,68,0.3)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, color: '#6A8A82', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace", marginBottom: 12 }}>
            📊 STATUS CODE DISTRIBUTION
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(requests?.statusCodes || {}).sort(([a], [b]) => a - b).map(([code, count]) => {
              const c = code.startsWith('2') ? '#00FF88' : code.startsWith('3') ? '#2BB6A3' : code.startsWith('4') ? '#FFB020' : '#FF3366';
              return (
                <div key={code} style={{
                  padding: '8px 14px', borderRadius: 6,
                  background: `${c}15`, border: `1px solid ${c}30`,
                  textAlign: 'center', minWidth: 60,
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: c, fontFamily: "'Rajdhani',sans-serif" }}>{count}</div>
                  <div style={{ fontSize: 9, color: c, fontFamily: "'Share Tech Mono',monospace" }}>{code}</div>
                </div>
              );
            })}
            {Object.keys(requests?.statusCodes || {}).length === 0 && (
              <div style={{ fontSize: 12, color: '#6A8A82', padding: 12 }}>No requests yet</div>
            )}
          </div>
        </div>
        <div style={{ background: '#0B1F1B', border: '1px solid rgba(36,74,68,0.3)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, color: '#6A8A82', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace", marginBottom: 12 }}>
            ⚡ RESPONSE TIME PERCENTILES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              ['AVG', responseTime?.avg, '#2BB6A3'],
              ['P50', responseTime?.p50, '#00FF88'],
              ['P95', responseTime?.p95, '#FFB020'],
              ['P99', responseTime?.p99, '#FF3366'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ textAlign: 'center', padding: '10px 6px', background: '#081916', borderRadius: 6 }}>
                <div style={{ fontSize: 9, color: '#6A8A82', fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.1em' }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "'Rajdhani',sans-serif", marginTop: 4 }}>{val || 0}<span style={{ fontSize: 10 }}>ms</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Database Collections ── */}
      {db?.collections && Object.keys(db.collections).length > 0 && (
        <div style={{ background: '#0B1F1B', border: '1px solid rgba(36,74,68,0.3)', borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: '#6A8A82', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace", marginBottom: 12 }}>
            🗄 DATABASE COLLECTIONS
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(db.collections).map(([name, count]) => (
              <div key={name} style={{
                padding: '6px 12px', borderRadius: 4,
                background: 'rgba(43,182,163,0.08)', border: '1px solid rgba(43,182,163,0.2)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 11, color: '#A9C4BE', fontFamily: "'Share Tech Mono',monospace" }}>{name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2BB6A3', fontFamily: "'Rajdhani',sans-serif" }}>{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tables: Errors & Slow Routes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#0B1F1B', border: '1px solid rgba(36,74,68,0.3)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, color: '#FF3366', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace", marginBottom: 12 }}>
            ⚠ TOP ERROR ROUTES
          </div>
          <MiniTable
            headers={['Route', 'Errors', 'Requests', 'Rate', 'Avg']}
            rows={(topErrorRoutes || []).map(r => [
              <span style={{ color: '#FFB020' }}>{r.route}</span>,
              <span style={{ color: '#FF3366', fontWeight: 700 }}>{r.errors}</span>,
              r.count,
              r.errorRate,
              `${r.avgMs}ms`,
            ])}
            emptyText="No errors recorded"
          />
        </div>
        <div style={{ background: '#0B1F1B', border: '1px solid rgba(36,74,68,0.3)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, color: '#FFB020', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace", marginBottom: 12 }}>
            🐌 TOP SLOW ROUTES
          </div>
          <MiniTable
            headers={['Route', 'Avg', 'Requests', 'Errors']}
            rows={(topSlowRoutes || []).map(r => [
              <span style={{ color: '#FFB020' }}>{r.route}</span>,
              <span style={{ color: r.avgMs > 1000 ? '#FF3366' : r.avgMs > 500 ? '#FFB020' : '#00FF88', fontWeight: 700 }}>{r.avgMs}ms</span>,
              r.count,
              r.errors > 0 ? <span style={{ color: '#FF3366' }}>{r.errors}</span> : <span style={{ color: '#00FF88' }}>0</span>,
            ])}
            emptyText="No routes recorded"
          />
        </div>
      </div>

      {/* ── Recent Errors Log ── */}
      {recentErrors?.length > 0 && (
        <div style={{ background: '#0B1F1B', border: '1px solid rgba(36,74,68,0.3)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, color: '#FF3366', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace", marginBottom: 12 }}>
            📋 RECENT ERRORS (LAST {recentErrors.length})
          </div>
          <MiniTable
            headers={['Time', 'Method', 'Path', 'Status', 'Duration']}
            rows={recentErrors.slice().reverse().map(e => [
              new Date(e.timestamp).toLocaleTimeString(),
              <span style={{ color: e.method === 'GET' ? '#2BB6A3' : e.method === 'POST' ? '#FFB020' : '#a78bfa', fontWeight: 600 }}>{e.method}</span>,
              <span style={{ color: '#FFB020', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>{e.path}</span>,
              <span style={{ color: e.status >= 500 ? '#FF3366' : '#FFB020', fontWeight: 700 }}>{e.status}</span>,
              <span style={{ color: e.duration > 1000 ? '#FF3366' : '#A9C4BE' }}>{e.duration}ms</span>,
            ])}
            emptyText="No errors"
          />
        </div>
      )}
    </div>
  );
}
