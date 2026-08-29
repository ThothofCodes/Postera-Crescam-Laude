// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Real-time Payment Notifications for Admin Dashboard
import { useState, useEffect, useCallback } from 'react';
import useSocket from '../../hooks/useSocket';
import { formatKES } from '../../utils/helpers';

const PAYMENT_ICONS = {
  success: '✅',
  failed: '❌',
  cash_switch: '💵',
  pending_cash: '💵',
};

const PAYMENT_COLORS = {
  success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
  failed: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' },
  cash_switch: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
  pending_cash: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
};

export default function PaymentNotifications({ maxVisible = 5 }) {
  const [payments, setPayments] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Listen for real-time payment events
  useSocket({
    'payment:new': (data) => {
      console.log('[ADMIN] Payment notification:', data);
      
      const payment = {
        id: `${data.checkoutRequestId}-${Date.now()}`,
        checkoutRequestId: data.checkoutRequestId,
        orderNumber: data.orderNumber || data.invoiceId || 'N/A',
        amount: data.amount || 0,
        success: data.success,
        type: data.type || (data.success ? 'success' : 'failed'),
        message: data.message || (data.success ? 'Payment confirmed' : 'Payment failed'),
        mpesaRef: data.mpesaRef || null,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod || 'mpesa',
        timestamp: data.timestamp || Date.now(),
      };

      setPayments((prev) => {
        // Deduplicate by checkoutRequestId
        const existing = prev.findIndex(p => p.checkoutRequestId === payment.checkoutRequestId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = payment;
          return updated;
        }
        // Add new payment and limit to maxVisible
        return [payment, ...prev].slice(0, maxVisible);
      });
    },
  });

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPayments((prev) => prev.filter((p) => now - p.timestamp < 30000));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const dismiss = useCallback((id) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setPayments([]);
  }, []);

  if (payments.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000, maxWidth: 380 }}>
      {/* Notification toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ee6100, #f97316)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(238,97,0,0.4)',
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <span style={{ fontSize: 20 }}>💰</span>
        {payments.length > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: '#ef4444',
            color: '#fff',
            borderRadius: '50%',
            width: 20,
            height: 20,
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(239,68,68,0.5)',
          }}>
            {payments.length}
          </span>
        )}
      </button>

      {/* Notifications list */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: 60,
          right: 0,
          width: 360,
          background: '#111827',
          border: '1px solid #1e293b',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>💰</span>
              <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>Payment Updates</span>
              <span style={{
                background: 'rgba(16,185,129,0.2)',
                color: '#10b981',
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 4,
                fontWeight: 600,
              }}>LIVE</span>
            </div>
            <button
              onClick={clearAll}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Clear all
            </button>
          </div>

          {/* Payment items */}
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {payments.map((payment) => {
              const colors = PAYMENT_COLORS[payment.type] || PAYMENT_COLORS.failed;
              const icon = PAYMENT_ICONS[payment.type] || '💳';
              
              return (
                <div
                  key={payment.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #1e293b',
                    background: colors.bg,
                    borderLeft: `3px solid ${colors.border}`,
                    animation: 'slideIn 0.3s ease-out',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                      <span style={{ fontSize: 20 }}>{icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>
                            {formatKES(payment.amount)}
                          </span>
                          <span style={{
                            color: colors.text,
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                          }}>
                            {payment.type === 'cash_switch' ? 'Cash on Pickup' : payment.paymentStatus}
                          </span>
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
                          Order: {payment.orderNumber}
                        </div>
                        {payment.mpesaRef && (
                          <div style={{ color: '#64748b', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>
                            Ref: {payment.mpesaRef}
                          </div>
                        )}
                        <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
                          {payment.message}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => dismiss(payment.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: 4,
                        fontSize: 14,
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: '8px 16px',
            borderTop: '1px solid #1e293b',
            textAlign: 'center',
          }}>
            <span style={{ color: '#64748b', fontSize: 11 }}>
              Auto-dismiss in 30s • Click to expand details
            </span>
          </div>
        </div>
      )}

      <style>{`\n        @keyframes slideIn {\n          from { transform: translateX(100%); opacity: 0; }\n          to { transform: translateX(0); opacity: 1; }\n        }\n      `}</style>
    </div>
  );
}
