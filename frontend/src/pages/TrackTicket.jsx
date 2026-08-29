import React, { useState } from 'react';

export default function TrackTicket() {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);

  const onTrack = async (e) => {
    e.preventDefault();
    setError('');
    setTicket(null);

    const ref = referenceNumber.trim();
    if (!ref) {
      setError('Enter a ticket reference number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/tickets/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceNumber: ref }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Failed to track ticket.');
        return;
      }

      setTicket(data?.ticket || null);
      if (!data?.ticket) setError('Ticket not found.');
    } catch (err) {
      setError('Network error while tracking ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <h2>Track Your Support Ticket</h2>
      <p style={{ opacity: 0.8 }}>
        Enter your ticket reference number to see the current status.
      </p>

      <form onSubmit={onTrack} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          placeholder="e.g. RTS-..."
          style={{ flex: 1, padding: 10 }}
        />
        <button type="submit" disabled={loading} style={{ padding: '10px 16px' }}>
          {loading ? 'Tracking...' : 'Track'}
        </button>
      </form>

      {error ? (
        <div style={{ marginTop: 12, color: '#b91c1c', background: '#fee2e2', padding: 12, borderRadius: 8 }}>
          {error}
        </div>
      ) : null}

      {ticket ? (
        <div style={{ marginTop: 16, border: '1px solid #e5e7eb', padding: 16, borderRadius: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Status</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Reference</div>
              <div style={{ fontWeight: 600 }}>{ticket.ticketId}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Department</div>
              <div style={{ fontWeight: 600 }}>{ticket.departmentSlug}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Title</div>
              <div style={{ fontWeight: 600 }}>{ticket.title}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Priority</div>
              <div style={{ fontWeight: 600 }}>{ticket.priority}</div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Current status</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{ticket.status}</div>
          </div>

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
            Updated: {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : '—'}
          </div>
        </div>
      ) : null}
    </div>
  );
}

