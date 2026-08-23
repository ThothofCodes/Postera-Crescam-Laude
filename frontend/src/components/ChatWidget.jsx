import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';

const ChatWidget = ({ isAdmin = false, authToken = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [contactType, setContactType] = useState('email');
  const [contact, setContact] = useState('');
  const [adminAvailableAlert, setAdminAvailableAlert] = useState(false);
  const messagesEndRef = useRef(null);

  const { socket, connected: socketConnected, adminOnline: socketAdminOnline } = useChat({ authToken });

  useEffect(() => {
    setConnected(socketConnected);
    setAdminOnline(socketAdminOnline);
  }, [socketConnected, socketAdminOnline]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const dismissAdminAlert = () => { setAdminAvailableAlert(false); };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || (!adminOnline && messages.length === 0)) return;
    const messageObj = {
      id: Date.now(),
      text: newMessage,
      sender: 'customer',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, messageObj]);
    setNewMessage('');
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 10);
  };

  const handleRequestCallback = async () => {
    if (!customerName.trim() || !contact.trim()) { alert('Please fill in all required fields'); return; }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/chat/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: customerName, message: `Callback requested: ${contactType} - ${contact}`, phone: contactType === 'phone' ? contact : undefined })
      });
      if (response.ok) { alert('Callback request submitted successfully.'); setShowCallbackForm(false); setCustomerName(''); setContact(''); }
      else { alert('Failed to submit callback request.'); }
    } catch (error) { console.error('Error:', error); alert('Failed to submit callback request.'); }
  };

  if (isAdmin) return <div style={{ display: 'none' }}>Admin view not handled here</div>;

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
      {isOpen ? (
        <div style={{ width: '350px', height: '500px', backgroundColor: '#0F2620', borderRadius: '10px', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', border: '1px solid rgba(36,74,68,0.4)', fontFamily: "'Poppins', sans-serif" }}>
          {/* Header */}
          <div style={{ padding: '16px', backgroundColor: '#244A44', borderTopLeftRadius: '10px', borderTopRightRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#F4F1EA', fontSize: '16px', fontFamily: "'Rajdhani',sans-serif" }}>PCL Support</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: connected ? (adminOnline ? '#39FF88' : '#FF3B3B') : '#FFB020', boxShadow: connected && adminOnline ? '0 0 8px rgba(57,255,136,0.5)' : 'none', animation: connected && adminOnline ? 'glow-pulse 2s ease-in-out infinite' : 'none' }}></div>
                <span style={{ color: connected ? (adminOnline ? '#39FF88' : '#FF3B3B') : '#FFB020', fontSize: '13px', fontFamily: "'Share Tech Mono',monospace" }}>
                  {connected ? (adminOnline ? 'ONLINE' : 'OFFLINE') : 'CONNECTING...'}
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#F4F1EA', fontSize: '18px', cursor: 'pointer', padding: '4px' }}>×</button>
          </div>

          {!connected && <div style={{ padding: '8px', backgroundColor: '#FFB020', color: '#081916', fontSize: '12px', textAlign: 'center', fontFamily: "'Share Tech Mono',monospace" }}>CONNECTING...</div>}

          {adminAvailableAlert && (
            <div style={{ padding: '12px', backgroundColor: '#39FF88', color: '#081916', fontSize: '14px', textAlign: 'center', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>We're back online!</span>
              <button onClick={dismissAdminAlert} style={{ background: 'none', border: 'none', color: '#081916', fontSize: '16px', cursor: 'pointer' }}>×</button>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: '#081916' }}>
            {messages.length > 0 ? messages.map((msg, index) => (
              <div key={index} style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '4px', backgroundColor: msg.sender === 'customer' ? '#EE6100' : '#244A44', alignSelf: msg.sender === 'customer' ? 'flex-end' : 'flex-start', maxWidth: '80%', textAlign: 'left' }}>
                <div style={{ fontSize: '14px', color: '#fff' }}>{msg.text}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '4px', fontFamily: "'Share Tech Mono',monospace" }}>{msg.timestamp}</div>
              </div>
            )) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6A8A82', textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{adminOnline ? '💬' : '📞'}</div>
                <p style={{ fontSize: 13 }}>{adminOnline ? 'Send us a message!' : 'No admin available. Leave your details.'}</p>
                {!adminOnline && (
                  <button onClick={() => setShowCallbackForm(true)} style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: '#EE6100', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Request Callback</button>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Callback Form */}
          {showCallbackForm && (
            <div style={{ padding: '16px', backgroundColor: '#0F2620', borderTop: '1px solid rgba(36,74,68,0.4)' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#F4F1EA', fontFamily: "'Rajdhani',sans-serif" }}>Request Callback</h4>
              <form onSubmit={(e) => { e.preventDefault(); handleRequestCallback(); }}>
                <input type="text" placeholder="Your name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid rgba(36,74,68,0.4)', backgroundColor: '#081916', color: '#F4F1EA' }} />
                <select value={contactType} onChange={(e) => setContactType(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid rgba(36,74,68,0.4)', backgroundColor: '#081916', color: '#F4F1EA' }}>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
                <input type={contactType === 'email' ? 'email' : 'tel'} placeholder={contactType === 'email' ? 'your@email.com' : '+254712345678'} value={contact} onChange={(e) => setContact(e.target.value)} required style={{ width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '4px', border: '1px solid rgba(36,74,68,0.4)', backgroundColor: '#081916', color: '#F4F1EA' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" style={{ flex: 1, padding: '8px', backgroundColor: '#EE6100', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Submit</button>
                  <button type="button" onClick={() => setShowCallbackForm(false)} style={{ flex: 1, padding: '8px', backgroundColor: 'rgba(36,74,68,0.3)', color: '#A9C4BE', border: '1px solid rgba(36,74,68,0.4)', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Message Input */}
          {!showCallbackForm && (
            <form onSubmit={handleSendMessage} style={{ padding: '12px', backgroundColor: '#0F2620', borderTop: '1px solid rgba(36,74,68,0.4)', display: 'flex', gap: '8px' }}>
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={adminOnline ? "Type your message..." : "Offline - leave a message"} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid rgba(36,74,68,0.4)', backgroundColor: '#081916', color: '#F4F1EA', opacity: (!connected || (!adminOnline && messages.length === 0)) ? 0.6 : 1 }} disabled={!connected || (!adminOnline && messages.length === 0)} />
              <button type="submit" disabled={!connected || !newMessage.trim() || (!adminOnline && messages.length === 0)} style={{ padding: '10px 16px', backgroundColor: '#EE6100', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, opacity: (!connected || !newMessage.trim() || (!adminOnline && messages.length === 0)) ? 0.6 : 1 }}>Send</button>
            </form>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px', height: '60px', borderRadius: '50%',
            backgroundColor: connected ? (adminOnline ? '#EE6100' : '#6A8A82') : '#FFB020',
            color: 'white', border: 'none', fontSize: '24px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: connected && adminOnline ? '0 0 20px rgba(238,97,0,0.4)' : '0 4px 12px rgba(0,0,0,0.4)',
            position: 'relative', transition: 'all 0.3s ease', zIndex: 1001,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          💬
          <div style={{
            position: 'absolute', bottom: '4px', right: '4px',
            width: '12px', height: '12px', borderRadius: '50%',
            backgroundColor: connected ? (adminOnline ? '#39FF88' : '#FF3B3B') : '#FFB020',
            border: '2px solid #0F2620',
            boxShadow: connected && adminOnline ? '0 0 6px rgba(57,255,136,0.5)' : 'none',
            animation: connected && adminOnline ? 'glow-pulse 2s ease-in-out infinite' : 'none',
          }}></div>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
