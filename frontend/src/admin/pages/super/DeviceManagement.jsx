// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Device Management Panel for Super Admin
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../utils/api';
import { Spinner } from '../../../components/UI';
import toast from 'react-hot-toast';

export default function DeviceManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [registerModal, setRegisterModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceFingerprint, setNewDeviceFingerprint] = useState('');
  const [filter, setFilter] = useState('all');

  // Load all users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Load devices for selected user
  const loadDevices = useCallback(async (userId) => {
    if (!userId) { setDevices([]); return; }
    setDevicesLoading(true);
    try {
      const { data } = await api.get(`/devices/admin/${userId}`);
      setDevices(data);
    } catch {
      toast.error('Failed to load devices');
    }
    setDevicesLoading(false);
  }, []);

  useEffect(() => {
    if (selectedUser) loadDevices(selectedUser);
  }, [selectedUser, loadDevices]);

  // Register a new device
  const handleRegisterDevice = async () => {
    if (!selectedUser || !newDeviceFingerprint.trim()) {
      toast.error('Admin ID and device fingerprint required');
      return;
    }
    try {
      await api.post('/devices/register', {
        adminId: selectedUser,
        deviceFingerprint: newDeviceFingerprint.trim(),
        deviceName: newDeviceName.trim() || 'Unknown Device',
      });
      toast.success('Device registered successfully');
      setRegisterModal(false);
      setNewDeviceFingerprint('');
      setNewDeviceName('');
      loadDevices(selectedUser);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register device');
    }
  };

  // Deregister a device
  const handleDeregister = async (deviceId) => {
    if (!confirm('This will deregister the device and terminate any active session. Continue?')) return;
    try {
      await api.delete(`/devices/${deviceId}`);
      toast.success('Device deregistered');
      loadDevices(selectedUser);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deregister device');
    }
  };

  // Force logout all sessions for a user
  const handleForceLogout = async (userId) => {
    if (!confirm('This will terminate ALL active sessions for this user. Continue?')) return;
    try {
      await api.post(`/devices/force-logout/${userId}`);
      toast.success('All sessions terminated');
      loadDevices(userId);
    } catch (err) {
      toast.error('Failed to force logout');
    }
  };

  if (loading) return <Spinner />;

  const filteredUsers = filter === 'all' ? users : users.filter((u) => u.role === filter.toUpperCase());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: 18, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#EE6100', fontFamily: "'Rajdhani',sans-serif" }}>
          🖥️ Device Management
        </h2>
        <p style={{ margin: 0, fontSize: 12, color: '#6A8A82', fontFamily: "'Poppins',sans-serif" }}>
          Manage registered devices and active sessions for all admin accounts. Max 2 devices per admin.
        </p>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Admins', value: users.length, color: '#EE6100' },
          { label: 'Active Sessions', value: devices.filter((d) => d.isOnline).length, color: '#39FF88' },
          { label: 'Registered Devices', value: devices.length, color: '#2BB6A3' },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: '#0F2620', border: `1px solid ${kpi.color}22`, borderRadius: 8, padding: '1rem' }}>
            <div style={{ fontSize: 9, color: kpi.color, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace" }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif" }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['all', 'super_admin', 'dept_head_owner', 'staff'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '0.4rem 0.85rem', borderRadius: 4, border: `1px solid ${filter === f ? '#EE6100' : 'rgba(36,74,68,0.4)'}`, background: filter === f ? 'rgba(238,97,0,0.12)' : 'transparent', color: filter === f ? '#EE6100' : '#6A8A82', cursor: 'pointer', fontWeight: 600, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Share Tech Mono',monospace" }}>
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.25rem', minHeight: 400 }}>
        {/* User List */}
        <div style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(36,74,68,0.3)', background: 'rgba(36,74,68,0.08)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#EE6100', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Rajdhani',sans-serif" }}>Select Admin</div>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 500 }}>
            {filteredUsers.map((u) => (
              <div key={u._id} onClick={() => setSelectedUser(u._id)}
                style={{ padding: '0.65rem 1rem', cursor: 'pointer', borderLeft: selectedUser === u._id ? '3px solid #EE6100' : '3px solid transparent', background: selectedUser === u._id ? 'rgba(238,97,0,0.1)' : 'transparent', transition: 'all 0.15s', borderBottom: '1px solid rgba(36,74,68,0.15)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F4F1EA', fontFamily: "'Poppins',sans-serif" }}>{u.name}</div>
                <div style={{ fontSize: 10, color: '#6A8A82', fontFamily: "'Share Tech Mono',monospace", marginTop: 2 }}>{u.email}</div>
                <div style={{ fontSize: 9, color: u.role === 'SUPER_ADMIN' ? '#EE6100' : '#2BB6A3', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{u.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Panel */}
        <div style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 8, padding: '1.25rem' }}>
          {!selectedUser ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6A8A82' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🖥️</div>
              <p style={{ fontSize: 13 }}>Select an admin to manage their devices</p>
            </div>
          ) : devicesLoading ? (
            <Spinner />
          ) : (
            <>
              {/* Device actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: 14, color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.06em' }}>
                  Registered Devices ({devices.length}/2)
                </h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setRegisterModal(true)}
                    style={{ padding: '0.4rem 0.85rem', background: '#EE6100', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 11, fontFamily: "'Poppins',sans-serif" }}>
                    + Register Device
                  </button>
                  <button onClick={() => handleForceLogout(selectedUser)}
                    style={{ padding: '0.4rem 0.85rem', background: 'transparent', color: '#FF3B3B', border: '1px solid rgba(255,59,59,0.3)', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 11, fontFamily: "'Poppins',sans-serif" }}>
                    ⏻ Force Logout All
                  </button>
                </div>
              </div>

              {/* Device Cards */}
              {devices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6A8A82', fontSize: 12 }}>
                  No devices registered for this admin. Click "Register Device" to add one.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {devices.map((d) => (
                    <div key={d.id} style={{
                      background: '#081916', border: `1px solid ${d.isOnline ? 'rgba(57,255,136,0.3)' : 'rgba(36,74,68,0.3)'}`, borderRadius: 8, padding: '1rem', position: 'relative',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.isOnline ? '#39FF88' : '#6A8A82', boxShadow: d.isOnline ? '0 0 8px rgba(57,255,136,0.5)' : 'none' }} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#F4F1EA', fontFamily: "'Poppins',sans-serif" }}>{d.name}</span>
                          </div>
                          <div style={{ fontSize: 10, color: '#6A8A82', fontFamily: "'Share Tech Mono',monospace" }}>
                            Hash: {d.deviceHash?.substring(0, 16)}...
                          </div>
                          <div style={{ fontSize: 10, color: '#6A8A82', fontFamily: "'Share Tech Mono',monospace", marginTop: 2 }}>
                            Last seen: {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : 'Never'}
                          </div>
                          {d.lastSeenIp && (
                            <div style={{ fontSize: 10, color: '#6A8A82', fontFamily: "'Share Tech Mono',monospace", marginTop: 2 }}>
                              IP: {d.lastSeenIp}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: d.isOnline ? '#39FF88' : '#6A8A82', fontFamily: "'Share Tech Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {d.isOnline ? '● Online' : '○ Offline'}
                          </span>
                          <button onClick={() => handleDeregister(d.id)}
                            style={{ padding: '0.3rem 0.6rem', background: 'transparent', color: '#FF3B3B', border: '1px solid rgba(255,59,59,0.3)', borderRadius: 4, cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Register Device Modal */}
      {registerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,25,22,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#0F2620', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 10, padding: '1.5rem', width: '100%', maxWidth: 440 }}>
            <h3 style={{ margin: '0 0 1rem', color: '#EE6100', fontFamily: "'Rajdhani',sans-serif", fontSize: 16, letterSpacing: '0.06em' }}>Register New Device</h3>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#A9C4BE', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Device Name</label>
              <input value={newDeviceName} onChange={(e) => setNewDeviceName(e.target.value)} placeholder="e.g. John's MacBook"
                style={{ width: '100%', padding: '0.65rem 0.75rem', background: '#081916', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, color: '#F4F1EA', fontFamily: "'Poppins',sans-serif", fontSize: 13, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#A9C4BE', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Device Fingerprint</label>
              <textarea value={newDeviceFingerprint} onChange={(e) => setNewDeviceFingerprint(e.target.value)} placeholder="Paste the device fingerprint from the admin's browser..."
                rows={3}
                style={{ width: '100%', padding: '0.65rem 0.75rem', background: '#081916', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, color: '#F4F1EA', fontFamily: "'Share Tech Mono',monospace", fontSize: 11, boxSizing: 'border-box', resize: 'vertical' }} />
              <p style={{ margin: '4px 0 0', fontSize: 9, color: '#6A8A82' }}>
                Tip: The admin can get their fingerprint from browser console: <code style={{ color: '#2BB6A3' }}>getDeviceFingerprint()</code>
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setRegisterModal(false); setNewDeviceFingerprint(''); setNewDeviceName(''); }}
                style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#6A8A82', border: '1px solid rgba(36,74,68,0.4)', borderRadius: 4, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", fontSize: 12 }}>
                Cancel
              </button>
              <button onClick={handleRegisterDevice}
                style={{ padding: '0.5rem 1rem', background: '#EE6100', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontFamily: "'Poppins',sans-serif", fontSize: 12 }}>
                Register Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
