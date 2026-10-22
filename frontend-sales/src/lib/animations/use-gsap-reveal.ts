'use client';

import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from './gsap-utils';

export interface UseGsapRevealOptions {
  /**
   * Target selector scoped strictly within the container.
   * Defaults to '.gsap-reveal, .gsap-fade-up' to prevent blanket document queries.
   */
  selector?: string;
  /**
   * Vertical distance in pixels for entrance translation. Defaults to 16.
   */
  y?: number;
  /**
   * Animation duration in seconds. Defaults to 0.5.
   */
  duration?: number;
  /**
   * Stagger delay between sequential elements. Defaults to 0.05.
   */
  stagger?: number;
  /**
   * GSAP easing function. Defaults to 'power2.out'.
   */
  ease?: string;
  /**
   * Initial delay before animation sequence starts. Defaults to 0.04.
   */
  delay?: number;
  /**
   * Dependencies array to trigger re-reveal animation (e.g. activeTab, filtered data).
   */
  deps?: unknown[];
}

/**
 * Scoped GSAP Reveal Hook (Monetira Motion Replica).
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
    selector = '.gsap-reveal, .gsap-fade-up',
    y = 16,
    duration = 0.5,
    stagger = 0.05,
    ease = 'power2.out',
    delay = 0.04,
    deps = [],
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
      // 1. Elements with .gsap-reveal or .gsap-fade-up
      const elements = container.querySelectorAll<HTMLElement>(selector);
      if (elements.length > 0) {
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
      }

      // 2. Elements with .gsap-scale-in (Monetira spotlight / modal style)
      const scaleElements = container.querySelectorAll<HTMLElement>('.gsap-scale-in');
      if (scaleElements.length > 0) {
        gsap.fromTo(
          scaleElements,
          {
            opacity: 0,
            scale: 0.96,
            force3D: true,
          },
          {
            opacity: 1,
            scale: 1,
            duration: duration * 1.1,
            delay: delay + 0.05,
            ease,
            clearProps: 'transform,opacity',
          }
        );
      }
    }, container);

    return () => {
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, selector, y, duration, stagger, ease, delay, ...deps]);
}
