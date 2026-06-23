import { useEffect } from 'react';

export function CloudflareAnalytics() {
  useEffect(() => {
    // Prevent duplicate scripts in development or re-renders
    if (document.querySelector('script[src*="cloudflareinsights.com"]')) return;

    const script = document.createElement('script');
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.defer = true;
    script.setAttribute(
      'data-cf-beacon',
      JSON.stringify({ token: '9d19c1460b584f839f39ce58a94493c0' })
    );

    document.body.appendChild(script);
  }, []);

  return null;
}