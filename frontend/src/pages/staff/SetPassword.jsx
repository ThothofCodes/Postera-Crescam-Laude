// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const token = searchParams.get('token');
  const userId = searchParams.get('userId');

  // Verify the token when component mounts
  useEffect(() => {
    if (!token || !userId) {
      toast.error('Invalid invitation link');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        setVerifying(true);
        const response = await api.post('/auth/verify-token', {
          token,
          userId
        });
        
        if (response.data.valid) {
          setValidToken(true);
        } else {
          toast.error('Invalid or expired invitation link');
        }
      } catch (error) {
        console.error('Token verification error:', error);
        toast.error('Invalid or expired invitation link');
      } finally {
        setLoading(false);
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, userId]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setSubmitting(true);
      
      await api.post('/auth/set-password', {
        token,
        userId,
        password: formData.password
      });

      toast.success('Password set successfully! Redirecting to login...');
      
      // Wait a bit before redirecting
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Set password error:', error);
      toast.error(error.response?.data?.message || 'Failed to set password');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: 'var(--bg-void)',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ fontSize: '1.5rem', color: '#F4F1EA' }}>Verifying invitation...</div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: 'var(--bg-void)',
        fontFamily: "'Inter', sans-serif",
        color: '#F4F1EA'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2>Invalid Invitation</h2>
          <p style={{ color: '#A9C4BE', marginBottom: '1rem' }}>
            The invitation link is invalid or has expired.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: 'var(--bg-void)',
      fontFamily: "'Inter', sans-serif",
      padding: '1rem'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        background: 'var(--bg-card)',
        borderRadius: '12px',
        padding: '2rem',
        border: '1px solid rgba(240, 238, 255, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
          <h2 style={{ color: '#F4F1EA', margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
            Set Your Password
          </h2>
          <p style={{ color: '#A9C4BE', fontSize: '0.875rem' }}>
            Welcome to Postera Crescam Laude! Please set your password to activate your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="password" style={{ 
              display: 'block', 
              color: '#F4F1EA', 
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              New Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="Enter your password"
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
            <label htmlFor="confirmPassword" style={{ 
              display: 'block', 
              color: '#F4F1EA', 
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="Confirm your password"
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

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #EE6100, #00b4ff)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginTop: '1rem'
            }}
          >
            {submitting ? 'Setting Password...' : 'Set Password'}
          </button>
        </form>

        <div style={{ 
          marginTop: '1rem', 
          paddingTop: '1rem', 
          borderTop: '1px solid rgba(240, 238, 255, 0.1)',
          textAlign: 'center'
        }}>
          <p style={{ color: '#A9C4BE', fontSize: '0.75rem' }}>
            After setting your password, you'll be able to access your staff portal
          </p>
        </div>
      </div>
    </div>
  );
}