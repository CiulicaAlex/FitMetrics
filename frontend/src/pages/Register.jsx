import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchApi, getApiErrorMessage } from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('Male');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Invisible bot trap
    if (honeypot) {
      setLoading(true);
      setTimeout(() => setLoading(false), 500);
      return;
    }

    if (!fullName.trim() || !email.trim() || !password || !gender) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          gender,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } else {
        setError(await getApiErrorMessage(res, 'Could not create account.'));
      }
    } catch {
      setError('Could not connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

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
      <div style={{ textAlign: 'center', marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 54,
          height: 54,
          borderRadius: 14,
          backgroundColor: '#ff2d55',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 20px rgba(255, 45, 85, 0.35)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.3px', margin: 0, color: 'var(--text-primary)' }}>
          FitMetrics
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Create your Apple Health profile
        </p>
      </div>

      {/* Card */}
      <div className="ios-card" style={{ width: '100%', maxWidth: 440, borderRadius: 20, padding: '28px 26px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          Create Account
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

        {success && (
          <div style={{
            backgroundColor: 'rgba(48, 209, 88, 0.12)',
            color: 'var(--accent-green)',
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
          }}>
            Account created successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              FULL NAME
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              style={{
                width: '100%',
                padding: '11px 14px',
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
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@fitmetrics.com"
              style={{
                width: '100%',
                padding: '11px 14px',
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

          {/* Gender Segmented Control */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              GENDER
            </label>
            <div className="ios-segmented-control" style={{ width: '100%' }}>
              {['Male', 'Female', 'Other'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`ios-segment-btn ${gender === g ? 'active' : ''}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              PASSWORD (MIN 6 CHARS)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '11px 14px',
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
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              CONFIRM PASSWORD
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '11px 14px',
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
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                {showConfirmPassword ? 'HIDE' : 'SHOW'}
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
              marginTop: 8,
              padding: '13px',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              width: '100%',
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/" style={{ color: '#007aff', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
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
      </div>
    </div>
  );
}
