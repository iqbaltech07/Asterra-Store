'use client';

import { useState, useEffect, useRef } from 'react';

export interface UseCountUpOptions {
  duration?: number;
  formatter?: (val: number) => string;
}

/**
 * Monetira Smooth Numeric Counter Transition Hook
 * Transitions smoothly between previous value and new target value.
 * Avoids zero reset on re-render, respects prefers-reduced-motion,
 * and uses requestAnimationFrame with cubic-bezier easing.
 */
export function useCountUp(
  targetValue: number,
  options: UseCountUpOptions = {}
): string {
  const { duration = 500, formatter = (v) => Math.round(v).toLocaleString('id-ID') } = options;
  const [displayValue, setDisplayValue] = useState<number>(targetValue);
  const prevValueRef = useRef<number>(targetValue);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Respect user prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setDisplayValue(targetValue);
      prevValueRef.current = targetValue;
      return;
    }

    const startVal = prevValueRef.current;
    const diff = targetValue - startVal;

    if (diff === 0) {
      setDisplayValue(targetValue);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Monetira / Apple style smooth cubic out: 1 - (1 - progress)^3
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startVal + diff * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
        prevValueRef.current = targetValue;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      prevValueRef.current = targetValue;
    };
  }, [targetValue, duration]);

  return formatter(displayValue);
}
