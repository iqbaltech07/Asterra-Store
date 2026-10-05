'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

function ReferralTrackerInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const urlRef = searchParams.get('ref');
    const urlCampaign = searchParams.get('utm_campaign');
    const urlSource = searchParams.get('utm_source');
    const urlMedium = searchParams.get('utm_medium');

    // 1. If URL has ref parameter, store in localStorage & cookies
    if (urlRef && urlRef.trim()) {
      const normalizedCode = urlRef.trim().toUpperCase();

      try {
        localStorage.setItem('asterra_ref', normalizedCode);
        document.cookie = `asterra_ref=${encodeURIComponent(
          normalizedCode
        )}; path=/; max-age=2592000; SameSite=Lax`;

        if (urlCampaign && urlCampaign.trim()) {
          localStorage.setItem('asterra_utm_campaign', urlCampaign.trim());
          document.cookie = `asterra_utm_campaign=${encodeURIComponent(
            urlCampaign.trim()
          )}; path=/; max-age=2592000; SameSite=Lax`;
        }
        if (urlSource && urlSource.trim()) {
          localStorage.setItem('asterra_utm_source', urlSource.trim());
          document.cookie = `asterra_utm_source=${encodeURIComponent(
            urlSource.trim()
          )}; path=/; max-age=2592000; SameSite=Lax`;
        }
        if (urlMedium && urlMedium.trim()) {
          localStorage.setItem('asterra_utm_medium', urlMedium.trim());
          document.cookie = `asterra_utm_medium=${encodeURIComponent(
            urlMedium.trim()
          )}; path=/; max-age=2592000; SameSite=Lax`;
        }
      } catch {
        // ignore storage errors
      }

      // 2. Dispatch click telemetry once per session
      const sessionTrackedKey = `asterra_tracked_${normalizedCode}`;
      if (!sessionStorage.getItem(sessionTrackedKey)) {
        sessionStorage.setItem(sessionTrackedKey, 'true');
        fetch('/api/v1/affiliate/track-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: normalizedCode }),
        }).catch(() => {});
      }
    }

    // 3. Auto-Preserve URL Parameters on Navigation
    // Scope: Only allowed pages (/ , /products, /products/[id], /checkout)
    if (typeof window !== 'undefined') {
      const allowedPaths = ['/', '/products', '/checkout'];
      const isAllowed =
        allowedPaths.includes(pathname || '') ||
        (pathname || '').startsWith('/products/');

      if (isAllowed) {
        let storedRef = '';
        try {
          storedRef = localStorage.getItem('asterra_ref') || '';
        } catch {}

        if (storedRef && !searchParams.get('ref')) {
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('ref', storedRef);

          try {
            const storedCampaign = localStorage.getItem('asterra_utm_campaign');
            if (storedCampaign && !currentUrl.searchParams.has('utm_campaign')) {
              currentUrl.searchParams.set('utm_campaign', storedCampaign);
            }
            const storedSource = localStorage.getItem('asterra_utm_source');
            if (storedSource && !currentUrl.searchParams.has('utm_source')) {
              currentUrl.searchParams.set('utm_source', storedSource);
            }
          } catch {}

          const newUrl = currentUrl.pathname + currentUrl.search + currentUrl.hash;
          window.history.replaceState(window.history.state, '', newUrl);
        }
      }
    }
  }, [searchParams, pathname]);

  return null;
}

export function ReferralTracker() {
  return (
    <Suspense fallback={null}>
      <ReferralTrackerInner />
    </Suspense>
  );
}
