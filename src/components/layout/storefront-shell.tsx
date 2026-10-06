'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { LainnyaSidebar } from '@/components/layout/lainnya-sidebar';
import { FloatingSupport } from '@/components/layout/floating-support';

interface StorefrontShellProps {
  children: React.ReactNode;
}

export function StorefrontShell({ children }: StorefrontShellProps) {
  const pathname = usePathname();

  // Non-storefront routes: Admin dashboard, Sales representative portal, and dedicated Auth pages
  const isNonStorefront =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/sales') ||
    pathname === '/login' ||
    pathname === '/register';

  if (isNonStorefront) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      {/* Persistent Desktop & Mobile Header Bar */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 w-full" id="main-content">
        {children}
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
