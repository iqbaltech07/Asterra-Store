'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Checks if the user or browser system requested reduced motion.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

interface UseCountUpOptions {
  duration?: number; // ms, default 700ms
  startValue?: number;
}

/**
 * High-performance, GPU-friendly Count-Up animation hook.
 *
 * Guarantees:
 * 1. Final value is 100% exact to targetValue (no float rounding errors).
 * 2. Respects prefers-reduced-motion (instant display if enabled).
 * 3. Smooth transition if targetValue updates dynamically (e.g. period change).
 * 4. Zero layout shift.
 */
export function useCountUp(
  targetValue: number,
  options: UseCountUpOptions = {}
): number {
  const { duration = 700, startValue = 0 } = options;
  const [currentValue, setCurrentValue] = useState<number>(targetValue);
  const prefersReduced = usePrefersReducedMotion();
  const prevValueRef = useRef<number>(startValue);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // If reduced motion is preferred or duration is 0, jump immediately to target
    if (prefersReduced || duration <= 0) {
      setCurrentValue(targetValue);
      prevValueRef.current = targetValue;
      return;
    }

    const start = prevValueRef.current;
    const end = targetValue;
    const diff = end - start;

    if (diff === 0) {
      setCurrentValue(end);
      return;
    }

    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic curve: fast start, soft deceleration
      const ease = 1 - Math.pow(1 - progress, 3);

      if (progress < 1) {
        const nextVal = Math.round(start + diff * ease);
        setCurrentValue(nextVal);
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        // Guaranteed exact value on completion
        setCurrentValue(end);
        prevValueRef.current = end;
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetValue, duration, prefersReduced]);

  return currentValue;
}

/**
 * Formats a count-up number as Indonesian Rupiah: "Rp 1.250.000"
 */
export function formatRupiah(val: number): string {
  return `Rp ${val.toLocaleString('id-ID')}`;
}

/**
 * Formats a count-up number as localized integer: "1.250"
 */
export function formatNumber(val: number): string {
  return val.toLocaleString('id-ID');
}
