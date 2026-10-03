'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  animatePageEntrance,
  setupScrollReveal,
} from '@/lib/animations/gsap-utils';

export function GsapProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanupEntrance: (() => void) | undefined;
    let cleanupScroll: (() => void) | undefined;

    // Small delay ensures route DOM is painted and ready for GSAP
    const timer = setTimeout(() => {
      const container = pageContainerRef.current;
      if (!container) return;
      cleanupEntrance = animatePageEntrance(container);
      cleanupScroll = setupScrollReveal(container);
    }, 50);

    return () => {
      clearTimeout(timer);
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
