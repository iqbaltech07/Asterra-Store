'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { animateHeroMasterSequence } from '@/lib/animations/gsap-utils';

/**
 * Global GSAP Provider.
 *
 * Provides the root container and GSAP initialization.
 * All route-based global reveals that previously wiped elements to opacity: 0
 * have been removed. Route changes are now instant DOM updates with 100% visible
 * structure. Motion is handled locally by scoped hooks (useGsapReveal).
 */
export function GsapProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const hasEverMounted = useRef(false);

  useEffect(() => {
    if (hasEverMounted.current) return;
    hasEverMounted.current = true;

    const container = pageContainerRef.current;
    if (!container) return;

    let cleanupEntrance: (() => void) | undefined;
    if (pathname === '/') {
      cleanupEntrance = animateHeroMasterSequence(container);
    }

    return () => {
      cleanupEntrance?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: runs strictly once on initial site visit, never on route changes

  return (
    <div ref={pageContainerRef} className="w-full min-h-screen" data-gsap-page-root>
      {children}
    </div>
  );
}
