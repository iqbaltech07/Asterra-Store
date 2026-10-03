'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  animatePageEntrance,
  setupScrollReveal,
  prefersReducedMotion,
} from '@/lib/animations/gsap-utils';

export function GsapProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    let cleanupEntrance: (() => void) | undefined;
    let cleanupScroll: (() => void) | undefined;

    // Wait one frame so the new route's DOM is painted before animating
    const raf = requestAnimationFrame(() => {
      const container = pageContainerRef.current;
      if (!container) return;
      cleanupEntrance = animatePageEntrance(container);
      cleanupScroll = setupScrollReveal(container);
    });

    return () => {
      cancelAnimationFrame(raf);
      cleanupEntrance?.();
      cleanupScroll?.();
    };
  }, [pathname]);

  return (
    <div ref={pageContainerRef} className="contents" data-gsap-page-root>
      {children}
    </div>
  );
}
