import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (success) {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            navigate('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [success, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Security token is missing from the link.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: token.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || 'Could not reset password. The link may have expired.');
      }
    } catch {
      setError('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0c0f17',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        color: '#f5f5f7',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: '#161922',
          borderRadius: 24,
          padding: '36px 30px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              backgroundColor: 'rgba(0, 122, 255, 0.15)',
              border: '1.5px solid rgba(0, 122, 255, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              color: '#007aff',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.4px', margin: '0 0 6px', color: '#ffffff' }}>
            Change Password
          </h1>
          <p style={{ fontSize: 13, color: '#8e8e93', margin: 0 }}>
            Set your new password for your FitMetrics account.
          </p>
        </div>

        {/* Missing Token Banner */}
        {!token && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                backgroundColor: 'rgba(255, 59, 48, 0.12)',
                color: '#ff453a',
                border: '1px solid rgba(255, 59, 48, 0.3)',
                padding: '12px 14px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              The reset link is invalid or missing the security token. Please use the exact link sent to your email.
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                backgroundColor: '#007aff',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                padding: '13px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Back to Sign In
            </button>
          </div>
        )}

        {/* Success Screen */}
        {token && success && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'rgba(48, 209, 88, 0.15)',
                border: '2px solid #30d158',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#30d158',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h3 style={{ fontSize: 19, fontWeight: 800, margin: 0, color: '#ffffff' }}>
              Password Updated!
            </h3>

            <p style={{ fontSize: 14, color: '#8e8e93', margin: 0, lineHeight: 1.5 }}>
              Your password has been changed successfully. You can now sign in with your new password.
            </p>

            {countdown !== null && (
              <div
                style={{
                  fontSize: 13,
                  color: '#007aff',
                  fontWeight: 600,
                  backgroundColor: 'rgba(0, 122, 255, 0.1)',
                  padding: '8px 16px',
                  borderRadius: 9999,
                }}
              >
                Redirecting to site in {countdown}s...
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                width: '100%',
                backgroundColor: '#007aff',
                color: '#ffffff',
                border: 'none',
                borderRadius: 14,
                padding: '14px',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: 6,
              }}
            >
              Go to Sign In Now
            </button>
          </div>
        )}

        {/* Reset Form */}
        {token && !success && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(255, 59, 48, 0.12)',
                  color: '#ff453a',
                  border: '1px solid rgba(255, 59, 48, 0.3)',
                  padding: '11px 14px',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {error}
              </div>
            )}

            {/* Input 1: New password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: '#8e8e93',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                NEW PASSWORD
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    paddingRight: 64,
                    borderRadius: 14,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundColor: '#0d1017',
                    color: '#ffffff',
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    background: 'none',
                    border: 'none',
                    color: '#8e8e93',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.4px',
                    cursor: 'pointer',
                    padding: '4px 6px',
                  }}
                >
                  {showNewPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* Input 2: Confirm password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  color: '#8e8e93',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                CONFIRM PASSWORD
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    paddingRight: 64,
                    borderRadius: 14,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundColor: '#0d1017',
                    color: '#ffffff',
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    background: 'none',
                    border: 'none',
                    color: '#8e8e93',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.4px',
                    cursor: 'pointer',
                    padding: '4px 6px',
                  }}
                >
                  {showConfirmPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                backgroundColor: '#007aff',
                color: '#ffffff',
                border: 'none',
                fontSize: 15,
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
                boxShadow: '0 4px 14px rgba(0, 122, 255, 0.35)',
              }}
            >
              {loading ? 'Updating...' : 'Change Password'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: '#8e8e93',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                padding: 4,
              }}
            >
              Cancel and return
            </button>
          </form>
        )}
      </div>
    </div>
  );
}