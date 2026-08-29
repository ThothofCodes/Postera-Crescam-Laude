// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Forced Password Change Page (first login)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

export default function ForcePasswordChange() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (form.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    if (form.newPassword === form.currentPassword) {
      toast.error('New password must be different from the temporary password');
      return;
    }
    
    setSaving(true);
    try {
      await api.post('/auth/change-first-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      
      toast.success('Password changed successfully! You can now access the admin panel.');
      
      // Clear the mustChangePassword flag from the store
      const { useAdminAuth } = await import('../../store/adminStore');
      const currentState = useAdminAuth.getState();
      useAdminAuth.setState({
        user: { ...currentState.user, mustChangePassword: false },
      });
      
      // Navigate to the admin dashboard
      setTimeout(() => {
        navigate('/admin/super');
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
    setSaving(false);
  };

  return (
    <div style={container}>
      <div style={card}>
        {/* Header */}
        <div style={header}>
          <div style={iconContainer}>
            <span style={icon}>🔐</span>
          </div>
          <h1 style={title}>Change Your Password</h1>
          <p style={subtitle}>
            This is your first login. Please change your temporary password to continue.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={fieldGroup}>
            <label style={label}>Current Password (Temporary)</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              required
              style={input}
              placeholder="Enter your temporary password"
            />
          </div>

          <div style={fieldGroup}>
            <label style={label}>New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              required
              minLength={8}
              style={input}
              placeholder="Enter your new password"
            />
          </div>

          <div style={fieldGroup}>
            <label style={label}>Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              minLength={8}
              style={input}
              placeholder="Confirm your new password"
            />
          </div>

          <label style={showPasswordLabel}>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Show passwords
          </label>

          <div style={requirements}>
            <p style={reqTitle}>Password Requirements:</p>
            <ul style={reqList}>
              <li style={{ ...reqItem, color: form.newPassword.length >= 8 ? '#00ff88' : '#A9C4BE' }}>
                ✓ At least 8 characters
              </li>
              <li style={{ ...reqItem, color: form.newPassword !== form.currentPassword && form.newPassword ? '#00ff88' : '#A9C4BE' }}>
                ✓ Different from temporary password
              </li>
              <li style={{ ...reqItem, color: form.newPassword === form.confirmPassword && form.newPassword ? '#00ff88' : '#A9C4BE' }}>
                ✓ Passwords match
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}
            style={{
              ...submitBtn,
              opacity: saving || !form.currentPassword || !form.newPassword || !form.confirmPassword ? 0.5 : 1,
            }}
          >
            {saving ? 'Changing Password...' : 'Change Password & Continue'}
          </button>
        </form>

        {/* Footer */}
        <div style={footer}>
          <p style={footerText}>
            After changing your password, you will be redirected to the admin dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

// Styles
const container = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(160deg, #0A1A14, #0F2620)',
  padding: '1rem',
};

const card = {
  background: 'linear-gradient(160deg, #0F2620, #0F2620)',
  border: '1px solid rgba(238, 97, 0, 0.25)',
  borderRadius: 12,
  padding: '2rem',
  width: '100%',
  maxWidth: 440,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
};

const header = {
  textAlign: 'center',
  marginBottom: '1.5rem',
};

const iconContainer = {
  width: 64,
  height: 64,
  margin: '0 auto 1rem',
  background: 'rgba(255, 215, 0, 0.1)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid rgba(255, 215, 0, 0.3)',
};

const icon = {
  fontSize: 32,
};

const title = {
  margin: '0 0 0.5rem',
  fontSize: 20,
  fontWeight: 700,
  color: '#EE6100',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

const subtitle = {
  margin: 0,
  fontSize: 13,
  color: '#A9C4BE',
  lineHeight: 1.5,
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const fieldGroup = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};

const label = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#EE6100',
};

const input = {
  padding: '0.6rem 0.8rem',
  background: 'rgba(6, 13, 20, 0.8)',
  border: '1px solid rgba(238, 97, 0, 0.15)',
  borderRadius: 4,
  color: '#F4F1EA',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
};

const showPasswordLabel = {
  display: 'flex',
  alignItems: 'center',
  fontSize: 12,
  color: '#A9C4BE',
  cursor: 'pointer',
};

const requirements = {
  background: 'rgba(238, 97, 0, 0.05)',
  border: '1px solid rgba(238, 97, 0, 0.15)',
  borderRadius: 6,
  padding: '0.75rem',
};

const reqTitle = {
  margin: '0 0 0.5rem',
  fontSize: 11,
  fontWeight: 700,
  color: '#EE6100',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const reqList = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const reqItem = {
  fontSize: 12,
  marginBottom: '0.25rem',
  color: '#A9C4BE',
};

const submitBtn = {
  padding: '0.75rem 1rem',
  background: 'linear-gradient(135deg, #EE6100, #FF8533)',
  color: '#0A1A14',
  border: 'none',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
};

const footer = {
  marginTop: '1.5rem',
  textAlign: 'center',
};

const footerText = {
  margin: 0,
  fontSize: 11,
  color: '#6A8A82',
  lineHeight: 1.5,
};
