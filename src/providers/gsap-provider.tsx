'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  animateHeroMasterSequence,
  setupHomepageScrollReveal,
  animatePageEntrance,
  setupScrollReveal,
} from '@/lib/animations/gsap-utils';

export function GsapProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanupEntrance: (() => void) | undefined;
    let cleanupScroll: (() => void) | undefined;

    // Use requestAnimationFrame for immediate frame execution without artificial delay
    const rafId = requestAnimationFrame(() => {
      const container = pageContainerRef.current;
      if (!container) return;

      if (pathname === '/') {
        cleanupEntrance = animateHeroMasterSequence(container);
        cleanupScroll = setupHomepageScrollReveal(container);
      } else {
        cleanupEntrance = animatePageEntrance(container);
        cleanupScroll = setupScrollReveal(container);
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
