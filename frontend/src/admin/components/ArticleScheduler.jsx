// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Article Scheduler: Set future publish dates for Tech Hub articles
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

export default function ArticleScheduler({ article, onSchedule, onCancel }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [loading, setLoading] = useState(false);

  // Get minimum date (now + 5 minutes)
  const getMinDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 10);
  };

  // Get minimum time for today
  const getMinTime = () => {
    if (date !== getMinDate()) return '00:00';
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toTimeString().slice(0, 5);
  };

  const handleSchedule = async () => {
    if (!date) {
      toast.error('Please select a date');
      return;
    }

    const scheduledDate = new Date(`${date}T${time}:00`);
    if (scheduledDate <= new Date()) {
      toast.error('Schedule date must be in the future');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/tech-hub/articles/${article._id}/schedule`, {
        scheduledAt: scheduledDate.toISOString(),
      });
      toast.success(`Article scheduled for ${scheduledDate.toLocaleString()}`);
      onSchedule?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSchedule = async () => {
    setLoading(true);
    try {
      await api.post(`/tech-hub/articles/${article._id}/cancel-schedule`);
      toast.success('Schedule cancelled');
      onSchedule?.();
    } catch (err) {
      toast.error('Failed to cancel schedule');
    } finally {
      setLoading(false);
    }
  };

  const isScheduled = article.scheduledAt;
  const scheduledDate = isScheduled ? new Date(article.scheduledAt) : null;

  // Quick schedule options
  const quickOptions = [
    { label: 'Tomorrow 9 AM', offset: 1, hour: 9 },
    { label: 'In 2 days', offset: 2, hour: 9 },
    { label: 'Next Monday 9 AM', getOffset: () => {
      const d = new Date();
      const daysUntilMonday = (8 - d.getDay()) % 7 || 7;
      d.setDate(d.getDate() + daysUntilMonday);
      return d;
    }, hour: 9 },
    { label: 'Next Week', offset: 7, hour: 9 },
  ];

  const applyQuickSchedule = (option) => {
    let d;
    if (option.getOffset) {
      d = option.getOffset();
    } else {
      d = new Date();
      d.setDate(d.getDate() + (option.offset || 1));
    }
    setDate(d.toISOString().slice(0, 10));
    setTime(`${String(option.hour).padStart(2, '0')}:00`);
  };

  return (
    <div style={{
      background: '#0B1F1B',
      border: '1px solid #EE610044',
      borderRadius: 12,
      padding: '1.25rem',
      maxWidth: 450,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: 16, color: '#F4F1EA' }}>
          📅 {isScheduled ? 'Reschedule Article' : 'Schedule Article'}
        </h3>
        <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: '#4a6a8a', fontSize: 18, cursor: 'pointer' }}>
          ✕
        </button>
      </div>

      {/* Current schedule status */}
      {isScheduled && (
        <div style={{
          padding: '0.75rem',
          background: '#ffd70010',
          border: '1px solid #ffd70033',
          borderRadius: 8,
          marginBottom: '1rem',
          fontSize: 12,
        }}>
          <div style={{ color: '#ffd700', fontWeight: 600, marginBottom: 4 }}>
            ⏰ Currently scheduled for:
          </div>
          <div style={{ color: '#F4F1EA' }}>
            {scheduledDate?.toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <button
            onClick={handleCancelSchedule}
            disabled={loading}
            style={{
              marginTop: 8,
              padding: '4px 12px',
              background: '#ff336622',
              color: '#ff3366',
              border: '1px solid #ff336644',
              borderRadius: 4,
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Cancel Schedule
          </button>
        </div>
      )}

      {/* Quick schedule options */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: 11, color: '#4a6a8a', marginBottom: 6, textTransform: 'uppercase' }}>
          Quick Schedule
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {quickOptions.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => applyQuickSchedule(opt)}
              style={{
                padding: '5px 10px',
                background: '#0F2620',
                border: '1px solid rgba(36,74,68,0.4)',
                borderRadius: 6,
                color: '#c0d8f0',
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#EE6100'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(36,74,68,0.4)'; }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date/time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#4a6a8a', marginBottom: 4, textTransform: 'uppercase' }}>
            Date *
          </label>
          <input
            type="date"
            value={date}
            min={getMinDate()}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: '#0F2620',
              border: '1px solid rgba(36,74,68,0.4)',
              borderRadius: 6,
              color: '#F4F1EA',
              fontSize: 13,
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#4a6a8a', marginBottom: 4, textTransform: 'uppercase' }}>
            Time *
          </label>
          <input
            type="time"
            value={time}
            min={date === getMinDate() ? getMinTime() : '00:00'}
            onChange={(e) => setTime(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: '#0F2620',
              border: '1px solid rgba(36,74,68,0.4)',
              borderRadius: 6,
              color: '#F4F1EA',
              fontSize: 13,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Preview */}
      {date && (
        <div style={{
          padding: '0.75rem',
          background: '#00ff8810',
          border: '1px solid #00ff8833',
          borderRadius: 8,
          marginBottom: '1rem',
          fontSize: 12,
        }}>
          <span style={{ color: '#00ff88' }}>✅ Will publish on: </span>
          <span style={{ color: '#F4F1EA', fontWeight: 600 }}>
            {new Date(`${date}T${time}:00`).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '6px 16px',
            background: 'transparent',
            color: '#4a6a8a',
            border: '1px solid rgba(36,74,68,0.4)',
            borderRadius: 6,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSchedule}
          disabled={loading || !date}
          style={{
            padding: '6px 16px',
            background: date ? '#EE6100' : '#4a6a8a',
            color: '#000',
            border: 'none',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 12,
            cursor: date ? 'pointer' : 'not-allowed',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '⏳ Scheduling...' : '📅 Schedule'}
        </button>
      </div>
    </div>
  );
}
