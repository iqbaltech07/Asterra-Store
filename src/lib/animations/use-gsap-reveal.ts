'use client';

import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from './gsap-utils';

export interface UseGsapRevealOptions {
  /**
   * Target selector scoped strictly within the container.
   * Defaults to '.gsap-reveal' to prevent blanket document queries.
   */
  selector?: string;
  /**
   * Vertical distance in pixels for entrance translation. Defaults to 12.
   */
  y?: number;
  /**
   * Animation duration in seconds. Defaults to 0.4.
   */
  duration?: number;
  /**
   * Stagger delay between sequential elements. Defaults to 0.04.
   */
  stagger?: number;
  /**
   * GSAP easing function. Defaults to 'power2.out'.
   */
  ease?: string;
  /**
   * Initial delay before animation sequence starts. Defaults to 0.
   */
  delay?: number;
}

/**
 * Scoped GSAP Reveal Hook.
 *
 * Guarantees zero global document queries and zero full-page opacity wipes.
 * Uses `gsap.context(..., containerRef)` to isolate animations strictly inside `containerRef`.
 * Safely cleans up via `ctx.revert()` upon component unmount or dependency re-runs.
 */
export function useGsapReveal<T extends HTMLElement = HTMLElement>(
  containerRef: RefObject<T | null>,
  options: UseGsapRevealOptions = {}
) {
  const {
    selector = '.gsap-reveal',
    y = 12,
    duration = 0.4,
    stagger = 0.04,
    ease = 'power2.out',
    delay = 0,
  } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    // Reduced motion accessibility guard: instantly reveal elements without motion
    if (prefersReducedMotion()) {
      const elements = container.querySelectorAll<HTMLElement>(selector);
      elements.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    const ctx = gsap.context(() => {
      const elements = container.querySelectorAll<HTMLElement>(selector);
      if (elements.length === 0) return;

      gsap.fromTo(
        elements,
        {
          opacity: 0,
          y,
          force3D: true,
        },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          delay,
          ease,
          clearProps: 'transform,opacity',
        }
      );
    }, container);

    return () => {
      ctx.revert();
    };
  }, [containerRef, selector, y, duration, stagger, ease, delay]);
}
