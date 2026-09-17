import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';

export default function ConfirmActionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { success: true/false, message: string, actionType: string }
  const [redirectCountdown, setRedirectCountdown] = useState(null);

  React.useEffect(() => {
    if (result && result.success) {
      setRedirectCountdown(3);
      const target = result.actionType === 'DELETE_ACCOUNT' ? '/' : '/dashboard';
      const interval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            navigate(target);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [result, navigate]);

  const handleExecuteVerification = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const res = await fetchApi('/auth/verify-action', {
        method: 'POST',
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        // Clear appropriate local storage caches
        if (data.actionType === 'RESET_PROGRESS') {
          Object.keys(localStorage).forEach((key) => {
            if (
              key.startsWith('completed_workouts_') ||
              key.startsWith('fitmetrics_cali') ||
              key.startsWith('fitmetrics_calisthenics')
            ) {
              localStorage.removeItem(key);
            }
          });
        } else if (data.actionType === 'DELETE_ACCOUNT') {
          localStorage.clear();
        }

        setResult({
          success: true,
          message: data.message,
          actionType: data.actionType,
        });
      } else {
        setResult({
          success: false,
          message: data.message || 'Verification failed. The link may have expired or was already used.',
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: 'Could not connect to the server. Please check your connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: 480,
          width: '100%',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 28,
          padding: '36px 30px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* Top Header */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            FITMETRICS SECURITY
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: '-0.5px',
              margin: 0,
              color: 'var(--text-primary)',
            }}
          >
            Action Verification
          </h1>
        </div>

        {/* State 1: No token provided */}
        {!token && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                border: '1.5px solid var(--accent-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-red)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              No security confirmation token was provided in the link. Please use the exact link sent to your email.
            </p>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="ios-button-primary"
              style={{ padding: '12px 28px', borderRadius: 9999, fontSize: 14, fontWeight: 700, marginTop: 8 }}
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* State 2: Ready to Confirm */}
        {token && !result && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                border: '2px solid var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, maxWidth: 380 }}>
              You are about to execute a protected account action. For your safety, click the authorization button below to confirm.
            </p>

            <button
              type="button"
              onClick={handleExecuteVerification}
              disabled={loading}
              className="ios-button-primary"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Authorizing & Executing...' : 'Authorize Action Now'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="ios-button-secondary"
              style={{ padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}
            >
              Cancel & Return
            </button>
          </div>
        )}

        {/* State 3: Success */}
        {result && result.success && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: 'rgba(48, 209, 88, 0.12)',
                border: '2px solid var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-green)',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {result.actionType === 'DELETE_ACCOUNT' ? 'Account Deleted' : 'Progress Reset Completed'}
            </h3>

            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, maxWidth: 360 }}>
              {result.message}
            </p>

            {redirectCountdown !== null && (
              <div style={{
                fontSize: 13,
                color: 'var(--accent-blue)',
                fontWeight: 600,
                backgroundColor: 'rgba(0, 122, 255, 0.08)',
                padding: '8px 16px',
                borderRadius: 9999,
              }}>
                Redirecting automatically to official site in {redirectCountdown}s...
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate(result.actionType === 'DELETE_ACCOUNT' ? '/' : '/dashboard')}
              className="ios-button-primary"
              style={{ width: '100%', padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 800, marginTop: 4 }}
            >
              {result.actionType === 'DELETE_ACCOUNT' ? 'Return to Welcome Page' : 'Continue to Dashboard'}
            </button>
          </div>
        )}

        {/* State 4: Error */}
        {result && !result.success && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: '100%' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 59, 48, 0.12)',
                border: '2px solid var(--accent-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-red)',
              }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Action Failed
            </h3>

            <p style={{ fontSize: 14, color: 'var(--accent-red)', margin: 0, lineHeight: 1.5, maxWidth: 360, fontWeight: 600 }}>
              {result.message}
            </p>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="ios-button-secondary"
              style={{ width: '100%', padding: '13px', borderRadius: 14, fontSize: 14, fontWeight: 700, marginTop: 8 }}
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
