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

  if (checkingAuth) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div className="auth-header" style={styles.headerWrap}>
        <h1 style={styles.appTitle}>
          <span>Pulse</span>
          <span style={{ color: '#10b981', marginLeft: 4 }}>Fit</span>
        </h1>
        <p style={styles.appSubtitle}>Muscle Tracking and Progress System</p>
      </div>

      <div className="auth-card" style={styles.card}>
        <h2 style={styles.cardTitle}>Sign In</h2>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@fitmetrics.com"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>PASSWORD</label>
            <div style={styles.inputWrap}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.inputWithToggle}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.toggleBtn}
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitButton}>
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        <div style={styles.footerLink}>
          <span>Don't have an account? </span>
          <Link to="/register" style={styles.link}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    backgroundColor: '#09090b',
  },
  centerContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b',
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #27272a',
    borderTopColor: '#f97316',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  headerWrap: {
    textAlign: 'center',
    marginBottom: 32,
  },
  appTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: '2px',
    marginBottom: 6,
  },
  appSubtitle: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: 12,
    padding: '32px 28px',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    padding: '10px 14px',
    borderRadius: 6,
    fontSize: 12,
    marginBottom: 16,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '1px',
  },
  input: {
    backgroundColor: '#09090b',
    border: '1px solid #27272a',
    borderRadius: 6,
    color: '#ffffff',
    padding: '12px 14px',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputWithToggle: {
    width: '100%',
    backgroundColor: '#09090b',
    border: '1px solid #27272a',
    borderRadius: 6,
    color: '#ffffff',
    padding: '12px 64px 12px 14px',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  toggleBtn: {
    position: 'absolute',
    right: 10,
    background: 'none',
    border: 'none',
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.8px',
    padding: '4px 6px',
  },
  submitButton: {
    height: 48,
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderRadius: 6,
    fontWeight: 900,
    fontSize: 13,
    letterSpacing: '1px',
    marginTop: 8,
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
  },
  footerLink: {
    marginTop: 24,
    textAlign: 'center',
    color: '#71717a',
    fontSize: 12,
  },
  link: {
    color: '#ffffff',
    fontWeight: 800,
    marginLeft: 4,
  },
};
