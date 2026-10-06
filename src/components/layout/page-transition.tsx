'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  prefersReducedMotion,
  animateHomepageHero,
  setupHomepageScrollReveal,
  animateProductsPage,
  animateProductDetailPage,
  animateOrdersPage,
  animateSellerPage,
  animateDaftarSalesPage,
  animateSalesLoginPage,
  animateGeneralSubpage,
} from '@/lib/animations/gsap-utils';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Editorial Page Transition & Motion Design System Orchestrator.
 *
 * Single Source of Truth for AsterraStore page motion:
 * - Persistent shells (Navbar, Footer, MobileNav) remain untouched.
 * - Each route executes its own dedicated component choreography.
 * - Route navigation triggers specific component entrance sequences.
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
    } else if (pathname === '/products') {
      cleanupEntrance = animateProductsPage(container);
    } else if (pathname.startsWith('/products/')) {
      cleanupEntrance = animateProductDetailPage(container);
    } else if (pathname === '/orders' || pathname.startsWith('/orders') || pathname === '/order') {
      cleanupEntrance = animateOrdersPage(container);
    } else if (pathname === '/seller') {
      cleanupEntrance = animateSellerPage(container);
    } else if (pathname === '/daftar-sales') {
      cleanupEntrance = animateDaftarSalesPage(container);
    } else if (pathname === '/sales/login' || pathname === '/login') {
      cleanupEntrance = animateSalesLoginPage(container);
    } else {
      cleanupEntrance = animateGeneralSubpage(container);
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
