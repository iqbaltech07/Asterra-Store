'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { LainnyaSidebar } from '@/components/layout/lainnya-sidebar';
import { FloatingSupport } from '@/components/layout/floating-support';
import { PageTransition } from '@/components/layout/page-transition';
import { clearChunkRecoveryFlag, tryRecoverFromChunkError } from '@/lib/utils/chunk-recovery';

interface StorefrontShellProps {
  children: React.ReactNode;
}

export function StorefrontShell({ children }: StorefrontShellProps) {
  const pathname = usePathname();

  // Self-healing Chunk Recovery: Listen for chunk load failures during runtime / rolling deployment
  useEffect(() => {
    // Clean up recovery flag after successful boot & hydration
    const cleanupClearTimer = clearChunkRecoveryFlag(2500);

    const handleError = (event: ErrorEvent) => {
      const err = event.error || event.message || event;
      if (tryRecoverFromChunkError(err)) {
        event.preventDefault?.();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (tryRecoverFromChunkError(reason)) {
        event.preventDefault?.();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      cleanupClearTimer();
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Non-storefront routes: Admin dashboard, Sales representative portal, and dedicated Auth pages
  const isNonStorefront =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/sales') ||
    pathname === '/login' ||
    pathname === '/register';

  if (isNonStorefront) {
    return (
      <main className="w-full min-h-screen">
        <PageTransition>{children}</PageTransition>
      </main>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      {/* Persistent Desktop & Mobile Header Bar */}
      <Header />

      {/* Main Content Area with Buttery Editorial Page Transition */}
      <main className="flex-1 w-full" id="main-content">
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Persistent Footer */}
      <Footer />

      {/* Persistent Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Persistent Side Drawers and Overlays */}
      <LainnyaSidebar />
      <FloatingSupport />
    </div>
  );
}
