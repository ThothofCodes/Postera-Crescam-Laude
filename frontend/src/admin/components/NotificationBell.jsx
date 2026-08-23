// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../utils/api';
import useSocket from '../../hooks/useSocket';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen]                   = useState(false);

  // ── Initial fetch ────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/notifications');
      setNotifications(Array.isArray(data) ? data : data.notifications || []);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Real-time: replace polling with Socket.io ────────────
  useSocket({
    'notification:new': (notif) => {
      setNotifications((prev) => {
        // Deduplicate by _id
        if (prev.some((n) => n._id === notif._id)) return prev;
        return [{ ...notif, isRead: false }, ...prev];
      });
    },
    'notification:broadcast': (notif) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notif._id)) return prev;
        return [{ ...notif, isRead: false }, ...prev];
      });
    },
  });

  // ── Mark read ────────────────────────────────────────────
  const markRead = async (id) => {
    try { await api.put(`/admin/notifications/${id}/read`); } catch {}
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--pcl-mist)', fontSize: 16, position: 'relative', padding: '4px',
          transition: 'var(--transition)' }}
      >
        <span style={{ animation: unread > 0 ? 'breathe 3.4s ease-in-out infinite' : 'none' }}>🔔</span>
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 0, right: 0, background: 'var(--pcl-red)',
            color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9,
            fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 6px rgba(255,59,59,0.6)' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: 36, width: 300,
          background: 'var(--pcl-void-raised)', border: '1px solid var(--border)',
          borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          zIndex: 500, maxHeight: 360, overflowY: 'auto' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)',
            fontSize: 11, color: 'var(--pcl-ink-bright)', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
            Notifications
            {unread > 0 && (
              <span style={{ fontSize: 10, color: 'var(--pcl-green)', animation: 'glow-pulse 2s ease-in-out infinite' }}>● LIVE</span>
            )}
          </div>
          {notifications.length === 0 ? (
            <p style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
              No notifications
            </p>
          ) : notifications.map((n) => (
            <div key={n._id} onClick={() => markRead(n._id)}
              style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)',
                cursor: 'pointer', background: n.isRead ? 'transparent' : 'rgba(43,182,163,0.04)',
                transition: 'background 0.15s' }}>
              <div style={{ fontSize: 12, fontWeight: n.isRead ? 400 : 700,
                color: n.isRead ? 'var(--text-muted)' : 'var(--pcl-text)' }}>{n.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
