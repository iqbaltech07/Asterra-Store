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
    let cleanupEntrance: (() => void) | undefined;
    let cleanupScroll: (() => void) | undefined;

    // Small timeout ensures the route's DOM is painted before animating
    const timer = setTimeout(() => {
      const container = pageContainerRef.current;
      if (!container) return;
      cleanupEntrance = animatePageEntrance(container);
      cleanupScroll = setupScrollReveal(container);
    }, 40);

    return () => {
      clearTimeout(timer);
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
