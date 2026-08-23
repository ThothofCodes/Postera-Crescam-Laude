// PCL — System Settings Page (shared across departments)
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pcl-settings';

const DEFAULTS = {
  notifications: true,
  emailAlerts: true,
  smsAlerts: false,
  darkMode: true,
  compactView: false,
  autoRefresh: true,
  refreshInterval: 30,
  language: 'en',
  timezone: 'Africa/Nairobi',
  currency: 'KES',
};

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
  } catch { return { ...DEFAULTS }; }
}

export default function SettingsPage({ color = '#EE6100', department }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [settings, setSettings] = useState(loadSettings);

  // Persist to localStorage on every change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setMsg('Settings saved successfully');
    } catch { setMsg('Failed to save settings'); }
    setTimeout(() => setSaving(false), 500);
  };

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const Switch = ({ label, value, onChange }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(36,74,68,0.15)' }}>
      <span style={{ fontSize: 13, color: '#F4F1EA' }}>{label}</span>
      <button onClick={onChange} style={{ width: 40, height: 22, borderRadius: 11, border: 'none', background: value ? color : '#1F3D35', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', padding: 0 }}>
        <span style={{ position: 'absolute', top: 2, left: value ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#F4F1EA', transition: 'left 0.2s' }} />
      </button>
    </div>
  );

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", margin: 0, marginBottom: '1.5rem' }}>System Settings{department ? ` — ${department}` : ''}</h2>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: 6, marginBottom: '1rem', fontSize: 13, color: msg.includes('success') ? '#39FF88' : '#FF3B3B', background: msg.includes('success') ? 'rgba(57,255,136,0.1)' : 'rgba(255,59,59,0.1)' }}>{msg}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Notifications */}
        <div style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1.25rem' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#2BB6A3', fontFamily: "'Rajdhani',sans-serif", marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notifications</h3>
          <Switch label="Push Notifications" value={settings.notifications} onChange={() => toggle('notifications')} />
          <Switch label="Email Alerts" value={settings.emailAlerts} onChange={() => toggle('emailAlerts')} />
          <Switch label="SMS Alerts" value={settings.smsAlerts} onChange={() => toggle('smsAlerts')} />
        </div>

        {/* Display */}
        <div style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1.25rem' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#2BB6A3', fontFamily: "'Rajdhani',sans-serif", marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Display</h3>
          <Switch label="Dark Mode" value={settings.darkMode} onChange={() => toggle('darkMode')} />
          <Switch label="Compact View" value={settings.compactView} onChange={() => toggle('compactView')} />
          <Switch label="Auto-refresh Data" value={settings.autoRefresh} onChange={() => toggle('autoRefresh')} />
        </div>

        {/* Locale */}
        <div style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1.25rem' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#2BB6A3', fontFamily: "'Rajdhani',sans-serif", marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Locale</h3>
          {[{ label: 'Language', key: 'language', options: ['en', 'sw'] },
            { label: 'Timezone', key: 'timezone', options: ['Africa/Nairobi', 'UTC'] },
            { label: 'Currency', key: 'currency', options: ['KES', 'USD'] },
          ].map(({ label, key, options }) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(36,74,68,0.15)' }}>
              <span style={{ fontSize: 13, color: '#F4F1EA' }}>{label}</span>
              <select value={settings[key]} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))} style={{ padding: '4px 8px', background: '#081916', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, color: '#F4F1EA', fontSize: 12, fontFamily: "'Share Tech Mono',monospace" }}>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} disabled={saving} style={{ padding: '8px 24px', background: color, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13, opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Save Settings'}</button>
      </div>
    </div>
  );
}
