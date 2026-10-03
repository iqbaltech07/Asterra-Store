'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ReferralTrackerInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (!refCode || !refCode.trim()) return;

    const normalizedCode = refCode.trim().toUpperCase();

    // 1. Store in localStorage and Cookie (30-day attribution window)
    try {
      localStorage.setItem('asterra_ref', normalizedCode);
      document.cookie = `asterra_ref=${encodeURIComponent(
        normalizedCode
      )}; path=/; max-age=2592000; SameSite=Lax`;
    } catch {
      // ignore storage errors
    }

    // 2. Prevent duplicate tracking in the same session
    const sessionTrackedKey = `asterra_tracked_${normalizedCode}`;
    if (sessionStorage.getItem(sessionTrackedKey)) {
      return;
    }

    sessionStorage.setItem(sessionTrackedKey, 'true');

    // 3. Dispatch click telemetry to server
    fetch('/api/v1/affiliate/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: normalizedCode }),
    }).catch(() => {
      // silent background fail
    });
  }, [searchParams]);

  return null;
}

export function ReferralTracker() {
  return (
    <Suspense fallback={null}>
      <ReferralTrackerInner />
    </Suspense>
  );
}
