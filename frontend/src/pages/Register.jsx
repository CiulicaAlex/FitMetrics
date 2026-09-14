import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchApi } from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
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
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } else {
        const text = await res.text();
        let message = 'Could not create account.';
        try {
          const json = JSON.parse(text);
          if (json.message) message = json.message;
        } catch {
          if (text) message = text;
        }
        setError(message);
      }
    } catch (err) {
      setError('Could not connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerWrap}>
        <h1 style={styles.appTitle}>
          <span>Pulse</span>
          <span style={{ color: '#10b981', marginLeft: 4 }}>Fit</span>
        </h1>
        <p style={styles.appSubtitle}>Muscle Tracking and Progress System</p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Create Account</h2>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>Account created successfully! Redirecting...</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>FULL NAME</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alex Ciulica"
              style={styles.input}
              required
            />
          </div>

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

          <div style={styles.field}>
            <label style={styles.label}>CONFIRM PASSWORD</label>
            <div style={styles.inputWrap}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.inputWithToggle}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.toggleBtn}
              >
                {showConfirmPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitButton}>
            {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
          </button>
        </form>

        <div style={styles.footerLink}>
          <span>Already have an account? </span>
          <Link to="/" style={styles.link}>Sign In</Link>
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
  headerWrap: {
    textAlign: 'center',
    marginBottom: 28,
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
    padding: '30px 28px',
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
  successBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid #22c55e',
    color: '#86efac',
    padding: '10px 14px',
    borderRadius: 6,
    fontSize: 12,
    marginBottom: 16,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
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
    marginTop: 22,
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
