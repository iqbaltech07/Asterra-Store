'use client';

import React from 'react';

/**
 * Global GSAP Provider.
 *
 * Provides the root container and GSAP theming/boundary wrapper.
 * All route-based motion orchestration is centralized in PageTransition.
 */
export function GsapProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen" data-gsap-page-root>
      {children}
    </div>
  );
}

