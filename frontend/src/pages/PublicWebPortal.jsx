import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, publicApi } from '../utils/api';

const styles = {
  wrap: { minHeight: '100vh', background: '#081916', color: '#c0d8f0', fontFamily: "'Inter',sans-serif" },
  card: {
    maxWidth: 860,
    margin: '0 auto',
    padding: '1.5rem',
  },
  header: {
    background: 'linear-gradient(90deg,#0B1F1B,#0F2620)',
    borderBottom: '1px solid rgba(238,97,0,0.12)',
    padding: '0.9rem 1rem',
    position: 'sticky',
    top: 0,
  },
  title: { fontSize: 14, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 },
  subtitle: { fontSize: 11, color: '#4a6a8a', marginTop: 4 },
  panel: {
    background: '#0B1F1B',
    border: '1px solid rgba(238,97,0,0.12)',
    borderRadius: 12,
    padding: '1rem',
    marginTop: '1rem',
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label: { fontSize: 10, color: '#A9C4BE', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 800 },
  value: { fontSize: 13, color: '#F4F1EA', fontWeight: 700, marginTop: 4 },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 },
  btn: {
    padding: '0.45rem 1rem',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
};

function statusAccent(status) {
  if (!status) return '#EE6100';
  const map = {
    proposal: '#ffd700',
    active: '#EE6100',
    review: '#a78bfa',
    delivered: '#00ff88',
    'on-hold': '#ff8800',
    cancelled: '#ff3366',
  };
  return map[status] || '#EE6100';
}

export default function PublicWebPortal() {
  const { projectToken } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);

  useEffect(() => {
    let alive = true;
    async function run() {
      try {
        setLoading(true);
        setError('');

        const res = await publicApi.get(`/dept/projects/token/${encodeURIComponent(projectToken)}`);
        // If endpoint returns {project} or direct project, normalize
        const data = res.data;
        const p = data?.project || data;
        if (alive) setProject(p);
      } catch (e) {
        if (!alive) return;
        setError(e.response?.data?.message || 'Failed to load project');
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [projectToken]);

  if (loading) {
    return (
      <div style={styles.wrap}>
        <div style={{ ...styles.card, paddingTop: 60, textAlign: 'center' }}>Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={{ ...styles.panel, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Project Not Available</div>
            <div style={{ fontSize: 12, color: '#A9C4BE', marginBottom: 14 }}>{error}</div>
            <button
              style={{ ...styles.btn, background: 'rgba(238,97,0,0.12)', border: '1px solid rgba(238,97,0,0.35)', color: '#EE6100' }}
              onClick={() => navigate('/store')}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={{ ...styles.panel, textAlign: 'center' }}>No project found.</div>
        </div>
      </div>
    );
  }

  const accent = statusAccent(project.status);

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div style={styles.title}>RUAI TECH — WEB PROJECT PORTAL</div>
        <div style={styles.subtitle}>Secure token access (no login required)</div>
      </div>

      <div style={styles.card}>
        <div style={styles.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#F4F1EA' }}>{project.projectName || 'Project'}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#A9C4BE' }}>
                Client: <span style={{ color: '#c0d8f0', fontWeight: 800 }}>{project.clientName}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 99, border: `1px solid ${accent}55`, background: `${accent}22`, color: accent, fontWeight: 900, fontSize: 11 }}>
                {project.status}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#A9C4BE' }}>
                Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString('en-KE') : '—'}
              </div>
            </div>
          </div>

          <div style={styles.grid}>
            <div>
              <div style={styles.label}>Project Type</div>
              <div style={styles.value}>{project.projectType || '—'}</div>
            </div>
            <div>
              <div style={styles.label}>Total Value</div>
              <div style={styles.value}>{project.totalValue ? `KES ${Number(project.totalValue).toLocaleString()}` : '—'}</div>
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#EE6100', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Milestone Progress
          </div>

          {Array.isArray(project.milestones) && project.milestones.length ? (
            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {project.milestones.map((m, idx) => (
                <div key={idx} style={{ border: '1px solid rgba(238,97,0,0.12)', background: '#0B1F1B', borderRadius: 10, padding: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#F4F1EA' }}>{m.title || `Milestone ${idx + 1}`}</div>
                      <div style={{ fontSize: 11, color: '#A9C4BE', marginTop: 4, lineHeight: 1.4 }}>{m.description || ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: '#A9C4BE', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 900 }}>Status</div>
                      <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: statusAccent(m.status) }}>{m.status || 'pending'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: '#4a6a8a' }}>
                    <div>Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString('en-KE') : '—'}</div>
                    <div>Amount: {typeof m.amount === 'number' ? `KES ${m.amount.toLocaleString()}` : '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 12, fontSize: 12, color: '#A9C4BE' }}>No milestones configured yet.</div>
          )}
        </div>

        <div style={styles.panel}>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#00ff88', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Delivery & Approval
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#A9C4BE', lineHeight: 1.5 }}>
            This portal is currently read-only for milestones. Digital signature + proposal-to-project conversion can be added once the back-end has proposal objects or signature capture endpoints.
          </div>
        </div>
      </div>
    </div>
  );
}

