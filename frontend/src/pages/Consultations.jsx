// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { formatKES, formatDate } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';
import { Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';
import { T, btn, tabPill } from '../utils/theme';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function Consultations() {
  const [consultations, setConsultations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [notesModal, setNotesModal] = useState(null);
  const [notes, setNotes] = useState({ consultantNotes: '', clientSummary: '', followUpRequired: false });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/consultations', { params: { status, page, limit: 20 } });
    setConsultations(data.consultations); setTotal(data.total);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [status, page]);

  const action = async (id, endpoint) => {
    await api.put(`/consultations/${id}/${endpoint}`);
    toast.success(`Consultation ${endpoint}ed`); load();
  };

  const saveNotes = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.put(`/consultations/${notesModal._id}/complete`, notes);
      toast.success('Session completed & notes saved'); setNotesModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  return (
    <div style={T.page}>
      <div style={T.headerRow}>
        <h2 style={T.h2}>Consultations ({total})</h2>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['', ...STATUSES].map((s) => <button key={s} onClick={() => { setStatus(s); setPage(1); }} style={tabPill(status === s)}>{s || 'All'}</button>)}
      </div>

      {loading ? <Spinner /> : consultations.length === 0 ? <EmptyState icon="💬" message="No consultations found" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {consultations.map((c) => (
            <div key={c._id} style={{ ...T.card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: '#F4F1EA', fontSize: 15, fontFamily: "'Poppins',sans-serif" }}>{c.client?.name}</span>
                  <StatusBadge status={c.status} />
                  <StatusBadge status={c.paymentStatus} />
                </div>
                <div style={{ fontSize: 12, color: '#6A8A82', marginBottom: 4, fontFamily: "'Inter',sans-serif" }}>{c.client?.phone} · {c.client?.email}</div>
                <div style={{ fontSize: 13, color: '#A9C4BE', marginBottom: 2, fontFamily: "'Inter',sans-serif" }}>
                  <span style={{ color: '#6A8A82' }}>Type:</span> {c.consultationType} &nbsp;·&nbsp;
                  <span style={{ color: '#6A8A82' }}>Duration:</span> {c.duration}min &nbsp;·&nbsp;
                  <span style={{ color: '#6A8A82' }}>Medium:</span> {c.medium}
                </div>
                <div style={{ fontSize: 13, color: '#A9C4BE', marginBottom: 2, fontFamily: "'Inter',sans-serif" }}><span style={{ color: '#6A8A82' }}>Topic:</span> {c.topic}</div>
                <div style={{ fontSize: 13, color: '#A9C4BE', fontFamily: "'Inter',sans-serif" }}>
                  <span style={{ color: '#6A8A82' }}>Date:</span> {formatDate(c.preferredDate)} &nbsp;·&nbsp;
                  <span style={{ color: '#6A8A82' }}>Fee:</span> <span style={{ color: '#F4F1EA', fontWeight: 600 }}>{formatKES(c.fee)}</span>
                </div>
                {c.description && <div style={{ fontSize: 12, color: '#6A8A82', marginTop: 6, fontFamily: "'Inter',sans-serif" }}>{c.description}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {c.status === 'pending' && <button onClick={() => action(c._id, 'confirm')} style={btn('blue')}>Confirm</button>}
                {c.status === 'confirmed' && <button onClick={() => { setNotes({ consultantNotes: c.consultantNotes || '', clientSummary: c.clientSummary || '', followUpRequired: c.followUpRequired || false }); setNotesModal(c); }} style={btn('green')}>Complete</button>}
                {['pending', 'confirmed'].includes(c.status) && <button onClick={() => action(c._id, 'cancel')} style={btn('danger')}>Cancel</button>}
                {c.status === 'completed' && <button onClick={() => { setNotes({ consultantNotes: c.consultantNotes || '', clientSummary: c.clientSummary || '', followUpRequired: c.followUpRequired || false }); setNotesModal(c); }} style={btn('ghost')}>View Notes</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {page > 1 && <button onClick={() => setPage(p => p - 1)} style={btn('ghost')}>← Prev</button>}
        {consultations.length === 20 && <button onClick={() => setPage(p => p + 1)} style={btn('ghost')}>Next →</button>}
      </div>

      {notesModal && (
        <div style={T.overlay}>
          <div style={T.modal}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#27ae60,#2ecc71)', borderRadius: '14px 14px 0 0' }} />
            <h3 style={T.modalH3}>Session Notes — {notesModal.client?.name}</h3>
            <form onSubmit={saveNotes} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={T.label}>Consultant Notes (internal)</label><textarea value={notes.consultantNotes} onChange={(e) => setNotes({ ...notes, consultantNotes: e.target.value })} rows={4} style={{ ...T.input, resize: 'vertical' }} /></div>
              <div><label style={T.label}>Client Summary (emailed to client)</label><textarea value={notes.clientSummary} onChange={(e) => setNotes({ ...notes, clientSummary: e.target.value })} rows={4} style={{ ...T.input, resize: 'vertical' }} /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#A9C4BE', fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
                <input type="checkbox" checked={notes.followUpRequired} onChange={(e) => setNotes({ ...notes, followUpRequired: e.target.checked })} />
                Follow-up session required
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setNotesModal(null)} style={btn('ghost')}>Cancel</button>
                <button type="submit" disabled={saving} style={btn('green')}>{saving ? 'Saving...' : 'Save & Complete'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
