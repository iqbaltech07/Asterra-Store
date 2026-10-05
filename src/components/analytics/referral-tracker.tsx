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

    // 3. Auto-Preserve URL Parameters on Navigation (with 1-time discount check)
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
          const storedEmail = (() => {
            try {
              return localStorage.getItem('asterra_customer_email') || '';
            } catch { return ''; }
          })();
          const customerEmail = storedEmail.trim().toLowerCase();
          const shouldValidate = Boolean(customerEmail && customerEmail.includes('@'));

          const inject = () => {
            const currentUrl = new URL(window.location.href);
            if (currentUrl.searchParams.get('ref')) return;
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
          };

          if (shouldValidate) {
            fetch(`/api/v1/affiliate/validate-referral?code=${encodeURIComponent(storedRef)}&email=${encodeURIComponent(customerEmail)}`)
              .then((r) => r.json())
              .then((json) => {
                if (json.valid && json.data && json.data.discountEligible === false) {
                  try {
                    localStorage.removeItem('asterra_ref');
                    document.cookie = 'asterra_ref=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                  } catch {}
                  const currentUrl = new URL(window.location.href);
                  if (currentUrl.searchParams.has('ref')) {
                    currentUrl.searchParams.delete('ref');
                    window.history.replaceState(window.history.state, '', currentUrl.pathname + currentUrl.search + currentUrl.hash);
                  }
                  return;
                }
                inject();
              })
              .catch(() => inject());
          } else {
            inject();
          }
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
