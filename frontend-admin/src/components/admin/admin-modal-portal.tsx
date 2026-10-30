'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface AdminModalPortalProps {
  children: React.ReactNode;
}

/**
 * AdminModalPortal renders modal overlays directly under document.body.
 * This completely prevents modals from being trapped within parent containers,
 * sidebar offsets, or CSS transform containing blocks (like animate-tab-glide).
 * Ensures full-viewport 100vw x 100vh coverage and perfect centering across all admin pages.
 */
export function AdminModalPortal({ children }: AdminModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
}

