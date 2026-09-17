import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TABS = [
  {
    id: 'dashboard',
    label: 'Summary',
    path: '/dashboard',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? '0' : '2'} strokeLinecap="round" strokeLinejoin="round">
        {/* Apple Health Heart / Pulse summary symbol */}
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    id: 'workouts',
    label: 'Gym',
    path: '/workouts',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.4' : '1.9'} strokeLinecap="round" strokeLinejoin="round">
        {/* Apple Fitness Dumbbell */}
        <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12" />
      </svg>
    ),
  },
  {
    id: 'calisthenics',
    label: 'Calisthenics',
    path: '/calisthenics',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.4' : '1.9'} strokeLinecap="round" strokeLinejoin="round">
        {/* Horizontal Calisthenics Bar */}
        <path d="M2 12.5h20" strokeWidth={active ? '2.6' : '2'} />
        {/* Athlete head above bar */}
        <circle cx="12" cy="4" r="2" fill={active ? 'currentColor' : 'none'} />
        {/* Locked out arms pressing down on bar */}
        <path d="M8.5 12.5V7.5h7v5" />
        {/* Torso above the bar */}
        <path d="M12 6v6.5" />
        {/* Legs hanging below bar */}
        <path d="M10.5 12.5L9.5 21" />
        <path d="M13.5 12.5L14.5 21" />
      </svg>
    ),
  },
  {
    id: 'run',
    label: 'Running',
    path: '/run',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        {/* Clear, iconic running athlete */}
        <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 6.4 1.3c.7.2 1.5-.3 1.7-1.1z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab index based on pathname
  const activeIndex = (() => {
    const pathname = location.pathname;
    if (pathname.startsWith('/calisthenics')) return 2;
    if (pathname.startsWith('/run')) return 3;
    if (pathname.startsWith('/workouts') || pathname.startsWith('/workout-session')) return 1;
    return 0; // Default to Summary (Dashboard)
  })();

  return (
    <div className="bottom-nav-wrapper">
      <nav className="bottom-nav-bar" aria-label="Apple Tab Bar">
        {TABS.map((tab, idx) => {
          const isActive = activeIndex === idx;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              type="button"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="bottom-nav-icon-wrap">
                {tab.icon(isActive)}
              </div>
              <span className="bottom-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
