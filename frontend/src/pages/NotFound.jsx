import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="ios-card"
        style={{
          maxWidth: 440,
          width: '100%',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 28,
          padding: '40px 32px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: '-2px',
            color: 'var(--accent-red)',
            lineHeight: 1,
          }}
        >
          404
        </div>

        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 8px',
            }}
          >
            Page Not Found
          </h1>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            The link you navigated to does not exist or has been moved to another location.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 10 }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="ios-button-primary"
            style={{
              flex: 1,
              padding: '13px',
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Go to Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="ios-button-secondary"
            style={{
              flex: 1,
              padding: '13px',
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Login Page
          </button>
        </div>
      </div>
    </div>
  );
}
