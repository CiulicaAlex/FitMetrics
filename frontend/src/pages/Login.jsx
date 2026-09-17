import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchApi, getApiErrorMessage } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(null);
  const [honeypot, setHoneypot] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetchApi('/auth/me');
        if (res.ok) {
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (err) {
        // Not logged in, continue
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Invisible bot trap
    if (honeypot) {
      setLoading(true);
      setTimeout(() => setLoading(false), 500);
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      if (res.ok) {
        navigate('/dashboard');
      } else {
        setError(await getApiErrorMessage(res, 'Invalid email or password.'));
      }
    } catch {
      setError('Could not connect to backend server. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setForgotSuccess(null);

    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        setForgotSuccess(data);
      } else {
        setError(data.message || 'Error sending password reset email.');
      }
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: 'var(--bg-main)',
      color: 'var(--text-primary)',
      transition: 'background-color 0.25s ease',
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          backgroundColor: '#ff2d55',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 20px rgba(255, 45, 85, 0.35)',
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.3px', margin: 0, color: 'var(--text-primary)' }}>
          FitMetrics
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Apple Health & Fitness Tracking
        </p>
      </div>

      {/* Card */}
      <div className="ios-card" style={{ width: '100%', maxWidth: 400, borderRadius: 20, padding: '28px 26px' }}>
        {isForgotPassword ? (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              Reset Password
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 18px', lineHeight: 1.4 }}>
              Enter your email address to receive a secure password reset link.
            </p>

            {error && (
              <div style={{
                backgroundColor: 'rgba(255, 59, 48, 0.12)',
                color: 'var(--accent-red)',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            {forgotSuccess ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center', padding: '12px 0' }}>
                <div style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(48, 209, 88, 0.15)',
                  border: '2px solid #30d158',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#30d158',
                  margin: '0 auto',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0, fontWeight: 600, lineHeight: 1.5 }}>
                  {forgotSuccess.message}
                </p>
                {forgotSuccess.devUrl && (
                  <div style={{
                    marginTop: 6,
                    padding: '12px',
                    borderRadius: 12,
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    border: '1px solid rgba(0, 122, 255, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#007aff', letterSpacing: '0.5px' }}>
                      EMAIL SIMULATION MODE (DEV)
                    </span>
                    <a
                      href={forgotSuccess.devUrl}
                      style={{
                        display: 'inline-block',
                        padding: '8px 14px',
                        borderRadius: 8,
                        backgroundColor: '#007aff',
                        color: '#ffffff',
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      Open Password Reset Page
                    </a>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setForgotSuccess(null);
                    setError(null);
                  }}
                  className="ios-button-secondary"
                  style={{ padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600, marginTop: 8 }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    ACCOUNT EMAIL
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="user@fitmetrics.com"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: '0.5px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: 15,
                      outline: 'none',
                    }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="ios-button-primary"
                  style={{
                    marginTop: 6,
                    padding: '13px',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 700,
                    width: '100%',
                  }}
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'center',
                    padding: 4,
                  }}
                >
                  Back to Sign In
                </button>
              </form>
            )}
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
              Sign In
            </h2>

            {error && (
              <div style={{
                backgroundColor: 'rgba(255, 59, 48, 0.12)',
                color: 'var(--accent-red)',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@fitmetrics.com"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '0.5px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: 15,
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  PASSWORD
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      paddingRight: 60,
                      borderRadius: 12,
                      border: '0.5px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: 15,
                      outline: 'none',
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                      setForgotSuccess(null);
                      setForgotEmail(email);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#007aff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {/* Invisible spam protection honeypot */}
              <input
                type="text"
                name="website_hp"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: 'none', position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }}
                tabIndex="-1"
                autoComplete="off"
                aria-hidden="true"
              />

              <button
                type="submit"
                disabled={loading}
                className="ios-button-primary"
                style={{
                  marginTop: 6,
                  padding: '13px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  width: '100%',
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#007aff', fontWeight: 600, textDecoration: 'none' }}>
                Sign Up
              </Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
              <Link to="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>
                Privacy Policy
              </Link>
              <span style={{ opacity: 0.4 }}>•</span>
              <Link to="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}>
                Terms of Service
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
