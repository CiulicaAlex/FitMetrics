import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';

export default function Navbar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountRef = useRef(null);

  const handleLogout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    navigate('/', { replace: true });
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
  const userId = user?.id || user?.Id || 1;
  const initial = fullName ? fullName.trim()[0].toUpperCase() : (email ? email[0].toUpperCase() : 'U');

  return (
    <nav style={styles.nav}>
      <div className="nav-container" style={styles.container}>
        <div className="nav-left" style={styles.left}>
          <Link to="/dashboard" style={styles.logoWrap}>
            <span style={styles.logoPulse}>Pulse</span>
            <span style={styles.logoFit}>Fit</span>
          </Link>

          <div className="nav-links" style={styles.links}>
            <Link
              to="/dashboard"
              className="nav-link"
              style={{
                ...styles.navLink,
                ...(location.pathname === '/dashboard' ? styles.navLinkActive : {}),
              }}
            >
              Dashboard
            </Link>
            <Link
              to="/workouts"
              className="nav-link"
              style={{
                ...styles.navLink,
                ...(location.pathname.startsWith('/workout') ? styles.navLinkActive : {}),
              }}
            >
              Workouts
            </Link>
          </div>
        </div>

        <div style={styles.right}>
          {/* Account Profile Popover Anchor */}
          <div ref={accountRef} style={styles.accountWrapper}>
            <button
              onClick={() => setShowAccountMenu((prev) => !prev)}
              style={{
                ...styles.avatarBtn,
                borderColor: showAccountMenu ? '#ffffff' : '#10b981',
              }}
              title="Click to view account details"
              aria-label="Account details"
            >
              {initial}
            </button>

            {showAccountMenu && (
              <div style={styles.accountDropdown}>
                <div style={styles.dropdownHeader}>
                  <div style={styles.avatarMini}>{initial}</div>
                  <div style={styles.headerInfo}>
                    <div style={styles.userName}>{fullName}</div>
                    <div style={styles.userEmail}>{email}</div>
                  </div>
                </div>

                <div style={styles.dropdownDivider} />

                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>FULL NAME</span>
                  <span style={styles.detailValue}>{fullName}</span>
                </div>

                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>EMAIL ADDRESS</span>
                  <span style={styles.detailValue}>{email}</span>
                </div>

                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>ACCOUNT ID</span>
                  <span style={styles.detailValueId}>#{userId}</span>
                </div>

                {(user?.height || user?.weight) && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>STATS</span>
                    <span style={styles.detailValue}>
                      {user.height || 180} cm • {user.weight || 75} kg
                    </span>
                  </div>
                )}

                <div style={styles.dropdownFooter}>
                  <span style={styles.statusDot} />
                  <span style={styles.statusText}>Active Account</span>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    backgroundColor: '#0e0e11',
    borderBottom: '1px solid #1f1f23',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '14px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    minWidth: 0,
    flex: 1,
    overflow: 'hidden',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: '0.5px',
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoPulse: {
    color: '#ffffff',
  },
  logoFit: {
    color: '#10b981',
    marginLeft: 3,
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    flexShrink: 0,
  },
  navLink: {
    color: '#71717a',
    fontSize: 14,
    fontWeight: 700,
    textDecoration: 'none',
    transition: 'color 0.15s ease',
    padding: '4px 0',
    whiteSpace: 'nowrap',
  },
  navLinkActive: {
    color: '#ffffff',
    borderBottom: '2px solid #10b981',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  accountWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: '#10b981',
    color: '#09090b',
    fontWeight: 900,
    fontSize: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #10b981',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.15s ease',
  },
  accountDropdown: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    width: 280,
    backgroundColor: '#121216',
    border: '1px solid #27272a',
    borderRadius: 10,
    padding: '16px',
    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.75)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  dropdownHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  avatarMini: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    backgroundColor: '#18181c',
    border: '1.5px solid #10b981',
    color: '#10b981',
    fontWeight: 900,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  userName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userEmail: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: 2,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#1f1f25',
    margin: '2px 0',
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    backgroundColor: '#0c0c0f',
    border: '1px solid #1c1c22',
    borderRadius: 6,
    padding: '8px 10px',
  },
  detailLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.6px',
  },
  detailValue: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: 700,
    wordBreak: 'break-all',
  },
  detailValueId: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: '0.5px',
  },
  dropdownFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#10b981',
  },
  statusText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.4px',
  },
  logoutBtn: {
    border: '1px solid #27272a',
    borderRadius: 6,
    backgroundColor: '#18181b',
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.5px',
    padding: '7px 12px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
};
