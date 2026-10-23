'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MOTION_DURATION, isReducedMotion } from '@/lib/motion';

export interface FadeSwapProps {
  swapKey: string | number;
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

/**
 * FadeSwap Component
 * Provides seamless crossfade transition when `swapKey` changes.
 * Avoids abrupt visual pops without causing layout jumps or remounting parents.
 */
export function FadeSwap({
  swapKey,
  children,
  className = '',
  duration = MOTION_DURATION.base,
}: FadeSwapProps) {
  const [currentKey, setCurrentKey] = useState(swapKey);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isFading, setIsFading] = useState(false);
  const prevKeyRef = useRef(swapKey);

  useEffect(() => {
    if (swapKey === prevKeyRef.current) {
      setDisplayChildren(children);
      return;
    }

    prevKeyRef.current = swapKey;

    if (isReducedMotion()) {
      setCurrentKey(swapKey);
      setDisplayChildren(children);
      return;
    }

    // Step 1: Fade out old content slightly
    setIsFading(true);
    const halfDuration = Math.round(duration / 2);

    const timer1 = setTimeout(() => {
      // Step 2: Swap content and fade in
      setCurrentKey(swapKey);
      setDisplayChildren(children);
      setIsFading(false);
    }, halfDuration);

    return () => clearTimeout(timer1);
  }, [swapKey, children, duration]);

  return (
    <div
      key={currentKey}
      className={`transition-all ${className}`}
      style={{
        opacity: isFading ? 0 : 1,
        transform: isFading ? 'translateY(3px)' : 'translateY(0)',
        transitionDuration: `${Math.round(duration / 2)}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {displayChildren}
    </div>
  );
}
