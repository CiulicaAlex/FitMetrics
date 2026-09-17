import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import { ThemeToggle } from '../context/ThemeContext';

export default function Navbar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmailSent, setDeleteEmailSent] = useState(false);
  const [deleteDevUrl, setDeleteDevUrl] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const accountRef = useRef(null);

  const handleLogout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    navigate('/', { replace: true });
  };

  const handleRequestDeleteEmail = async () => {
    setDeletingAccount(true);
    setDeleteError(null);

    try {
      const response = await fetchApi('/auth/request-action-confirmation', {
        method: 'POST',
        body: JSON.stringify({ actionType: 'DELETE_ACCOUNT' }),
      });
      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.message || 'Could not send verification email. Please try again.');
        return;
      }

      setDeleteEmailSent(true);
      if (data.devUrl) {
        setDeleteDevUrl(data.devUrl);
      }
    } catch {
      setDeleteError('Could not connect to the server. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleDirectDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      return;
    }
    setDeletingAccount(true);
    setDeleteError(null);
    try {
      const response = await fetchApi('/auth/account', {
        method: 'DELETE',
      });
      if (response.ok) {
        localStorage.clear();
        setShowDeleteConfirm(false);
        navigate('/', { replace: true });
      } else {
        const data = await response.json().catch(() => ({}));
        setDeleteError(data.message || 'Could not delete account. Please try again.');
      }
    } catch {
      setDeleteError('Could not connect to the server to delete account.');
    } finally {
      setDeletingAccount(false);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setShowAccountMenu(false);
      }
    };

    if (showAccountMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showAccountMenu]);

  const fullName = user?.fullName || user?.FullName || 'User';
  const email = user?.email || user?.Email || 'N/A';
  const gender = user?.gender || user?.Gender || 'MALE';
  const userId = user?.id || user?.Id || 1;
  const initial = fullName ? fullName.trim()[0].toUpperCase() : (email ? email[0].toUpperCase() : 'U');

  return (
    <>
      <header style={styles.nav}>
        <div className="nav-container" style={styles.container}>
          {/* Left: Brand / Large Title Area */}
          <div className="nav-left" style={styles.left}>
            <Link to="/dashboard" style={styles.logoWrap}>
              <div style={styles.appIconSquare}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <span style={styles.logoTitle}>FitMetrics</span>
            </Link>
          </div>



          {/* Right Actions: Theme & Apple ID Avatar */}
          <div className="nav-right" style={styles.right}>
            <ThemeToggle />

            {/* Profile Popover Anchor */}
            <div ref={accountRef} style={styles.accountWrapper}>
              <button
                type="button"
                onClick={() => setShowAccountMenu((prev) => !prev)}
                style={styles.avatarBtn}
                title="Apple ID & Profile"
                aria-label="Apple ID & Profile"
              >
                {initial}
              </button>

              {/* Apple ID Style Modal / Popover */}
              {showAccountMenu && (
                <div style={styles.accountDropdown}>
                  <div style={styles.dropdownHeader}>
                    <div style={styles.avatarBig}>{initial}</div>
                    <div style={styles.headerInfo}>
                      <div style={styles.userName}>{fullName}</div>
                      <div style={styles.userEmail}>{email}</div>
                    </div>
                  </div>

                  <div style={styles.iosListGroup}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Account ID</span>
                      <span style={styles.detailValue}>#{userId}</span>
                    </div>

                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Biological Gender</span>
                      <span style={styles.detailValue}>{gender}</span>
                    </div>

                    {(user?.height || user?.weight) && (
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Vitals</span>
                        <span style={styles.detailValue}>
                          {user.height || 180} cm • {user.weight || 75} kg
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={styles.actionsStack}>
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={styles.iosButtonAction}
                    >
                      Sign Out
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAccountMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      style={styles.deleteAccountBtn}
                    >
                      Delete Account...
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* iOS Destructive Confirmation Sheet: Email Verification Required */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmModal}>
            {!deleteEmailSent ? (
              <>
                <div style={styles.confirmIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <h3 style={styles.confirmTitle}>Delete Account</h3>
                <p style={styles.confirmText}>
                  This action cannot be undone. All your workouts, progress, and history will be permanently erased. You can delete your account directly now, or request an email verification link.
                </p>

                {deleteError && <div style={styles.confirmError}>{deleteError}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={handleDirectDelete}
                    style={{
                      ...styles.confirmDeleteBtn,
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#ff3b30',
                      color: '#fff',
                      fontWeight: 700,
                      borderRadius: 12,
                      border: 'none',
                      cursor: deletingAccount ? 'not-allowed' : 'pointer',
                    }}
                    disabled={deletingAccount}
                  >
                    {deletingAccount ? 'Deleting Account...' : 'Permanently Delete Account Now'}
                  </button>

                  <button
                    type="button"
                    onClick={handleRequestDeleteEmail}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'transparent',
                      color: 'var(--accent-blue)',
                      fontWeight: 600,
                      fontSize: 13,
                      borderRadius: 12,
                      border: '1px solid var(--accent-blue)',
                      cursor: deletingAccount ? 'not-allowed' : 'pointer',
                    }}
                    disabled={deletingAccount}
                  >
                    {deletingAccount ? 'Sending Email...' : 'Send Verification Email Instead'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteEmailSent(false);
                      setDeleteDevUrl(null);
                      setDeleteError(null);
                    }}
                    style={styles.cancelBtn}
                    disabled={deletingAccount}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  ...styles.confirmIcon,
                  backgroundColor: 'rgba(48, 209, 88, 0.12)',
                  color: 'var(--accent-green)',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={styles.confirmTitle}>Deletion Email Dispatched</h3>
                <p style={styles.confirmText}>
                  A confirmation link was sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. Please check your inbox and click the button within 30 minutes to confirm permanent deletion.
                </p>

                {deleteDevUrl && (
                  <div style={{ marginBottom: 14 }}>
                    <a
                      href={deleteDevUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        padding: '10px 14px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--accent-blue)',
                        textDecoration: 'none',
                        border: '1px dashed var(--accent-blue)',
                      }}
                    >
                      Open Confirmation Page
                    </a>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleDirectDelete}
                    style={{
                      ...styles.confirmDeleteBtn,
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#ff3b30',
                      color: '#fff',
                      fontWeight: 700,
                      borderRadius: 12,
                      border: 'none',
                      cursor: deletingAccount ? 'not-allowed' : 'pointer',
                    }}
                    disabled={deletingAccount}
                  >
                    {deletingAccount ? 'Deleting Account...' : 'Permanently Delete Account Now'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteEmailSent(false);
                      setDeleteDevUrl(null);
                      setDeleteError(null);
                    }}
                    className="ios-button-primary"
                    style={{ width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'var(--tabbar-bg)',
    backdropFilter: 'saturate(180%) blur(20px)',
    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
    borderBottom: '0.5px solid var(--border-subtle)',
    transition: 'background-color 0.25s ease, border-color 0.25s ease',
  },
  container: {
    maxWidth: 1080,
    width: '100%',
    boxSizing: 'border-box',
    margin: '0 auto',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    flex: '0 0 auto',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
  },
  appIconSquare: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#ff2d55',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(255, 45, 85, 0.35)',
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '-0.4px',
    color: 'var(--text-primary)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  accountWrapper: {
    position: 'relative',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: '#007aff',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)',
    transition: 'transform 0.15s ease',
  },
  accountDropdown: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    width: 290,
    backgroundColor: 'var(--bg-card)',
    border: '0.5px solid var(--border-subtle)',
    borderRadius: 18,
    padding: '16px',
    boxShadow: 'var(--shadow-floating)',
    zIndex: 110,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    backdropFilter: 'saturate(180%) blur(20px)',
    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
  },
  dropdownHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  avatarBig: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    backgroundColor: '#007aff',
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerInfo: {
    minWidth: 0,
  },
  userName: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userEmail: {
    fontSize: 12,
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: 2,
  },
  iosListGroup: {
    backgroundColor: 'var(--bg-main)',
    borderRadius: 12,
    border: '0.5px solid var(--border-subtle)',
    overflow: 'hidden',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderBottom: '0.5px solid var(--border-subtle)',
    fontSize: 13,
  },
  detailLabel: {
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  detailValue: {
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  actionsStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  iosButtonAction: {
    width: '100%',
    padding: '10px',
    borderRadius: 10,
    backgroundColor: 'var(--bg-main)',
    border: '0.5px solid var(--border-subtle)',
    color: '#007aff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
  },
  deleteAccountBtn: {
    width: '100%',
    padding: '8px',
    borderRadius: 8,
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ff3b30',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 999,
  },
  confirmModal: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'var(--bg-card)',
    borderRadius: 16,
    padding: 20,
    boxShadow: 'var(--shadow-floating)',
    textAlign: 'center',
  },
  confirmIcon: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    color: '#ff3b30',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 800,
    margin: '0 auto 12px',
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 6px',
  },
  confirmText: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    margin: '0 0 18px',
  },
  confirmError: {
    color: '#ff3b30',
    fontSize: 12,
    marginBottom: 12,
  },
  confirmActions: {
    display: 'flex',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'var(--bg-card-subtle)',
    border: '0.5px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  confirmDeleteBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ff3b30',
    border: 'none',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
};
