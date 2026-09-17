import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
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
              backgroundColor: 'rgba(0, 122, 255, 0.12)',
              color: '#007aff',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Terms of Service
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
            Terms & Conditions
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Please read these terms carefully before utilizing the FitMetrics workout tracking, calisthenics progression, and running analysis platform.
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
              1. Acceptance of Terms
            </h2>
            <p style={{ margin: 0 }}>
              By creating an account or using FitMetrics, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these terms, please do not use the application.
            </p>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              2. Fitness & Health Disclaimer
            </h2>
            <p style={{ margin: 0 }}>
              FitMetrics provides workout logs, training programs, and exercise demonstrations for informational and fitness tracking purposes only. We are not a medical healthcare provider. You should always consult with a physician or qualified healthcare professional before beginning any new physical exercise regimen, weight training program, or intense calisthenics routines.
            </p>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              3. Account Security & User Conduct
            </h2>
            <p style={{ margin: 0 }}>
              You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree not to attempt to circumvent security controls, perform automated scraping, or tamper with multi-tenant row isolation.
            </p>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              4. Modifications & Availability
            </h2>
            <p style={{ margin: 0 }}>
              We continuously improve FitMetrics and may update, enhance, or modify features over time. We strive for high service reliability and data integrity while maintaining complete protection of your personal records.
            </p>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              5. Governing Law
            </h2>
            <p style={{ margin: 0 }}>
              These Terms shall be governed by and construed in accordance with standard international consumer protection regulations and applicable local laws.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}