// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
//
// FIX (Continuity Audit, Part One, Exhibit B): this page used to call only
// `api.post('/chat/admin/status', ...)` — a REST call that flips a server-side
// availability *preference* flag without ever opening a Socket.IO connection.
// `presenceManager.isAnyAdminOnline()` requires BOTH a live socket AND that
// flag, so the green "ONLINE" badge here was lying: customers had no way to
// reach you unless you *also* happened to have ChatMonitor or MessagesPage
// open in another tab holding the real connection.
//
// This page now opens its own real connection via useChat() — the same
// hook ChatMonitor.js and MessagesPage.js already use correctly — so the
// toggle has something genuine to attach to, and "ONLINE" only ever shows
// when it's actually true.
import React, { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { api } from '../utils/api';

const AdminChatControl = () => {
  const authToken = localStorage.getItem('adminToken');
  const { connected, adminOnline, requestAdminStatusUpdate } = useChat({ authToken });
  const [availability, setAvailability] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current admin status
  useEffect(() => {
    const fetchAdminStatus = async () => {
      if (!authToken) return;
      
      try {
        setLoading(true);
        const response = await api.get('/chat/admin/status');
        if (response.data.success) {
          setAvailability(response.data.status);
        }
      } catch (err) {
        console.error('Error fetching admin status:', err);
        setError('Failed to fetch admin status');
      } finally {
        setLoading(false);
      }
    };

    if (connected) {
      fetchAdminStatus();
    }
  }, [authToken, connected]);

  // Update admin availability
  const updateAdminAvailability = async (newStatus) => {
    if (!authToken) return;
    
    try {
      setLoading(true);
      const response = await api.patch('/chat/admin/status', { status: newStatus });
      if (response.data.success) {
        setAvailability(newStatus);
        // The useChat hook will automatically receive the updated status via socket
      }
    } catch (err) {
      console.error('Error updating admin status:', err);
      setError('Failed to update admin status');
    } finally {
      setLoading(false);
    }
  };

  // With REST presence toggles available, online/offline is derived from both connection and availability setting
  const trulyOnline = connected && availability;

  return (
    <div style={{
      padding: '2rem',
      background: 'var(--bg-void)',
      minHeight: '100vh',
      color: 'var(--text-primary)',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        padding: '2rem',
        border: '1px solid rgba(122, 90, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 style={{
          fontSize: '1.8rem',
          margin: 0,
          color: 'var(--text-primary)',
          fontWeight: 600,
          marginBottom: '0.5rem',
          textAlign: 'center'
        }}>
          Admin Chat Control
        </h1>

        {/* Connection sub-status — this is the part that used to be invisible.
            If this reads "Connecting..." and never settles, that's the signal
            something upstream (network, auth) is wrong — rather than a badge
            that just claims ONLINE regardless. */}
        <p style={{
          textAlign: 'center',
          fontSize: '0.85rem',
          color: connected ? 'var(--color-primary)' : 'var(--color-accent)',
          marginBottom: '2rem'
        }}>
          {connected ? '● Realtime connection active' : '○ Connecting to realtime server…'}
        </p>

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            background: 'rgba(0, 212, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 212, 255, 0.15)',
            width: '100%'
          }}>
            <h2 style={{
              fontSize: '1.2rem',
              fontWeight: 600,
              margin: 0,
              marginBottom: '1rem',
              color: 'var(--color-primary)'
            }}>
              Current Status
            </h2>
            <div style={{
              fontSize: '2rem',
              fontWeight: 600,
              margin: '1rem 0',
              color: trulyOnline ? 'var(--color-primary)' : 'var(--color-accent)'
            }}>
              {trulyOnline ? 'ONLINE' : connected ? 'AVAILABILITY OFF' : 'DISCONNECTED'}
            </div>
            <p style={{
              color: 'var(--text-muted)',
              margin: 0
            }}>
              {trulyOnline
                ? 'You are connected and available to receive customer chats'
                : connected
                  ? 'Connected, but marked unavailable — toggle below to start receiving chats'
                  : 'Not connected yet — the toggle below will not take effect until the realtime connection is active'}
            </p>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '1.5rem',
            background: 'rgba(255, 20, 147, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 20, 147, 0.15)',
            width: '100%'
          }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              margin: 0,
              marginBottom: '1rem',
              color: 'var(--color-accent)'
            }}>
              Effect on Customers
            </h3>
            <p style={{
              color: 'var(--text-muted)',
              margin: 0,
              lineHeight: 1.6
            }}>
              {trulyOnline
                ? 'Customers will see that support is available and can initiate live chat sessions with you.'
                : 'Customers will be prompted to leave callback requests instead of initiating live chat sessions.'}
            </p>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '1.5rem',
            background: 'rgba(122, 90, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(122, 90, 255, 0.15)',
            width: '100%'
          }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              margin: 0,
              marginBottom: '1rem',
              color: 'var(--color-secondary)'
            }}>
              Active Chats
            </h3>
            <p style={{
              color: 'var(--text-muted)',
              margin: 0,
              lineHeight: 1.6
            }}>
              You can manage ongoing conversations regardless of your availability status, as long as this page (or another with the chat connection open) stays open.
            </p>
          </div>

          <button
            onClick={() => updateAdminAvailability(!availability)}
            disabled={!connected || loading}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: 600,
              background: trulyOnline
                ? 'linear-gradient(135deg, var(--color-primary), #00b4ff)'
                : 'linear-gradient(135deg, var(--color-accent), #ff0080)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (!connected || loading) ? 'not-allowed' : 'pointer',
              opacity: (!connected || loading) ? 0.6 : 1,
              transition: 'transform 0.2s, box-shadow 0.2s',
              minWidth: '200px'
            }}
            title={!connected ? 'Must be connected to update availability' : ''}
          >
            {loading ? 'Updating...' : trulyOnline ? 'Mark Unavailable' : 'Make Available'}
          </button>

          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: 'rgba(255, 193, 7, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 193, 7, 0.2)',
            width: '100%',
            color: 'var(--text-muted)',
            fontSize: '0.9rem'
          }}>
            <p style={{ margin: 0 }}>
              Note: Your availability status is shared across all devices on the same network.
              When you go online, all connected clients will see the updated status.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminChatControl;