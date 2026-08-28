// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import React, { useState } from 'react';
import { useChat } from '../hooks/useChat';
import { publicApi } from '../utils/api';
import toast from 'react-hot-toast';

const ChatToggle = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCallback, setShowCallback] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [contactType, setContactType] = useState('email');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  const { adminOnline } = useChat();

  const handleCallbackSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !contact.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await publicApi.post('/chat/callback', {
        clientName: customerName,
        message: `Callback requested: ${contactType} - ${contact}`,
        phone: contactType === 'phone' ? contact : undefined
      });

      toast.success('Callback request submitted successfully!');
      setCustomerName('');
      setContact('');
      setShowCallback(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting callback request:', error);
      toast.error('Failed to submit callback request');
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = () => {
    if (adminOnline) {
      toast.info('Opening chat with admin...');
    } else {
      setShowCallback(true);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 1000,
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Chat Widget - Expanded State */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: 0,
          width: 'clamp(300px, 90vw, 400px)',
          maxHeight: '500px',
          background: 'var(--bg-surface)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slide-in 0.3s ease',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary), #00a8cc)',
            color: 'var(--bg-void)',
            padding: '16px',
            fontWeight: 'bold',
            fontSize: '16px',
          }}>
            {adminOnline ? '💬 Chat with Admin' : '📞 Book a Callback'}
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            {showCallback ? (
              <form onSubmit={handleCallbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    background: 'var(--bg-void)',
                    color: 'var(--text-primary)',
                  }}
                />
                <select
                  value={contactType}
                  onChange={(e) => setContactType(e.target.value)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    background: 'var(--bg-void)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
                <input
                  type={contactType === 'email' ? 'email' : 'tel'}
                  placeholder={contactType === 'email' ? 'your@email.com' : '+254712345678'}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    background: 'var(--bg-void)',
                    color: 'var(--text-primary)',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'linear-gradient(135deg, var(--color-primary), #00a8cc)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCallback(false);
                      setCustomerName('');
                      setContact('');
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-primary)',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                {adminOnline ? (
                  <div style={{ fontSize: '14px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                    <p>We're here to help!</p>
                    <p style={{ fontSize: '12px', marginTop: '8px' }}>Chat feature is being set up</p>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📞</div>
                    <p>No admins available</p>
                    <p style={{ fontSize: '12px', marginTop: '8px' }}>Book a callback and we'll reach out</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setIsOpen(false);
          }
        }}
        style={{
          position: 'relative',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          background: adminOnline
            ? 'linear-gradient(135deg, var(--color-primary), #00a8cc)'
            : 'linear-gradient(135deg, var(--color-accent), #ff0080)',
          color: 'white',
          fontSize: '28px',
          cursor: 'pointer',
          boxShadow: adminOnline
            ? '0 0 24px rgba(0, 212, 255, 0.5), inset 0 0 12px rgba(0, 212, 255, 0.3)'
            : '0 0 24px rgba(255, 20, 147, 0.5), inset 0 0 12px rgba(255, 20, 147, 0.3)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fade-in 0.5s ease',
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
        }}
        title={adminOnline ? 'Chat with us' : 'Book a callback'}
      >
        {adminOnline ? '💬' : '📞'}
        {/* Online indicator */}
        {adminOnline && (
          <div style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            background: '#00ff00',
            borderRadius: '50%',
            bottom: '0',
            right: '0',
            border: '2px solid var(--bg-void)',
            boxShadow: '0 0 8px rgba(0, 255, 0, 0.6)',
          }} />
        )}
      </button>

      {/* Mobile responsiveness */}
      <style>{`
        @media (max-width: 576px) {
          [style*="position: fixed;"][style*="bottom: '24px'"] {
            bottom: 16px !important;
            right: 16px !important;
          }
          [style*="width: 'clamp(300px'"] {
            width: 100vw !important;
            height: 70vh !important;
            bottom: 0 !important;
            right: 0 !important;
            max-height: none !important;
            border-radius: 12px 12px 0 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatToggle;
