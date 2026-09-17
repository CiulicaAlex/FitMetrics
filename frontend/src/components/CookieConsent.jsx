import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('fitmetrics_cookie_consent');
      if (!consent) {
        // Delay slightly for smooth entrance
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage access blocked or restricted
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('fitmetrics_cookie_consent', 'all');
    } catch {}
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem('fitmetrics_cookie_consent', 'essential');
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie Consent"
      style={{
        position: 'fixed',
        bottom: 24,
        left: 16,
        right: 16,
        margin: '0 auto',
        maxWidth: 520,
        zIndex: 99999,
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderRadius: 22,
        padding: '20px 24px',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        animation: 'fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: 'rgba(255, 45, 85, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff2d55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
            <path d="M8.5 8.5v.01" />
            <path d="M16 15.5v.01" />
            <path d="M12 12v.01" />
            <path d="M11 17v.01" />
            <path d="M7 13v.01" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
            Cookie & Privacy Notice
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
            FitMetrics uses strictly necessary cookies for session security and optional privacy-friendly metrics to analyze workout performance. Learn more in our{' '}
            <Link to="/privacy" style={{ color: '#007aff', textDecoration: 'none', fontWeight: 600 }}>
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={handleAcceptAll}
          className="ios-button-primary"
          style={{
            flex: 1,
            padding: '11px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Accept All
        </button>
        <button
          type="button"
          onClick={handleEssentialOnly}
          className="ios-button-secondary"
          style={{
            flex: 1,
            padding: '11px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Essential Only
        </button>
      </div>
    </aside>
  );
}