import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-primary)',
        padding: '40px 20px 80px',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 780,
          margin: '0 auto',
        }}
      >
        {/* Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              color: '#007aff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            Last Updated: September 2026
          </span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              backgroundColor: 'rgba(255, 45, 85, 0.12)',
              color: '#ff2d55',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Legal & Security
          </div>
          <h1
            style={{
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: '-1px',
              margin: '0 0 10px',
              lineHeight: 1.15,
            }}
          >
            Privacy Policy
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            FitMetrics is designed from the ground up to keep your physical vitals, workout statistics, and health milestones private, secure, and strictly under your control.
          </p>
        </div>

        {/* Content Sections in Apple Inset Grouped Card */}
        <div
          className="ios-card"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 20,
            padding: '32px 28px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            lineHeight: 1.65,
            fontSize: 15,
            color: 'var(--text-secondary)',
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              1. Information We Collect
            </h2>
            <p style={{ margin: 0 }}>
              FitMetrics processes only the essential data required to power your personalized workout tracking:
            </p>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              <li><strong>Account Credentials:</strong> Full name, email address, and cryptographically hashed passwords (salted with BCrypt).</li>
              <li><strong>Fitness Vitals & Analytics:</strong> Height, weight, gender, workout routines, exercise logs, repetitions, load volume, and calisthenics skill masteries.</li>
              <li><strong>Run Tracking Metrics:</strong> Route coordinates, running distances, paces, duration, and estimated calories burned.</li>
            </ul>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              2. Row-Level Security & Data Isolation
            </h2>
            <p style={{ margin: 0 }}>
              We enforce strict multi-tenant <strong>Row-Level Security (RLS)</strong> at the architectural layer. Every database query automatically filters records by your authenticated user identifier. No user can ever view, modify, or tamper with another individual's training logs or vitals.
            </p>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              3. Cookies & Session Storage
            </h2>
            <p style={{ margin: 0 }}>
              We use strictly necessary, cryptographically signed HTTP-only session cookies (<code>SameSite=Lax</code>, <code>HttpOnly</code>) to keep you securely signed in. We do not sell your personal data or use third-party cross-site advertising trackers.
            </p>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              4. Data Ownership & Permanent Deletion
            </h2>
            <p style={{ margin: 0 }}>
              You retain 100% ownership of your fitness logs. You can permanently delete your account, workout history, and personal vitals at any time from your Account Settings. Account deletion requires a single-use verification email and completely purges all associated records from our systems.
            </p>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              5. Contact & Data Protection Officer
            </h2>
            <p style={{ margin: 0 }}>
              If you have any questions or requests regarding your data rights under GDPR or CCPA, please contact our support team at <a href="mailto:support@fitmetrics.app" style={{ color: '#007aff', textDecoration: 'none', fontWeight: 600 }}>support@fitmetrics.app</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}