// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Global error boundary — catches render errors and shows a user-friendly fallback.

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to console (placeholder for Sentry integration)
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env?.DEV || false;

      return (
        <div
          role="alert"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#081916',
            color: '#e0e0e0',
            fontFamily: "'Poppins', sans-serif",
            zIndex: 99999,
          }}
        >
          <div
            style={{
              maxWidth: 520,
              padding: '40px 32px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(43,182,163,0.2)',
              borderRadius: 12,
              textAlign: 'center',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 24px',
                borderRadius: '50%',
                background: 'rgba(238,97,0,0.1)',
                border: '2px solid #EE6100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
              }}
            >
              ⚠️
            </div>

            {/* Title */}
            <h2
              style={{
                margin: '0 0 8px',
                fontSize: 20,
                fontWeight: 600,
                color: '#EE6100',
                fontFamily: "'Rajdhani', sans-serif",
              }}
            >
              Something went wrong
            </h2>

            {/* Message */}
            <p style={{ margin: '0 0 24px', fontSize: 14, lineHeight: 1.6, opacity: 0.8 }}>
              An unexpected error occurred. You can try again or reload the page.
            </p>

            {/* Dev error details */}
            {isDev && this.state.error && (
              <details
                style={{
                  marginBottom: 24,
                  padding: 12,
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 8,
                  textAlign: 'left',
                  fontSize: 12,
                  fontFamily: "'Share Tech Mono', monospace",
                  color: '#ff6b6b',
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                <summary style={{ cursor: 'pointer', color: '#aaa', marginBottom: 8 }}>
                  Error details (dev only)
                </summary>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '10px 24px',
                  background: 'transparent',
                  color: '#2BB6A3',
                  border: '1px solid #2BB6A3',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(43,182,163,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 24px',
                  background: '#EE6100',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '1';
                }}
              >
                Reload Page
              </button>
            </div>

            {/* Brand footer */}
            <p
              style={{
                marginTop: 24,
                fontSize: 11,
                opacity: 0.4,
                fontFamily: "'Rajdhani', sans-serif",
              }}
            >
              POSTERA CRESCAM LAUDE — PCL Tech Support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
