import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import WorkoutSession from './pages/WorkoutSession';
import Calisthenics from './pages/Calisthenics';
import RunTracker from './pages/RunTracker';
import ConfirmActionPage from './pages/ConfirmActionPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';
import BottomNav from './components/BottomNav';
import CookieConsent from './components/CookieConsent';
import { trackPageView } from './utils/analytics';

function AppContent() {
  const location = useLocation();
  const isPublicLegal = location.pathname === '/privacy' || location.pathname === '/terms';
  const isAuthPage = location.pathname === '/' || location.pathname === '/register' || location.pathname === '/verify-action' || location.pathname === '/reset-password' || isPublicLegal;

  React.useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workouts" element={<Workouts />} />
        <Route path="/workout-session/:id" element={<WorkoutSession />} />
        <Route path="/calisthenics" element={<Calisthenics />} />
        <Route path="/run" element={<RunTracker />} />
        <Route path="/verify-action" element={<ConfirmActionPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Render Apple iOS Tab Bar on Authenticated App Pages */}
      {!isAuthPage && <BottomNav />}

      {/* Non-intrusive Apple HIG Cookie & Privacy Consent Banner */}
      <CookieConsent />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}
