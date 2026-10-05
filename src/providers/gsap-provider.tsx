'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  animateHeroMasterSequence,
  setupHomepageScrollReveal,
  setupScrollReveal,
} from '@/lib/animations/gsap-utils';

export function GsapProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    let cleanupEntrance: (() => void) | undefined;
    let cleanupScroll: (() => void) | undefined;

    // Use requestAnimationFrame for immediate frame execution without artificial delay
    const rafId = requestAnimationFrame(() => {
      const container = pageContainerRef.current;
      if (!container) return;

      if (isInitialMount.current) {
        isInitialMount.current = false;
        if (pathname === '/') {
          cleanupEntrance = animateHeroMasterSequence(container);
          cleanupScroll = setupHomepageScrollReveal(container);
        } else {
          cleanupScroll = setupScrollReveal(container);
        }
      } else {
        // Internal navigation: INSTANT transition without blink or white flash
        // Never wipe out heading/card opacities or container opacities on route change
        if (pathname === '/') {
          cleanupScroll = setupHomepageScrollReveal(container);
        } else {
          cleanupScroll = setupScrollReveal(container);
        }
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      cleanupEntrance?.();
      cleanupScroll?.();
    };
  }, [pathname]);

  return (
    <div ref={pageContainerRef} className="w-full min-h-screen" data-gsap-page-root>
      {children}
    </div>
  );
}
