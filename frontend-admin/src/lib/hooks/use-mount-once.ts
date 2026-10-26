'use client';

import { useState, useEffect, useRef } from 'react';
import { isReducedMotion } from '@/lib/motion';

/**
 * useMountOnce Hook
 * Ensures entry stagger animations only play once upon initial tab/component mount,
 * and never re-trigger upon tab revisit, data refresh, or background polling.
 */
export function useMountOnce(): boolean {
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const mountedRef = useRef<boolean>(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    if (isReducedMotion()) {
      setHasMounted(true);
      return;
    }

    // Set hasMounted true after next animation frame so stagger entry finishes smoothly
    const frame = requestAnimationFrame(() => {
      setHasMounted(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return hasMounted;
}
