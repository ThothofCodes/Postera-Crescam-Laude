// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

const Callbacks = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingNotes, setEditingNotes] = useState({});

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const { data } = await api.get('/chat/callbacks', { params });
      setRequests(data.data || []);
    } catch (error) {
      console.error('Error loading callback requests:', error);
      toast.error('Failed to load callback requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const updateRequestStatus = async (id, newStatus, notes = null) => {
    try {
      const updateData = { status: newStatus };
      if (notes !== null) {
        updateData.notes = notes;
      }
      
      await api.patch(`/chat/callbacks/${id}`, updateData);
      toast.success('Callback request updated');
      loadRequests();
    } catch (error) {
      console.error('Error updating callback request:', error);
      toast.error('Failed to update callback request');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in-progress': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <Spinner />;
  }

  const filteredRequests = requests.filter(request => {
    if (statusFilter === 'all') return true;
    return request.status === statusFilter;
  });

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-void)', 
      padding: '2rem',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ 
                color: '#F4F1EA', 
                fontSize: '2rem', 
                fontWeight: 700, 
                marginBottom: '0.5rem',
                fontFamily: "'Poppins', sans-serif"
              }}>
                Callback Requests
              </h1>
              <p style={{ color: '#A9C4BE', fontSize: '1rem' }}>
                Manage customer callback requests
              </p>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(14,10,20,0.6)',
                  border: '1px solid rgba(244,241,234,0.12)',
                  borderRadius: '6px',
                  color: '#F4F1EA',
                  fontSize: '0.875rem'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <EmptyState icon="📞" message="No callback requests found" />
        ) : (
          <div style={{ 
            background: 'var(--bg-card)', 
            borderRadius: '12px', 
            border: '1px solid rgba(240, 238, 255, 0.1)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(240, 238, 255, 0.1)' }}>
                  {['Client', 'Phone', 'Message', 'Status', 'Date', 'Actions'].map((header) => (
                    <th 
                      key={header}
                      style={{ 
                        padding: '1rem', 
                        textAlign: 'left', 
                        color: '#4a6a8a',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em'
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr 
                    key={request._id} 
                    style={{ borderBottom: '1px solid rgba(240, 238, 255, 0.05)' }}
                  >
                    <td style={{ padding: '1rem', color: '#F4F1EA', fontWeight: 500 }}>
                      {request.clientName}
                    </td>
                    <td style={{ padding: '1rem', color: '#A9C4BE' }}>
                      {request.phone || 'N/A'}
                    </td>
                    <td style={{ padding: '1rem', color: '#a0aec0', maxWidth: '200px' }}>
                      <div style={{ 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}>
                        {request.message}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span 
                        style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem',
                          background: `${getStatusColor(request.status)}22`,
                          color: getStatusColor(request.status),
                          fontWeight: 600
                        }}
                      >
                        {request.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#718096', fontSize: '0.875rem' }}>
                      {formatDate(request.createdAt)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                          value={request.status}
                          onChange={(e) => updateRequestStatus(request._id, e.target.value)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(14,10,20,0.6)',
                            border: '1px solid rgba(244,241,234,0.12)',
                            borderRadius: '4px',
                            color: '#F4F1EA',
                            fontSize: '0.75rem'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        
                        {editingNotes[request._id] !== undefined ? (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                              type="text"
                              defaultValue={request.notes || ''}
                              placeholder="Add notes..."
                              onBlur={(e) => {
                                updateRequestStatus(request._id, request.status, e.target.value);
                                setEditingNotes(prev => ({ ...prev, [request._id]: false }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateRequestStatus(request._id, request.status, e.target.value);
                                  setEditingNotes(prev => ({ ...prev, [request._id]: false }));
                                }
                              }}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: 'rgba(14,10,20,0.6)',
                                border: '1px solid rgba(244,241,234,0.12)',
                                borderRadius: '4px',
                                color: '#F4F1EA',
                                fontSize: '0.75rem',
                                minWidth: '100px'
                              }}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingNotes(prev => ({ ...prev, [request._id]: true }))}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: 'rgba(0, 212, 255, 0.2)',
                              color: '#EE6100',
                              border: '1px solid rgba(0, 212, 255, 0.3)',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Notes
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Callbacks;