'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function PageViewTracker() {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    // Get or create visitor ID
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('visitor_id', visitorId);
    }

    // Track page view
    fetch('/api/track/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_path: pathname,
        user_id: user?.id || null,
        visitor_id: visitorId,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
      }),
    }).catch(() => {
      // Silently fail - tracking is non-critical
    });
  }, [pathname, user]);

  return null;
}
