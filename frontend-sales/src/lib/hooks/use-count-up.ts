'use client';

import { useState, useEffect, useRef } from 'react';
import { MOTION_DURATION, isReducedMotion } from '@/lib/motion';

export interface UseCountUpOptions {
  duration?: number;
  delay?: number;
  formatter?: (val: number) => string;
  enablePulse?: boolean;
}

export interface CountUpDetails {
  formattedValue: string;
  displayValue: number;
  targetValue: number;
  delta: number;
  deltaPercent: number | null;
  direction: 'up' | 'down' | 'none';
  isPulsing: boolean;
  isAnimating: boolean;
  pulseClass: string;
}

/**
 * Enhanced Monetira Numeric Counter Hook with full details
 * Transitions smoothly between previous value and new target value without resetting to 0.
 * Automatically tracks direction (up/down), delta, percentage change, and pulse highlights.
 */
export function useCountUpDetails(
  targetValue: number,
  options: UseCountUpOptions = {}
): CountUpDetails {
  const {
    duration = MOTION_DURATION.counter,
    delay = 0,
    formatter = (v) => Math.round(v).toLocaleString('id-ID'),
    enablePulse = true,
  } = options;

  const [displayValue, setDisplayValue] = useState<number>(0);
  const [direction, setDirection] = useState<'up' | 'down' | 'none'>('none');
  const [delta, setDelta] = useState<number>(0);
  const [deltaPercent, setDeltaPercent] = useState<number | null>(null);
  const [isPulsing, setIsPulsing] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const currentValueRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If reduced motion is requested, snap instantly without animation
    if (isReducedMotion()) {
      setDisplayValue(targetValue);
      currentValueRef.current = targetValue;
      isMountedRef.current = true;
      setIsAnimating(false);
      return;
    }

    const isFirstMount = !isMountedRef.current;
    isMountedRef.current = true;

    const startVal = currentValueRef.current;
    const diff = targetValue - startVal;

    if (diff === 0 && !isFirstMount) {
      setDisplayValue(targetValue);
      currentValueRef.current = targetValue;
      return;
    }

    if (diff === 0 && isFirstMount && targetValue === 0) {
      setDisplayValue(0);
      currentValueRef.current = 0;
      return;
    }

    // Determine direction and calculate delta
    const dir: 'up' | 'down' = diff >= 0 ? 'up' : 'down';
    setDirection(dir);
    setDelta(diff);

    if (startVal > 0) {
      const pct = (diff / startVal) * 100;
      setDeltaPercent(Math.round(pct * 10) / 10);
    } else {
      setDeltaPercent(null);
    }

    if (enablePulse && !isFirstMount) {
      setIsPulsing(true);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => {
        setIsPulsing(false);
      }, MOTION_DURATION.flash);
    }

    setIsAnimating(true);
    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Monetira / Apple style smooth cubic out: 1 - (1 - progress)^3
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startVal + diff * easeOut;

      currentValueRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        currentValueRef.current = targetValue;
        setDisplayValue(targetValue);
        setIsAnimating(false);
      }
    };

    const effectiveDelay = delay > 0 ? delay : (isFirstMount ? 60 : 0);
    const delayTimer = setTimeout(() => {
      rafRef.current = requestAnimationFrame(animate);
    }, effectiveDelay);

    return () => {
      clearTimeout(delayTimer);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (pulseTimerRef.current !== null) {
        clearTimeout(pulseTimerRef.current);
      }
    };
  }, [targetValue, duration, delay, enablePulse]);

  const pulseClass = isPulsing
    ? direction === 'up'
      ? 'bg-status-success/15 text-status-success rounded px-1 -mx-1 transition-colors duration-500'
      : 'bg-status-error/15 text-status-error rounded px-1 -mx-1 transition-colors duration-500'
    : 'transition-colors duration-500';

  return {
    formattedValue: formatter(displayValue),
    displayValue,
    targetValue,
    delta,
    deltaPercent,
    direction,
    isPulsing,
    isAnimating,
    pulseClass,
  };
}

/**
 * Standard useCountUp hook for backwards compatibility.
 * Returns the formatted string value directly.
 */
export function useCountUp(
  targetValue: number,
  options: UseCountUpOptions = {}
): string {
  const details = useCountUpDetails(targetValue, options);
  return details.formattedValue;
}
