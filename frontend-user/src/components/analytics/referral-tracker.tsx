'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

function ReferralTrackerInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const urlRef = searchParams.get('ref');
    const urlCampaign = searchParams.get('campaign') || searchParams.get('utm_campaign');
    const urlSource = searchParams.get('utm_source');
    const urlMedium = searchParams.get('utm_medium');

    // 1. If URL has ref parameter, store in localStorage & cookies
    const normalizedCode = urlRef && urlRef.trim() ? urlRef.trim().toUpperCase() : '';
    if (normalizedCode) {
      try {
        localStorage.setItem('asterra_ref', normalizedCode);
        document.cookie = `asterra_ref=${encodeURIComponent(
          normalizedCode
        )}; path=/; max-age=2592000; SameSite=Lax`;
      } catch {
        // ignore storage errors
      }
    }

    // 2. If URL has campaign parameter, store in localStorage & cookies
    const normalizedCamp = urlCampaign && urlCampaign.trim() ? urlCampaign.trim() : '';
    if (normalizedCamp) {
      try {
        localStorage.setItem('asterra_campaign', normalizedCamp);
        localStorage.setItem('asterra_utm_campaign', normalizedCamp);
        document.cookie = `asterra_campaign=${encodeURIComponent(
          normalizedCamp
        )}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `asterra_utm_campaign=${encodeURIComponent(
          normalizedCamp
        )}; path=/; max-age=2592000; SameSite=Lax`;
      } catch {}
    }

    if (urlSource && urlSource.trim()) {
      try {
        localStorage.setItem('asterra_utm_source', urlSource.trim());
        document.cookie = `asterra_utm_source=${encodeURIComponent(
          urlSource.trim()
        )}; path=/; max-age=2592000; SameSite=Lax`;
      } catch {}
    }

    if (urlMedium && urlMedium.trim()) {
      try {
        localStorage.setItem('asterra_utm_medium', urlMedium.trim());
        document.cookie = `asterra_utm_medium=${encodeURIComponent(
          urlMedium.trim()
        )}; path=/; max-age=2592000; SameSite=Lax`;
      } catch {}
    }

    // 3. Dispatch click telemetry to server (Hybrid Cookie + DB Session)
    if (normalizedCode || normalizedCamp) {
      const sessionTrackedKey = `asterra_tracked_${normalizedCode || 'none'}_${normalizedCamp || 'none'}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(sessionTrackedKey)) {
        sessionStorage.setItem(sessionTrackedKey, 'true');

        let existingSessionId: string | undefined = undefined;
        try {
          existingSessionId = localStorage.getItem('asterra_referral_session_id') || undefined;
        } catch {}

        fetch('/api/v1/affiliate/track-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: normalizedCode || undefined,
            campaign: normalizedCamp || undefined,
            utm_source: urlSource ? urlSource.trim() : undefined,
            utm_medium: urlMedium ? urlMedium.trim() : undefined,
            session_id: existingSessionId,
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            const sid = res?.data?.id || res?.data?.sessionId;
            if (sid) {
              try {
                localStorage.setItem('asterra_referral_session_id', sid);
                document.cookie = `asterra_referral_session_id=${encodeURIComponent(
                  sid
                )}; path=/; max-age=2592000; SameSite=Lax`;
              } catch {}
            }
          })
          .catch(() => {});
      }
    }

    // 3. Auto-Preserve URL Parameters on Navigation
    if (typeof window !== 'undefined') {
      const allowedPaths = ['/', '/products', '/checkout', '/orders', '/profile'];
      const isAllowed =
        allowedPaths.includes(pathname || '') ||
        (pathname || '').startsWith('/products/');

      if (isAllowed) {
        let storedRef = '';
        let storedCamp = '';
        try {
          storedRef = localStorage.getItem('asterra_ref') || '';
          storedCamp =
            localStorage.getItem('asterra_campaign') ||
            localStorage.getItem('asterra_utm_campaign') ||
            '';
        } catch {}

        // Check campaign status if storedCamp exists: purge campaign and claimed ref if campaign has ended
        if (storedCamp) {
          fetch('/api/v1/campaigns/active')
            .then((r) => r.json())
            .then((res) => {
              if (!res || !Array.isArray(res?.data)) return; // Do not purge if API failed or offline
              const activeList = res.data;

              const isStillActive = activeList.some(
                (c: { slug?: string; id?: string; status?: string; isActive?: boolean }) =>
                  (c.slug === storedCamp || c.id === storedCamp) &&
                  c.status === 'running' &&
                  c.isActive !== false
              );

              // If campaign is no longer running / has ended, clean it up
              if (!isStillActive) {
                try {
                  localStorage.removeItem('asterra_campaign');
                  localStorage.removeItem('asterra_utm_campaign');
                  document.cookie = 'asterra_campaign=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                  document.cookie = 'asterra_utm_campaign=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                } catch {}

                const currentUrl = new URL(window.location.href);
                let changed = false;

                if (currentUrl.searchParams.has('campaign')) {
                  currentUrl.searchParams.delete('campaign');
                  changed = true;
                }
                if (currentUrl.searchParams.has('utm_campaign')) {
                  currentUrl.searchParams.delete('utm_campaign');
                  changed = true;
                }

                // If referral discount was already claimed previously, also purge ref now that campaign has ended
                const isClaimed = localStorage.getItem('asterra_ref_claimed') === 'true';
                if (isClaimed) {
                  try {
                    localStorage.removeItem('asterra_ref');
                    localStorage.removeItem('asterra_referral_session_id');
                    document.cookie = 'asterra_ref=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                    document.cookie = 'asterra_referral_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                  } catch {}

                  if (currentUrl.searchParams.has('ref')) {
                    currentUrl.searchParams.delete('ref');
                    changed = true;
                  }
                }

                if (changed) {
                  window.history.replaceState(
                    window.history.state,
                    '',
                    currentUrl.pathname + currentUrl.search + currentUrl.hash
                  );
                }
              }
            })
            .catch(() => {});
        }

        // Auto-inject missing parameters into URL
        const currentUrl = new URL(window.location.href);
        let urlModified = false;

        const isRefClaimed = localStorage.getItem('asterra_ref_claimed') === 'true';
        const hasCampaign =
          currentUrl.searchParams.has('campaign') ||
          currentUrl.searchParams.has('utm_campaign') ||
          Boolean(storedCamp);

        // Jika referral discount sudah pernah diklaim dan tidak ada campaign, jangan auto-inject 'ref' ke URL
        if (storedRef && !currentUrl.searchParams.has('ref') && (!isRefClaimed || hasCampaign)) {
          currentUrl.searchParams.set('ref', storedRef);
          urlModified = true;
        }

        if (
          storedCamp &&
          !currentUrl.searchParams.has('campaign') &&
          !currentUrl.searchParams.has('utm_campaign')
        ) {
          currentUrl.searchParams.set('campaign', storedCamp);
          urlModified = true;
        }

        if (urlModified) {
          window.history.replaceState(
            window.history.state,
            '',
            currentUrl.pathname + currentUrl.search + currentUrl.hash
          );
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

