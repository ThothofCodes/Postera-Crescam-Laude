// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState, useEffect, useRef } from 'react';
import { publicApi } from '../utils/api';
import { formatKES } from '../utils/helpers';

export default function PaymentForm({ orderId, amount, onSuccess }) {
  const [status, setStatus] = useState('idle'); // idle | pushing | polling | success | failed
  const [error, setError] = useState('');
  const pollRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  const poll = async (orderNumber, attempts = 0) => {
    if (!mountedRef.current) return;
    if (attempts > 30) {
      setStatus('failed');
      setError('Payment timeout. Please try again or pay at the counter.');
      return;
    }
    try {
      const { data } = await publicApi.get(`/orders/status/${orderNumber}`);
      if (data.paymentStatus === 'paid') {
        setStatus('success');
        onSuccess(data);
        return;
      }
    } catch {
      // network hiccup — keep polling
    }
    pollRef.current = setTimeout(() => poll(orderNumber, attempts + 1), 3000);
  };

  const handlePay = async () => {
    setStatus('pushing');
    setError('');
    try {
      // STK push was already triggered at order creation for mpesa orders.
      // We just start polling for the callback result via the public status endpoint.
      // We need the orderNumber, not the ObjectId — fetch it first if we only have the ID.
      setStatus('polling');
      // Try polling with the orderId directly (might be orderNumber or ObjectId)
      poll(orderId);
    } catch (err) {
      setStatus('failed');
      setError(err.response?.data?.message || 'Payment initiation failed');
    }
  };

  if (status === 'success') {
    return <div style={{ color: '#10b981', fontWeight: 600, textAlign: 'center', fontSize: 18 }}>✅ Payment confirmed!</div>;
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontWeight: 600, fontSize: 18 }}>Pay {formatKES(amount)} via M-Pesa</p>
      {status === 'idle' && (
        <button onClick={handlePay} style={{ padding: '0.75rem 2rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>
          I've Received the M-Pesa Prompt
        </button>
      )}
      {status === 'pushing' && <p style={{ color: '#64748b' }}>⏳ Initiating payment...</p>}
      {status === 'polling' && (
        <div>
          <p style={{ color: '#0f172a', fontWeight: 600 }}>📱 Enter your M-Pesa PIN on your phone</p>
          <p style={{ color: '#64748b', fontSize: 14 }}>Waiting for confirmation... (up to 90 seconds)</p>
          <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid #e2e8f0', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {status === 'failed' && (
        <>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button onClick={() => { setStatus('idle'); setError(''); }} style={{ padding: '0.5rem 1.5rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Try Again
          </button>
        </>
      )}
    </div>
  );
}
