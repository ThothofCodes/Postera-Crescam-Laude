// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
//
// Phase 9 market research, Tier 1 #4 — the real implementation of the
// "Pulse" concept from PCL_CONTINUITY_AUDIT.md Part Six. The
// backend half (presence.manager.js department scoping, the
// 'presence:get-beacons' request/response event, and 'admin:status:dept'
// push) was built in Phase 9; this is the frontend half that actually
// renders it, using useChat()'s existing socket connection rather than
// opening a second one.
import React, { useEffect, useState, useCallback } from 'react';
import { useChat } from '../hooks/useChat';

const DEPARTMENTS = [
  { slug: 'internet',      label: 'Internet Distribution', icon: '📡' },
  { slug: 'webdev',        label: 'Web Development',       icon: '💻' },
  { slug: 'playstation',   label: 'PlayStation Arena',     icon: '🎮' },
  { slug: 'repair',        label: 'Hardware Repair',       icon: '🔧' },
  { slug: 'cybersecurity', label: 'Cybersecurity',         icon: '🛡️' },
  { slug: 'govadmin',      label: 'Government Admin',      icon: '🏛️' },
];

export default function PulseBoard({ authToken = null }) {
  const { socket, connected } = useChat({ authToken });
  const [beacons, setBeacons] = useState(
    DEPARTMENTS.map((d) => ({ department: d.slug, online: false, coveredBySuperAdmin: false }))
  );

  const refresh = useCallback(() => {
    if (!socket || !connected) return;
    socket.emit('presence:get-beacons', DEPARTMENTS.map((d) => d.slug), (ack) => {
      if (ack?.success) setBeacons(ack.beacons);
    });
  }, [socket, connected]);

  useEffect(() => {
    if (!socket) return;
    refresh();

    // Live updates pushed by socket.js whenever any admin connects/disconnects
    // for a specific department — see admin:status:dept in backend/socket.js.
    const onDeptStatus = ({ departmentSlug, online }) => {
      setBeacons((prev) =>
        prev.map((b) => (b.department === departmentSlug ? { ...b, online } : b))
      );
    };
    socket.on('admin:status:dept', onDeptStatus);
    // A global status flip (e.g. SUPER_ADMIN connecting, which covers every
    // department per the highest-clearance rule) means a full re-fetch is
    // simpler and more correct than guessing which beacons changed.
    socket.on('admin:status', refresh);

    return () => {
      socket.off('admin:status:dept', onDeptStatus);
      socket.off('admin:status', refresh);
    };
  }, [socket, refresh]);

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid rgba(122, 90, 255, 0.2)',
      borderRadius: '12px',
      padding: '1.25rem',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '1rem',
      }}>
        <h3 style={{
          margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: '0.95rem',
          fontWeight: 600, color: 'var(--text-primary)',
        }}>
          Pulse — Department Coverage
        </h3>
        <span style={{ fontSize: '0.7rem', color: connected ? 'var(--color-primary)' : 'var(--color-accent)' }}>
          {connected ? '● live' : '○ connecting…'}
        </span>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem',
      }}>
        {DEPARTMENTS.map((dept) => {
          const beacon = beacons.find((b) => b.department === dept.slug);
          const online = !!beacon?.online;
          return (
            <div key={dept.slug} style={{
              textAlign: 'center', padding: '0.85rem 0.5rem',
              borderRadius: '10px',
              background: online ? 'rgba(0, 212, 255, 0.07)' : 'rgba(74, 106, 138, 0.05)',
              border: `1px solid ${online ? 'rgba(0, 212, 255, 0.35)' : 'rgba(74, 106, 138, 0.2)'}`,
              transition: 'all 0.3s ease',
            }}>
              <div style={{
                fontSize: '1.4rem', marginBottom: '0.35rem',
                filter: online ? 'none' : 'grayscale(1) opacity(0.5)',
              }}>
                {dept.icon}
              </div>
              <div style={{
                fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)',
                marginBottom: '0.25rem', lineHeight: 1.25,
              }}>
                {dept.label}
              </div>
              <div style={{
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em',
                color: online ? 'var(--color-primary)' : 'var(--text-muted)',
              }}>
                {online ? (beacon?.coveredBySuperAdmin ? 'ONLINE (SUPER ADMIN)' : 'ONLINE') : 'OFFLINE'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
