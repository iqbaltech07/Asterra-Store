'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger safely in browser context
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Check if the user's system has requested reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ==========================================================================
   REUSABLE MOTION SYSTEM PRIMITIVES
   ========================================================================== */

export interface MotionOptions {
  duration?: number;
  delay?: number;
  ease?: string;
  dist?: number;
  stagger?: number | gsap.StaggerVars;
  onComplete?: () => void;
}

/**
 * Reveal from top with vertical clip/unfold (used by Navbar)
 */
export function revealFromTop(
  target: gsap.TweenTarget,
  options: MotionOptions = {}
) {
  const reduced = prefersReducedMotion();
  const dur = options.duration ?? (reduced ? 0.35 : 0.8);
  const ease = options.ease ?? (reduced ? 'power1.out' : 'expo.out');
  const dist = options.dist ?? (reduced ? 6 : 24);

  if (reduced) {
    return gsap.fromTo(
      target,
      { opacity: 0 },
      {
        opacity: 1,
        duration: dur,
        delay: options.delay ?? 0,
        ease,
        clearProps: 'opacity',
        onComplete: options.onComplete,
      }
    );
  }

  return gsap.fromTo(
    target,
    {
      y: -dist,
      opacity: 0,
      clipPath: 'inset(0% 0% 100% 0% round 1rem)',
    },
    {
      y: 0,
      opacity: 1,
      clipPath: 'inset(0% 0% 0% 0% round 1rem)',
      duration: dur,
      delay: options.delay ?? 0,
      ease,
      force3D: true,
      clearProps: 'transform,clipPath,opacity',
      onComplete: options.onComplete,
    }
  );
}

/**
 * Horizontal panel reveal opening from the center: LEFT <--- HERO ---> RIGHT
 * Inspired by CapCut "Classic" panel opening.
 */
export function revealHorizontal(
  target: gsap.TweenTarget,
  options: MotionOptions = {}
) {
  const reduced = prefersReducedMotion();
  const dur = options.duration ?? (reduced ? 0.4 : 1.05);
  const ease = options.ease ?? (reduced ? 'power1.out' : 'power3.inOut');

  if (reduced) {
    return gsap.fromTo(
      target,
      { opacity: 0 },
      {
        opacity: 1,
        duration: dur,
        delay: options.delay ?? 0,
        ease,
        clearProps: 'opacity',
        onComplete: options.onComplete,
      }
    );
  }

  return gsap.fromTo(
    target,
    {
      clipPath: 'inset(0% 50% 0% 50% round 1.5rem)',
      opacity: 0.15,
    },
    {
      clipPath: 'inset(0% 0% 0% 0% round 1.5rem)',
      opacity: 1,
      duration: dur,
      delay: options.delay ?? 0,
      ease,
      force3D: true,
      clearProps: 'clipPath,opacity',
      onComplete: options.onComplete,
    }
  );
}

/**
 * Reveal from bottom with upward clip/mask (used by Catalog header & FAQ)
 */
export function revealFromBottom(
  target: gsap.TweenTarget,
  options: MotionOptions = {}
) {
  const reduced = prefersReducedMotion();
  const dur = options.duration ?? (reduced ? 0.35 : 0.7);
  const ease = options.ease ?? (reduced ? 'power1.out' : 'power3.out');
  const dist = options.dist ?? (reduced ? 6 : 18);

  if (reduced) {
    return gsap.fromTo(
      target,
      { opacity: 0 },
      {
        opacity: 1,
        duration: dur,
        delay: options.delay ?? 0,
        ease,
        clearProps: 'opacity',
        onComplete: options.onComplete,
      }
    );
  }

  return gsap.fromTo(
    target,
    {
      y: dist,
      opacity: 0,
      clipPath: 'inset(100% 0% 0% 0%)',
    },
    {
      y: 0,
      opacity: 1,
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: dur,
      delay: options.delay ?? 0,
      ease,
      force3D: true,
      clearProps: 'transform,clipPath,opacity',
      onComplete: options.onComplete,
    }
  );
}

/**
 * Reveal from side with angled directional entry (used by Features / Why Asterra)
 */
export function revealFromSide(
  target: gsap.TweenTarget,
  options: MotionOptions & { xDist?: number; yDist?: number } = {}
) {
  const reduced = prefersReducedMotion();
  const dur = options.duration ?? (reduced ? 0.35 : 0.6);
  const ease = options.ease ?? (reduced ? 'power1.out' : 'power2.out');
  const xDist = options.xDist ?? (reduced ? 4 : 16);
  const yDist = options.yDist ?? (reduced ? 4 : 14);

  if (reduced) {
    return gsap.fromTo(
      target,
      { opacity: 0 },
      {
        opacity: 1,
        duration: dur,
        delay: options.delay ?? 0,
        ease,
        clearProps: 'opacity',
        onComplete: options.onComplete,
      }
    );
  }

  return gsap.fromTo(
    target,
    {
      x: -xDist,
      y: yDist,
      opacity: 0,
      scale: 0.98,
    },
    {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
      duration: dur,
      delay: options.delay ?? 0,
      stagger: options.stagger ?? 0,
      ease,
      force3D: true,
      clearProps: 'transform,opacity',
      onComplete: options.onComplete,
    }
  );
}

/**
 * Reveal with soft scale / zoom (used by Step Progression & CTA Banner)
 */
export function revealScale(
  target: gsap.TweenTarget,
  options: MotionOptions & { scaleFrom?: number } = {}
) {
  const reduced = prefersReducedMotion();
  const dur = options.duration ?? (reduced ? 0.35 : 0.65);
  const ease = options.ease ?? (reduced ? 'power1.out' : 'power3.out');
  const scaleFrom = options.scaleFrom ?? (reduced ? 0.98 : 0.94);
  const dist = options.dist ?? (reduced ? 4 : 16);

  if (reduced) {
    return gsap.fromTo(
      target,
      { opacity: 0 },
      {
        opacity: 1,
        duration: dur,
        delay: options.delay ?? 0,
        ease,
        clearProps: 'opacity',
        onComplete: options.onComplete,
      }
    );
  }

  return gsap.fromTo(
    target,
    {
      scale: scaleFrom,
      y: dist,
      opacity: 0,
    },
    {
      scale: 1,
      y: 0,
      opacity: 1,
      duration: dur,
      delay: options.delay ?? 0,
      stagger: options.stagger ?? 0,
      ease,
      force3D: true,
      clearProps: 'transform,opacity',
      onComplete: options.onComplete,
    }
  );
}

/* ==========================================================================
   1. NAVBAR MOTION ORCHESTRATION
   ========================================================================== */

/**
 * Animate Header & Navbar components smoothly on mount
 * Sequence:
 * 1. Navbar container reveals from top to bottom (transform + clipPath)
 * 2. Logo appears
 * 3. Navigation links appear with stagger
 * 4. Action buttons (Pesanan & Auth/Hamburger) appear last
 */
export function animateNavbar(headerElement: HTMLElement | null) {
  if (!headerElement || typeof window === 'undefined') return;

  const reduced = prefersReducedMotion();

  const ctx = gsap.context(() => {
    const bar = headerElement.querySelector('div.max-w-7xl');
    const logo = headerElement.querySelector('[data-gsap="nav-logo"], .nav-logo');
    const navLinks = headerElement.querySelectorAll('[data-gsap="nav-link"], nav a');
    const actions = headerElement.querySelectorAll('[data-gsap="nav-action"], header button');

    if (reduced) {
      gsap.fromTo(
        headerElement,
        { opacity: 0 },
        { opacity: 1, duration: 0.35, ease: 'power1.out' }
      );
      return;
    }

    const tl = gsap.timeline({
      defaults: { force3D: true },
    });

    // 1. Container opens downward from top (0.00s)
    if (bar) {
      tl.fromTo(
        bar,
        {
          y: -18,
          opacity: 0,
          clipPath: 'inset(0% 0% 100% 0% round 1rem)',
        },
        {
          y: 0,
          opacity: 1,
          clipPath: 'inset(0% 0% 0% 0% round 1rem)',
          duration: 0.65,
          ease: 'expo.out',
          clearProps: 'transform,clipPath,opacity',
        },
        0
      );
    }

    // 2. Logo appears right after container starts opening (0.10s)
    if (logo) {
      tl.fromTo(
        logo,
        { opacity: 0, scale: 0.96, y: -4 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.38,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        },
        0.10
      );
    }

    // 3. Nav links stagger in (0.14s)
    if (navLinks.length > 0) {
      tl.fromTo(
        navLinks,
        { opacity: 0, y: -6 },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.03,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        },
        0.14
      );
    }

    // 4. Action buttons (Cart, User/Login, Hamburger) appear (0.18s)
    if (actions.length > 0) {
      tl.fromTo(
        actions,
        { opacity: 0, scale: 0.92, y: -4 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.03,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        },
        0.18
      );
    }
  }, headerElement);

  return () => ctx.revert();
}

/* ==========================================================================
   2. HOMEPAGE MASTER ENTRANCE SEQUENCE (HERO & ABOVE THE FOLD)
   ========================================================================== */

/**
 * Master initial page load sequence for Asterra Store Homepage:
 * Continuous, fluid, zero-dead-time cascade:
 * 0.00s -> Navbar starts
 * 0.06s -> Hero container horizontal reveal starts immediately with fluid overlap
 * 0.22s -> Hero headline lines text reveal
 * 0.32s -> Hero description
 * 0.38s -> Planet visual (Mobile: static rotation + subtle scale for 60fps; Desktop: subtle rotation)
 * 0.44s -> Hero benefits horizontal stagger (Tile 1 -> Tile 2 -> Tile 3)
 */
export function animateHeroMasterSequence(container: HTMLElement | null) {
  if (!container || typeof window === 'undefined') return;

  const reduced = prefersReducedMotion();

  const ctx = gsap.context(() => {
    const isMobile = window.innerWidth < 640;
    const heroContainer = container.querySelector('[data-gsap="hero-container"]');
    const titleLines = container.querySelectorAll('[data-gsap="title-line"]');
    const heroTitle = container.querySelector('[data-gsap="page-title"]');
    const heroSub = container.querySelector('[data-gsap="page-sub"]');
    const planetVisual = container.querySelector('[data-gsap="hero-media"]');
    const benefitBar = container.querySelector('[data-gsap="hero-benefit-bar"]');
    const benefitTiles = container.querySelectorAll('[data-gsap="benefit-tile"], [data-gsap="benefit-card"]');

    if (reduced) {
      gsap.fromTo(
        [heroContainer, heroTitle, heroSub, planetVisual, benefitBar, benefitTiles],
        { opacity: 0 },
        { opacity: 1, duration: 0.25, stagger: 0.04, ease: 'power1.out', clearProps: 'opacity' }
      );
      return;
    }

    const masterTl = gsap.timeline({
      defaults: { force3D: true },
    });

    // 1. HERO HORIZONTAL REVEAL (Starts immediately at 0.06s)
    if (heroContainer) {
      masterTl.fromTo(
        heroContainer,
        {
          clipPath: 'inset(0% 50% 0% 50% round 1.5rem)',
          opacity: 0.3,
        },
        {
          clipPath: 'inset(0% 0% 0% 0% round 1.5rem)',
          opacity: 1,
          duration: isMobile ? 0.72 : 0.82,
          ease: 'power3.inOut',
          clearProps: 'clipPath,opacity',
        },
        0.06
      );
    }

    // 2. HERO HEADLINE: Line-by-line text reveal (Starts at 0.22s)
    if (titleLines.length > 0) {
      masterTl.fromTo(
        titleLines,
        {
          yPercent: 105,
          opacity: 0,
        },
        {
          yPercent: 0,
          opacity: 1,
          duration: isMobile ? 0.45 : 0.52,
          stagger: 0.05,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        },
        0.22
      );
    } else if (heroTitle) {
      masterTl.fromTo(
        heroTitle,
        { y: 12, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.48,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        },
        0.22
      );
    }

    // 3. HERO DESCRIPTION (Starts at 0.32s)
    if (heroSub) {
      masterTl.fromTo(
        heroSub,
        { y: 8, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.38,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        },
        0.32
      );
    }

    // 4. PLANET VISUAL (Starts at 0.38s)
    // MOBILE: NO rotation to prevent expensive re-rasterization of transparent animated WebP; subtle scale only
    // DESKTOP: subtle rotation -3deg -> 0deg and scale
    if (planetVisual) {
      masterTl.fromTo(
        planetVisual,
        {
          scale: isMobile ? 0.96 : 0.90,
          opacity: 0,
          rotation: isMobile ? 0 : -3,
        },
        {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: isMobile ? 0.42 : 0.52,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        },
        0.38
      );
    }

    // 5. HERO BENEFIT BAR & TILES (Starts at 0.44s)
    if (benefitBar) {
      masterTl.fromTo(
        benefitBar,
        { opacity: 0, y: 6 },
        {
          opacity: 1,
          y: 0,
          duration: 0.38,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        },
        0.44
      );
    }

    if (benefitTiles.length > 0) {
      masterTl.fromTo(
        benefitTiles,
        {
          opacity: 0,
          x: isMobile ? -6 : -10,
          scale: 0.97,
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.38,
          stagger: 0.05,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        },
        0.48
      );
    }
  }, container);

  return () => ctx.revert();
}

/* ==========================================================================
   3. HOMEPAGE SCROLL REVEAL (BELOW THE FOLD SECTIONS)
   ========================================================================== */

/**
 * Set up distinct, premium scroll-triggered reveals for homepage sections.
 * Each section possesses its own distinct motion character:
 * - Catalog: Bottom clip reveal for header + horizontal stagger for product cards
 * - Keunggulan (Why Asterra): Side / angled 3D card stagger
 * - Panduan (Steps): Sequential progression reveal (Step 1 -> 2 -> 3 -> 4)
 * - FAQ: Vertical cascade unfold
 * - CTA Banner: Expand inset / soft zoom reveal
 * - Footer: Vertical bottom reveal + column stagger
 */
export function setupHomepageScrollReveal(root: HTMLElement | null) {
  if (!root || typeof window === 'undefined') return;

  const reduced = prefersReducedMotion();

  const ctx = gsap.context(() => {
    // ------------------------------------------------------------------------
    // SECTION 1: Catalog / Jelajahi Layanan Digital
    // ------------------------------------------------------------------------
    const catalogSection = root.querySelector('[data-gsap-section="catalog"], #aplikasi');
    if (catalogSection) {
      const header = catalogSection.querySelector('[data-gsap="catalog-header"], div:first-child');
      const headerItems = catalogSection.querySelectorAll('[data-gsap="catalog-item"]');
      const cards = catalogSection.querySelectorAll<HTMLElement>(
        '[data-gsap="marquee-card"], .carousel-track a'
      );
      // Only animate the first set of visible cards (first 6) on entry so marquee keeps running
      const initialCards = Array.from(cards).slice(0, 6);

      const catalogTl = gsap.timeline({
        scrollTrigger: {
          trigger: catalogSection,
          start: 'top 85%',
          once: true,
        },
      });

      if (reduced) {
        catalogTl.fromTo(
          catalogSection,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: 'power1.out' }
        );
      } else {
        if (header) {
          catalogTl.fromTo(
            header,
            { clipPath: 'inset(100% 0% 0% 0%)', opacity: 0, y: 10 },
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: 'power3.out',
              clearProps: 'clipPath,transform,opacity',
            },
            0
          );
        }

        if (headerItems.length > 0) {
          catalogTl.fromTo(
            headerItems,
            { opacity: 0, y: 8 },
            {
              opacity: 1,
              y: 0,
              duration: 0.38,
              stagger: 0.05,
              ease: 'power2.out',
              clearProps: 'transform,opacity',
            },
            0.06
          );
        }

        if (initialCards.length > 0) {
          catalogTl.fromTo(
            initialCards,
            { x: -20, opacity: 0, scale: 0.98 },
            {
              x: 0,
              opacity: 1,
              scale: 1,
              duration: 0.45,
              stagger: 0.05,
              ease: 'power2.out',
              clearProps: 'transform,opacity',
            },
            0.10
          );
        }
      }
    }

    // ------------------------------------------------------------------------
    // SECTION 2: Kenapa Asterra? (#keunggulan) - Side / Angled Reveal
    // ------------------------------------------------------------------------
    const keunggulanSection = root.querySelector('[data-gsap-section="keunggulan"], #keunggulan');
    if (keunggulanSection) {
      const header = keunggulanSection.querySelector('[data-gsap="keunggulan-header"], div:first-child');
      const cards = keunggulanSection.querySelectorAll('[data-gsap="keunggulan-card"], [data-gsap="card"]');

      const keunggulanTl = gsap.timeline({
        scrollTrigger: {
          trigger: keunggulanSection,
          start: 'top 85%',
          once: true,
        },
      });

      if (reduced) {
        keunggulanTl.fromTo(
          keunggulanSection,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: 'power1.out' }
        );
      } else {
        if (header) {
          keunggulanTl.fromTo(
            header,
            { x: -14, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.45,
              ease: 'power2.out',
              clearProps: 'transform,opacity',
            },
            0
          );
        }

        if (cards.length > 0) {
          keunggulanTl.fromTo(
            cards,
            { x: -10, y: 10, opacity: 0, scale: 0.98 },
            {
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.42,
              stagger: 0.04,
              ease: 'power2.out',
              clearProps: 'transform,opacity',
            },
            0.08
          );
        }
      }
    }

    // ------------------------------------------------------------------------
    // SECTION 3: Alur Pemesanan (#panduan) - Sequential Step Progression
    // ------------------------------------------------------------------------
    const panduanSection = root.querySelector('[data-gsap-section="panduan"], #panduan');
    if (panduanSection) {
      const header = panduanSection.querySelector('[data-gsap="panduan-header"], div:first-child');
      const steps = panduanSection.querySelectorAll('[data-gsap="panduan-step"], [data-gsap="card"]');

      const panduanTl = gsap.timeline({
        scrollTrigger: {
          trigger: panduanSection,
          start: 'top 85%',
          once: true,
        },
      });

      if (reduced) {
        panduanTl.fromTo(
          panduanSection,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: 'power1.out' }
        );
      } else {
        if (header) {
          panduanTl.fromTo(
            header,
            { scale: 0.98, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.45,
              ease: 'power3.out',
              clearProps: 'transform,opacity',
            },
            0
          );
        }

        if (steps.length > 0) {
          panduanTl.fromTo(
            steps,
            { y: 14, scale: 0.96, opacity: 0 },
            {
              y: 0,
              scale: 1,
              opacity: 1,
              duration: 0.45,
              stagger: 0.07,
              ease: 'power3.out',
              clearProps: 'transform,opacity',
            },
            0.08
          );
        }
      }
    }

    // ------------------------------------------------------------------------
    // SECTION 4: FAQ (#faq) - Vertical Cascade Unfold
    // ------------------------------------------------------------------------
    const faqSection = root.querySelector('[data-gsap-section="faq"], #faq');
    if (faqSection) {
      const header = faqSection.querySelector('[data-gsap="faq-header"], div:first-child');
      const items = faqSection.querySelectorAll('[data-gsap="faq-item"], .space-y-2\\.5 > div');

      const faqTl = gsap.timeline({
        scrollTrigger: {
          trigger: faqSection,
          start: 'top 85%',
          once: true,
        },
      });

      if (reduced) {
        faqTl.fromTo(
          faqSection,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: 'power1.out' }
        );
      } else {
        if (header) {
          faqTl.fromTo(
            header,
            { y: 12, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.45,
              ease: 'power2.out',
              clearProps: 'transform,opacity',
            },
            0
          );
        }

        if (items.length > 0) {
          faqTl.fromTo(
            items,
            { y: 10, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.35,
              stagger: 0.03,
              ease: 'power2.out',
              clearProps: 'transform,opacity',
            },
            0.06
          );
        }
      }
    }

    // ------------------------------------------------------------------------
    // SECTION 5: CTA Banner - Expand Inset / Soft Zoom Reveal
    // ------------------------------------------------------------------------
    const ctaSection = root.querySelector('[data-gsap-section="cta"]');
    if (ctaSection) {
      const content = ctaSection.querySelector('[data-gsap="cta-content"]');
      const actions = ctaSection.querySelector('[data-gsap="cta-actions"]');

      const ctaTl = gsap.timeline({
        scrollTrigger: {
          trigger: ctaSection,
          start: 'top 85%',
          once: true,
        },
      });

      if (reduced) {
        ctaTl.fromTo(
          ctaSection,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: 'power1.out' }
        );
      } else {
        ctaTl.fromTo(
          ctaSection,
          {
            scale: 0.98,
            clipPath: 'inset(3% 3% 3% 3% round 1rem)',
            opacity: 0,
          },
          {
            scale: 1,
            clipPath: 'inset(0% 0% 0% 0% round 1rem)',
            opacity: 1,
            duration: 0.55,
            ease: 'power3.out',
            clearProps: 'transform,clipPath,opacity',
          },
          0
        );

        if (content) {
          ctaTl.fromTo(
            content,
            { y: 8, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.4,
              ease: 'power2.out',
              clearProps: 'transform,opacity',
            },
            0.08
          );
        }

        if (actions) {
          ctaTl.fromTo(
            actions,
            { y: 8, opacity: 0, scale: 0.97 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.4,
              ease: 'power2.out',
              clearProps: 'transform,opacity',
            },
            0.14
          );
        }
      }
    }

    // ------------------------------------------------------------------------
    // SECTION 6: Footer - Vertical Bottom Reveal + Column Stagger
    // ------------------------------------------------------------------------
    const footer = document.querySelector('footer[data-gsap="footer"], footer');
    if (footer) {
      const columns = footer.querySelectorAll('[data-gsap="footer-col"], .grid > div');
      const bottom = footer.querySelector('[data-gsap="footer-bottom"], .border-t');

      const footerTl = gsap.timeline({
        scrollTrigger: {
          trigger: footer,
          start: 'top 90%',
          once: true,
        },
      });

      if (reduced) {
        footerTl.fromTo(
          footer,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: 'power1.out' }
        );
      } else {
        footerTl.fromTo(
          footer,
          {
            y: 18,
            clipPath: 'inset(10% 0% 0% 0%)',
            opacity: 0,
          },
          {
            y: 0,
            clipPath: 'inset(0% 0% 0% 0%)',
            opacity: 1,
            duration: 0.6,
            ease: 'power3.out',
            clearProps: 'transform,clipPath,opacity',
          },
          0
        );

        if (columns.length > 0) {
          footerTl.fromTo(
            columns,
            { y: 10, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.4,
              stagger: 0.05,
              ease: 'power2.out',
              clearProps: 'transform,opacity',
            },
            0.10
          );
        }

        if (bottom) {
          footerTl.fromTo(
            bottom,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.4,
              ease: 'power2.out',
              clearProps: 'opacity',
            },
            0.20
          );
        }
      }
    }

    // Refresh scroll triggers so calculations are pixel-perfect
    ScrollTrigger.refresh();
  }, root);

  return () => ctx.revert();
}

/* ==========================================================================
   4. FLOATING SUPPORT BUTTON
   ========================================================================== */

/**
 * Animate the floating support button with subtle scale & slight rotation entry.
 */
export function animateFloatingButton(element: HTMLElement | null): (() => void) | undefined {
  if (!element || typeof window === 'undefined') return;

  const reduced = prefersReducedMotion();
  const dur = reduced ? 0.25 : 0.45;

  let tween: gsap.core.Tween;

  if (reduced) {
    tween = gsap.fromTo(
      element,
      { opacity: 0 },
      { opacity: 1, duration: dur, delay: 0.3, ease: 'power1.out', clearProps: 'opacity' }
    );
  } else {
    tween = gsap.fromTo(
      element,
      {
        scale: 0.8,
        opacity: 0,
        rotation: -8,
      },
      {
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: dur,
        delay: 0.68, // Appears smoothly right as hero sequence completes (no 1.25s dead wait!)
        ease: 'power2.out',
        force3D: true,
        clearProps: 'transform,opacity',
      }
    );
  }

  return () => {
    tween.kill();
  };
}

/* ==========================================================================
   5. GENERAL SUBPAGE ENTRANCE & SCROLL REVEAL (FOR /products, /profile, ETC.)
   ========================================================================== */

/**
 * Animate general entrance elements on subpages (titles, breadcrumbs, content)
 * Instant start on route change with smooth, non-blocking 0.32-0.35s transition.
 */
export function animatePageEntrance(container: HTMLElement | null) {
  if (!container || typeof window === 'undefined') return;

  const reduced = prefersReducedMotion();
  const dur = reduced ? 0.25 : 0.35;
  const dist = reduced ? 4 : 10;

  const ctx = gsap.context(() => {
    // 1. Root page container immediate smooth fade
    gsap.fromTo(
      container,
      { opacity: 0.88, y: 4 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'transform,opacity' }
    );

    // 2. Headings
    const headings = container.querySelectorAll('h1, [data-gsap="page-title"]');
    if (headings.length > 0) {
      gsap.fromTo(
        headings,
        { y: dist, opacity: 0 },
        { y: 0, opacity: 1, duration: dur, ease: 'power2.out', stagger: 0.04, force3D: true, clearProps: 'transform,opacity' }
      );
    }

    // 3. Subheads & leads
    const subheads = container.querySelectorAll(
      '[data-gsap="page-sub"], p[data-gsap="lead"], .hero-lead'
    );
    if (subheads.length > 0) {
      gsap.fromTo(
        subheads,
        { y: dist * 0.7, opacity: 0 },
        { y: 0, opacity: 1, duration: dur * 0.9, ease: 'power2.out', stagger: 0.03, force3D: true, clearProps: 'transform,opacity' }
      );
    }

    // 4. Media
    const media = container.querySelectorAll(
      '[data-gsap="hero-media"], [data-gsap="media"]'
    );
    if (media.length > 0) {
      gsap.fromTo(
        media,
        { scale: 0.96, opacity: 0 },
        { scale: 1, opacity: 1, duration: dur, ease: 'power2.out', force3D: true, clearProps: 'transform,opacity' }
      );
    }

    // 5. Initial above-the-fold cards (e.g. Catalog grid, Product cards)
    const initialCards = container.querySelectorAll(
      '[data-gsap="card"], [data-gsap="hero-card"], [data-gsap="benefit-card"]'
    );
    if (initialCards.length > 0) {
      // Only animate above-the-fold cards (first 8) with light stagger (0.03s)
      const topCards = Array.from(initialCards).slice(0, 8);
      gsap.fromTo(
        topCards,
        { y: dist, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: dur,
          stagger: 0.03,
          ease: 'power2.out',
          force3D: true,
          clearProps: 'transform,opacity',
        }
      );
    }
  }, container);

  return () => ctx.revert();
}

/**
 * General scroll reveal for subpages using lightweight IntersectionObserver.
 * Only targets elements below the fold, completely avoiding delays or race conditions
 * on initial above-the-fold elements.
 */
export function setupScrollReveal(root: HTMLElement | null) {
  if (!root || typeof window === 'undefined') return;

  const observed = new WeakSet<Element>();
  const reduced = prefersReducedMotion();
  const dur = reduced ? 0.25 : 0.42;
  const dist = reduced ? 6 : 12;

  const reveal = (target: HTMLElement) => {
    const headings = target.querySelectorAll<HTMLElement>(
      'h2, h3, h4, [data-gsap="section-title"]'
    );
    const paragraphs = target.querySelectorAll<HTMLElement>(
      'p:not(.no-animate), span.uppercase, [data-gsap="section-desc"]'
    );
    const images = target.querySelectorAll<HTMLElement>(
      'img:not(.no-animate), [data-gsap="media"]'
    );
    const cardNodes = target.querySelectorAll<HTMLElement>(
      '[data-gsap="card"], .grid > div, article, .card'
    );
    const cards = Array.from(cardNodes).filter(
      (el) => !el.closest('.carousel-viewport') && !el.closest('.carousel-track')
    );

    const tl = gsap.timeline({
      defaults: { ease: 'power2.out', force3D: true, overwrite: 'auto' },
    });

    if (headings.length > 0) {
      tl.fromTo(
        headings,
        { y: dist * 0.8, opacity: 0 },
        { y: 0, opacity: 1, duration: dur, stagger: 0.04, clearProps: 'transform,opacity' }
      );
    }

    if (paragraphs.length > 0) {
      tl.fromTo(
        paragraphs,
        { y: dist * 0.5, opacity: 0 },
        { y: 0, opacity: 1, duration: dur * 0.9, stagger: 0.03, clearProps: 'transform,opacity' },
        headings.length > 0 ? '<0.05' : 0
      );
    }

    if (images.length > 0) {
      tl.fromTo(
        images,
        { scale: 0.97, opacity: 0 },
        { scale: 1, opacity: 1, duration: dur * 0.85, stagger: 0.03, clearProps: 'transform,opacity' },
        headings.length > 0 || paragraphs.length > 0 ? '<0.06' : 0
      );
    }

    if (cards.length > 0) {
      tl.fromTo(
        cards,
        { y: dist, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: dur,
          stagger: { each: 0.03, amount: Math.min(cards.length, 8) * 0.03 },
          clearProps: 'transform,opacity',
        },
        headings.length > 0 || paragraphs.length > 0 ? '<0.08' : 0
      );
    } else if (headings.length === 0 && paragraphs.length === 0 && images.length === 0) {
      tl.fromTo(
        target,
        { y: dist, opacity: 0 },
        { y: 0, opacity: 1, duration: dur, clearProps: 'transform,opacity' }
      );
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        reveal(entry.target as HTMLElement);
      });
    },
    { rootMargin: '0px 0px 80px 0px', threshold: 0.01 }
  );

  const scan = () => {
    const targets = root.querySelectorAll<HTMLElement>(
      'section, [data-gsap-reveal], main > div, article, .space-y-6, .space-y-8, .grid'
    );

    targets.forEach((el) => {
      if (
        observed.has(el) ||
        el.closest('.carousel-track') ||
        el.closest('.carousel-viewport')
      )
        return;
      observed.add(el);

      const rect = el.getBoundingClientRect();
      // Elements already visible in initial viewport on mount are handled by animatePageEntrance.
      // Do NOT delay or re-animate them to prevent flash/stutter!
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        return;
      }
      io.observe(el);
    });
  };

  scan();

  let debounceTimer: NodeJS.Timeout;
  const mo = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(scan, 120);
  });
  mo.observe(root, { childList: true, subtree: true });

  return () => {
    io.disconnect();
    mo.disconnect();
    clearTimeout(debounceTimer);
  };
}

/**
 * Attach tactile hover interactions to interactive cards
 */
export function attachCardHoverEffect(cardElement: HTMLElement | null) {
  if (!cardElement || typeof window === 'undefined') return;

  const onEnter = () => {
    gsap.to(cardElement, { y: -3, duration: 0.22, ease: 'power1.out', overwrite: 'auto', force3D: true });
  };
  const onLeave = () => {
    gsap.to(cardElement, { y: 0, duration: 0.28, ease: 'power1.out', overwrite: 'auto', force3D: true });
  };

  cardElement.addEventListener('mouseenter', onEnter);
  cardElement.addEventListener('mouseleave', onLeave);

  return () => {
    cardElement.removeEventListener('mouseenter', onEnter);
    cardElement.removeEventListener('mouseleave', onLeave);
  };
}
