// FitMetrics Lightweight Privacy-First Analytics Utility
// Compliant with GDPR/CCPA - Only tracks if user explicitly consented to non-essential metrics

export const hasAnalyticsConsent = () => {
  try {
    if (typeof window === 'undefined') return false;
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return false;
    return localStorage.getItem('fitmetrics_cookie_consent') === 'all';
  } catch {
    return false;
  }
};

export const trackPageView = (path) => {
  if (!hasAnalyticsConsent()) return;

  if (import.meta.env.DEV) {
    console.debug(`[Analytics] Page View: ${path}`);
  }
  // If window.gtag or custom endpoint exists:
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', { page_path: path });
  }
};

export const trackEvent = (eventName, eventProps = {}) => {
  if (!hasAnalyticsConsent()) return;

  if (import.meta.env.DEV) {
    console.debug(`[Analytics] Event: ${eventName}`, eventProps);
  }
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventProps);
  }
};