// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../utils/api';
import toast from 'react-hot-toast';

const StaffInvitation = ({ color = '#EE6100' }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    departmentSlug: user?.departmentSlug || '',
    role: 'STAFF'
  });
  const [invitations, setInvitations] = useState([]);
  const [staffDirectory, setStaffDirectory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [directoryLoading, setDirectoryLoading] = useState(false);

  // Load pending invitations
  useEffect(() => {
    loadPendingInvitations();
    loadStaffDirectory();
  }, []);

  const loadPendingInvitations = async () => {
    try {
      setPendingLoading(true);
      const response = await api.get('/staff-invitation/pending');
      setInvitations(response.data.invitations);
    } catch (error) {
      console.error('Error loading pending invitations:', error);
      toast.error('Failed to load pending invitations');
    } finally {
      setPendingLoading(false);
    }
  };

  const loadStaffDirectory = async () => {
    try {
      setDirectoryLoading(true);
      const response = await api.get('/staff-invitation/directory');
      setStaffDirectory(response.data.staff);
    } catch (error) {
      console.error('Error loading staff directory:', error);
      toast.error('Failed to load staff directory');
    } finally {
      setDirectoryLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      setLoading(true);
      await api.post('/staff-invitation', formData);
      
      toast.success('Staff invitation sent successfully!');
      setFormData({
        name: '',
        email: '',
        departmentSlug: user?.departmentSlug || '',
        role: 'STAFF'
      });
      
      // Reload the lists
      loadPendingInvitations();
      loadStaffDirectory();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (userId) => {
    try {
      await api.post(`/staff-invitation/resend/${userId}`);
      toast.success('Invitation resent successfully!');
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error(error.response?.data?.message || 'Failed to resend invitation');
    }
  };

  const handleCancel = async (userId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation? This cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/staff-invitation/cancel/${userId}`);
      toast.success('Invitation cancelled successfully!');
      loadPendingInvitations();
      loadStaffDirectory();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-void)', 
      padding: '2rem',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            color: '#F4F1EA', 
            fontSize: '2rem', 
            fontWeight: 700, 
            marginBottom: '0.5rem',
            fontFamily: "'Poppins', sans-serif"
          }}>
            Staff Invitation System
          </h1>
          <p style={{ color: '#A9C4BE', fontSize: '1rem' }}>
            Invite new staff members via company email assignment
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Invitation Form */}
          <div style={{ 
            background: 'var(--bg-card)', 
            borderRadius: '12px', 
            padding: '1.5rem',
            border: '1px solid rgba(240, 238, 255, 0.1)'
          }}>
            <h2 style={{ 
              color: '#F4F1EA', 
              fontSize: '1.25rem', 
              fontWeight: 600, 
              marginBottom: '1.5rem',
              borderBottom: '1px solid rgba(240, 238, 255, 0.1)',
              paddingBottom: '0.5rem'
            }}>
              Invite New Staff
            </h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="name" style={{ 
                  display: 'block', 
                  color: '#F4F1EA', 
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter staff member's full name"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(14,10,20,0.6)',
                    border: '1px solid rgba(244,241,234,0.12)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label htmlFor="email" style={{ 
                  display: 'block', 
                  color: '#F4F1EA', 
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter staff member's email"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(14,10,20,0.6)',
                    border: '1px solid rgba(244,241,234,0.12)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label htmlFor="departmentSlug" style={{ 
                  display: 'block', 
                  color: '#F4F1EA', 
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  Department
                </label>
                <select
                  id="departmentSlug"
                  name="departmentSlug"
                  value={formData.departmentSlug}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(14,10,20,0.6)',
                    border: '1px solid rgba(244,241,234,0.12)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Select Department</option>
                  <option value="internet">Internet Distribution</option>
                  <option value="webdev">Web Development</option>
                  <option value="playstation">PlayStation Arena</option>
                  <option value="repair">Hardware Repair</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="govadmin">Government Admin Assistance</option>
                </select>
              </div>

              <div>
                <label htmlFor="role" style={{ 
                  display: 'block', 
                  color: '#F4F1EA', 
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(14,10,20,0.6)',
                    border: '1px solid rgba(244,241,234,0.12)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="STAFF">Staff</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.75rem',
                  background: `linear-gradient(135deg, ${color}, ${color}80)`,
                  color: 'black',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginTop: '1rem'
                }}
              >
                {loading ? 'Sending Invitation...' : 'Send Invitation'}
              </button>
            </form>
          </div>

          {/* Pending Invitations */}
          <div style={{ 
            background: 'var(--bg-card)', 
            borderRadius: '12px', 
            padding: '1.5rem',
            border: '1px solid rgba(240, 238, 255, 0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1.5rem',
              borderBottom: '1px solid rgba(240, 238, 255, 0.1)',
              paddingBottom: '0.5rem'
            }}>
              <h2 style={{ 
                color: '#F4F1EA', 
                fontSize: '1.25rem', 
                fontWeight: 600 
              }}>
                Pending Invitations ({invitations.length})
              </h2>
              <button
                onClick={loadPendingInvitations}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(244,241,234,0.1)',
                  color: '#A9C4BE',
                  border: '1px solid rgba(244,241,234,0.2)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                Refresh
              </button>
            </div>

            {pendingLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#A9C4BE' }}>
                Loading pending invitations...
              </div>
            ) : invitations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#A9C4BE' }}>
                No pending invitations
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {invitations.map((invitation) => (
                  <div 
                    key={invitation._id} 
                    style={{ 
                      padding: '1rem', 
                      background: 'rgba(14,10,20,0.4)',
                      border: '1px solid rgba(244,241,234,0.1)',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#F4F1EA', marginBottom: '0.25rem' }}>
                          {invitation.name}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#A9C4BE' }}>
                          {invitation.email}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#A9C4BE', marginTop: '0.25rem' }}>
                          {invitation.departmentSlug?.toUpperCase()} • {invitation.role}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleResend(invitation._id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(0, 212, 255, 0.2)',
                            color: '#EE6100',
                            border: '1px solid rgba(0, 212, 255, 0.3)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Resend
                        </button>
                        <button
                          onClick={() => handleCancel(invitation._id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(255, 51, 102, 0.2)',
                            color: '#ff3366',
                            border: '1px solid rgba(255, 51, 102, 0.3)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#A9C4BE', marginTop: '0.5rem' }}>
                      Invited: {new Date(invitation.createdAt).toLocaleDateString('en-KE')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Staff Directory */}
        <div style={{ 
          background: 'var(--bg-card)', 
          borderRadius: '12px', 
          padding: '1.5rem',
          border: '1px solid rgba(240, 238, 255, 0.1)',
          marginTop: '2rem'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1.5rem',
            borderBottom: '1px solid rgba(240, 238, 255, 0.1)',
            paddingBottom: '0.5rem'
          }}>
            <h2 style={{ 
              color: '#F4F1EA', 
              fontSize: '1.25rem', 
              fontWeight: 600 
            }}>
              Staff Directory ({staffDirectory.length})
            </h2>
            <button
              onClick={loadStaffDirectory}
              style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(244,241,234,0.1)',
                color: '#A9C4BE',
                border: '1px solid rgba(244,241,234,0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              Refresh
            </button>
          </div>

          {directoryLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#A9C4BE' }}>
              Loading staff directory...
            </div>
          ) : staffDirectory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#A9C4BE' }}>
              No staff members found
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(240, 238, 255, 0.2)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#A9C4BE', fontSize: '0.875rem' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#A9C4BE', fontSize: '0.875rem' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#A9C4BE', fontSize: '0.875rem' }}>Department</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#A9C4BE', fontSize: '0.875rem' }}>Role</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#A9C4BE', fontSize: '0.875rem' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#A9C4BE', fontSize: '0.875rem' }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {staffDirectory.map((staff) => (
                    <tr key={staff._id} style={{ borderBottom: '1px solid rgba(240, 238, 255, 0.1)' }}>
                      <td style={{ padding: '0.75rem', color: '#F4F1EA' }}>{staff.name}</td>
                      <td style={{ padding: '0.75rem', color: '#A9C4BE', fontSize: '0.875rem' }}>{staff.email}</td>
                      <td style={{ padding: '0.75rem', color: '#A9C4BE', fontSize: '0.875rem' }}>
                        {staff.departmentSlug?.toUpperCase()}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#A9C4BE', fontSize: '0.875rem' }}>{staff.role}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          background: staff.isActive ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 51, 102, 0.2)',
                          color: staff.isActive ? '#00ff88' : '#ff3366'
                        }}>
                          {staff.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#A9C4BE', fontSize: '0.75rem' }}>
                        {new Date(staff.createdAt).toLocaleDateString('en-KE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffInvitation;