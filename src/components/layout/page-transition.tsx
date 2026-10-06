'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  prefersReducedMotion,
  animateHomepageHero,
  animatePageEntrance,
  setupHomepageScrollReveal,
} from '@/lib/animations/gsap-utils';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Editorial Page Transition & Entrance Orchestrator.
 *
 * Single Source of Truth for AsterraStore page motion:
 * - Persistent shells (Navbar, Footer, MobileNav) remain untouched.
 * - Only the content area executes the buttery smooth 240ms editorial entrance.
 * - Starts at opacity 0.88-0.90 so there is NEVER a white flash or blank screen.
 * - Kills prior route timelines and reverts GSAP context on route unmount.
 * - Reduced-motion returns instantly with zero animation delay.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Clean up any ongoing animations from the previous route immediately
    if (activeCleanupRef.current) {
      activeCleanupRef.current();
      activeCleanupRef.current = null;
    }

    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    // Reduced motion accessibility guard: instantaneous 100% visible display, zero motion delay
    if (prefersReducedMotion()) {
      return;
    }

    let cleanupEntrance: (() => void) | undefined;
    let cleanupScroll: (() => void) | undefined;

    if (pathname === '/') {
      cleanupEntrance = animateHomepageHero(container);
      cleanupScroll = setupHomepageScrollReveal(container);
    } else {
      cleanupEntrance = animatePageEntrance(container);
    }

    const cleanup = () => {
      cleanupEntrance?.();
      cleanupScroll?.();
    };

    activeCleanupRef.current = cleanup;

    return () => {
      cleanup();
      activeCleanupRef.current = null;
    };
  }, [pathname]);

  return (
    <div key={pathname} ref={containerRef} className="w-full animate-page-enter">
      {children}
    </div>
  );
}
