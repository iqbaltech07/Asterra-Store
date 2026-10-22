'use client';

import gsap from 'gsap';
import { useEffect, useRef } from 'react';

/**
 * Monetira-inspired GSAP Reveal Hook
 * Automatically animates children elements with smooth GSAP transition.
 * Targets elements with classes like `.gsap-fade-up`, `.gsap-scale-in`.
 * Respects prefers-reduced-motion and cleans up props upon animation completion.
 */
export function useGsapReveal<T extends HTMLElement = HTMLDivElement>(
  options: {
    stagger?: number;
    delay?: number;
    duration?: number;
    y?: number;
  } = {}
) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Accessibility: Respect user reduced-motion preference
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      // Animate elements with `.gsap-fade-up`
      const fadeElements = containerRef.current?.querySelectorAll('.gsap-fade-up');
      if (fadeElements && fadeElements.length > 0) {
        gsap.fromTo(
          fadeElements,
          {
            opacity: 0,
            y: options.y ?? 16,
          },
          {
            opacity: 1,
            y: 0,
            duration: options.duration ?? 0.55,
            delay: options.delay ?? 0.04,
            stagger: options.stagger ?? 0.06,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
          }
        );
      }

      // Animate elements with `.gsap-scale-in`
      const scaleElements = containerRef.current?.querySelectorAll('.gsap-scale-in');
      if (scaleElements && scaleElements.length > 0) {
        gsap.fromTo(
          scaleElements,
          {
            opacity: 0,
            scale: 0.96,
          },
          {
            opacity: 1,
            scale: 1,
            duration: options.duration ?? 0.55,
            delay: (options.delay ?? 0.04) + 0.08,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [options.stagger, options.delay, options.duration, options.y]);

  return containerRef;
}
