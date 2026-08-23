// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';

const ChatMonitor = ({ authToken, onClose }) => {
  const {
    connected,
    adminOnline,
    messages,
    conversations,
    currentConversation,
    joinConversation,
    getMessagesForConversation,
    sendMessage,
    setCurrentConversation,
    getActiveConversations
  } = useChat({ authToken });


  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const messagesEndRef = useRef(null);


  // Auto-scroll to bottom when messages change

  useEffect(() => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      // Silent fail if element not available
    }
  }, [messages, currentConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConversation) return;
    
    const guestIdFromConv = currentConversation.replace('guest-', '');
    sendMessage(currentConversation, newMessage, guestIdFromConv);
    setNewMessage('');
  };

  const handleSelectConversation = (conversationId) => {
    joinConversation(conversationId);
    setSelectedConversation(conversationId);
    setCurrentConversation(conversationId);
  };

  // Get messages for current conversation
  const currentMessages = currentConversation 
    ? getMessagesForConversation(currentConversation) 
    : [];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.guestId.toLowerCase().includes(searchFilter.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90%',
      maxWidth: '1200px',
      height: '80vh',
      zIndex: 1000,
      background: 'var(--bg-surface)',
      border: '1px solid rgba(240, 238, 255, 0.2)',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        background: 'linear-gradient(90deg, rgba(238,97,0,0.1), rgba(255,51,102,0.1))',
        borderBottom: '1px solid rgba(240, 238, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ margin: 0, color: '#F4F1EA' }}>Live Chat Monitor</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: connected ? '#00ff88' : '#ff3366'
            }}></div>
            <span style={{ fontSize: '0.9rem', color: connected ? '#00ff88' : '#ff3366' }}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: adminOnline ? '#00ff88' : '#ffaa00'
            }}></div>
            <span style={{ fontSize: '0.9rem', color: adminOnline ? '#00ff88' : '#ffaa00' }}>
              {adminOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#A9C4BE' }}>Availability:</span>
          <button
            type="button"
            onClick={() => {}}
            style={{
              padding: '0.25rem 0.75rem',
              background: adminOnline ? 'rgba(0,255,136,0.2)' : 'rgba(255,170,0,0.2)',
              color: adminOnline ? '#00ff88' : '#ffaa00',
              border: '1px solid rgba(244,241,234,0.2)',
              borderRadius: '4px',
              cursor: 'default',
              fontSize: '0.8rem'
            }}
          >
            {adminOnline ? 'ONLINE' : 'OFFLINE'}
          </button>
          <button
            onClick={() => setMonitoringEnabled(!monitoringEnabled)}
            style={{
              padding: '0.25rem 0.75rem',
              background: monitoringEnabled ? 'rgba(238,97,0,0.2)' : 'rgba(255,170,0,0.2)',
              color: monitoringEnabled ? '#EE6100' : '#ffaa00',
              border: '1px solid rgba(244,241,234,0.2)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            MONITOR {monitoringEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#F4F1EA',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '5px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden',
        backgroundColor: 'rgba(14,10,20,0.3)'
      }}>
        {/* Conversations Panel */}
        <div style={{ 
          width: '300px', 
          borderRight: '1px solid rgba(240, 238, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Search */}
          <div style={{ padding: '1rem' }}>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search conversations..."
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'rgba(14,10,20,0.8)',
                border: '1px solid rgba(244,241,234,0.12)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1rem 1rem' }}>
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv._id)}
                  style={{
                    padding: '0.75rem',
                    margin: '0.25rem 0',
                    borderRadius: '6px',
                    background: selectedConversation === conv._id 
                      ? 'rgba(0, 212, 255, 0.1)' 
                      : 'rgba(14,10,20,0.5)',
                    border: selectedConversation === conv._id 
                      ? '1px solid rgba(0, 212, 255, 0.3)' 
                      : '1px solid rgba(244,241,234,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedConversation !== conv._id) {
                      e.currentTarget.style.background = 'rgba(0, 212, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedConversation !== conv._id) {
                      e.currentTarget.style.background = 'rgba(14,10,20,0.5)';
                    }
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.25rem' 
                  }}>
                    <strong style={{ 
                      color: '#F4F1EA', 
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      Guest: {conv.guestId.substring(0, 8)}
                    </strong>
                    {conv.unreadCount > 0 && (
                      <span style={{
                        background: '#ff3366',
                        color: 'white',
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '10px'
                      }}>
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    color: '#A9C4BE', 
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {conv.lastMessage.substring(0, 40)}...
                  </div>
                  <div style={{ 
                    color: '#6A8A82', 
                    fontSize: '0.7rem',
                    marginTop: '0.25rem' 
                  }}>
                    {new Date(conv.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: '#6A8A82',
                padding: '2rem 0' 
              }}>
                {searchFilter ? 'No matching conversations' : 'No active conversations'}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <div style={{ 
                padding: '1rem', 
                borderBottom: '1px solid rgba(240, 238, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ color: '#F4F1EA', fontWeight: 600, margin: 0 }}>
                    Chat with Guest: {currentConversation.replace('guest-', '').substring(0, 8)}
                  </h3>
                  <p style={{ color: '#A9C4BE', fontSize: '0.875rem', margin: 0 }}>
                    {currentMessages.length} messages • {connected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem',
                    background: adminOnline ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 170, 0, 0.2)',
                    color: adminOnline ? '#00ff88' : '#ffaa00'
                  }}>
                    {adminOnline ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>

              {/* Messages Container */}
              <div style={{ 
                flex: 1, 
                padding: '1rem', 
                overflowY: 'auto',
                background: 'rgba(14,10,20,0.3)'
              }}>
                {currentMessages.length > 0 ? (
                  currentMessages.map((msg, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: '1rem',
                        display: 'flex',
                        justifyContent: msg.senderType === 'admin' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        maxWidth: '70%',
                        padding: '0.75rem 1rem',
                        borderRadius: msg.senderType === 'admin' 
                          ? '12px 4px 12px 12px' 
                          : '4px 12px 12px 12px',
                        background: msg.senderType === 'admin' 
                          ? 'linear-gradient(135deg, #EE6100, #00b4ff)' 
                          : 'rgba(240, 238, 255, 0.1)',
                        color: msg.senderType === 'admin' ? 'white' : '#F4F1EA',
                        fontSize: '0.9rem',
                        wordWrap: 'break-word'
                      }}>
                        <div style={{ marginBottom: '0.25rem', fontSize: '0.8rem', opacity: 0.8 }}>
                          {msg.senderType === 'admin' ? 'You' : 'Customer'} • {formatDate(msg.createdAt)}
                        </div>
                        <div>{msg.message}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '100%',
                    color: '#6A8A82',
                    textAlign: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💬</div>
                      <div>No messages yet</div>
                      <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Start the conversation with this customer
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div style={{ 
                padding: '1rem', 
                borderTop: '1px solid rgba(240, 238, 255, 0.1)',
                backgroundColor: 'rgba(14,10,20,0.6)'
              }}>
                {!adminOnline && (
                  <div style={{
                    padding: '0.5rem',
                    background: 'rgba(255, 170, 0, 0.2)',
                    border: '1px solid rgba(255, 170, 0, 0.3)',
                    borderRadius: '4px',
                    color: '#ffaa00',
                    fontSize: '0.8rem',
                    marginBottom: '0.5rem',
                    textAlign: 'center'
                  }}>
                    You are currently offline. Customers won't receive your messages until you go online.
                  </div>
                )}
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={adminOnline ? "Type your message..." : "Go online to respond to customers..."}
                    disabled={!adminOnline}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      background: adminOnline ? 'rgba(14,10,20,0.8)' : 'rgba(14,10,20,0.4)',
                      border: adminOnline ? '1px solid rgba(244,241,234,0.12)' : '1px solid rgba(244,241,234,0.05)',
                      borderRadius: '6px',
                      color: adminOnline ? 'var(--text-primary)' : 'rgba(244,241,234,0.4)',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || !currentConversation || !adminOnline}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: adminOnline 
                        ? 'linear-gradient(135deg, #EE6100, #00b4ff)' 
                        : 'linear-gradient(135deg, #6A8A82, #244A44)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: newMessage.trim() && currentConversation && adminOnline ? 'pointer' : 'not-allowed',
                      opacity: newMessage.trim() && currentConversation && adminOnline ? 1 : 0.6,
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center',
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💬</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: '#F4F1EA' }}>
                Select a conversation
              </div>
              <div style={{ fontSize: '1rem', color: '#A9C4BE', maxWidth: '400px' }}>
                Choose a conversation from the left panel to start chatting with customers
              </div>
              {!adminOnline && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  background: 'rgba(255, 170, 0, 0.1)',
                  border: '1px solid rgba(255, 170, 0, 0.2)',
                  borderRadius: '8px',
                  color: '#ffaa00',
                  maxWidth: '400px'
                }}>
                  Note: You are currently offline. Go online to actively communicate with customers.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMonitor;