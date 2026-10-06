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
let hasNavbarRunOnce = false;

export function animateNavbar(headerElement: HTMLElement | null): (() => void) | undefined {
  if (!headerElement || typeof window === 'undefined') return;
  if (hasNavbarRunOnce) return;
  hasNavbarRunOnce = true;

  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    const bar = headerElement.querySelector('div.max-w-7xl');
    const logo = headerElement.querySelector('[data-gsap="nav-logo"], .nav-logo');
    const navLinks = headerElement.querySelectorAll('[data-gsap="nav-link"], nav a');
    const actions = headerElement.querySelectorAll('[data-gsap="nav-action"], header button');

    const tl = gsap.timeline({
      defaults: { ease: 'power2.out', force3D: true },
    });

    // 1. Container glides in from top cleanly without clipPath polygon recalculations
    if (bar) {
      tl.fromTo(
        bar,
        { y: -8, opacity: 0.7 },
        { y: 0, opacity: 1, duration: 0.36, clearProps: 'all' },
        0
      );
    }

    // 2. Logo appears right as container glides in
    if (logo) {
      tl.fromTo(
        logo,
        { opacity: 0.7, y: -2 },
        { opacity: 1, y: 0, duration: 0.28, clearProps: 'all' },
        0.04
      );
    }

    // 3. Nav links stagger in cleanly
    if (navLinks.length > 0) {
      tl.fromTo(
        navLinks,
        { opacity: 0.7, y: -2 },
        { opacity: 1, y: 0, duration: 0.26, stagger: 0.02, clearProps: 'all' },
        0.06
      );
    }

    // 4. Action buttons appear
    if (actions.length > 0) {
      tl.fromTo(
        actions,
        { opacity: 0.7, y: -2 },
        { opacity: 1, y: 0, duration: 0.26, stagger: 0.02, clearProps: 'all' },
        0.08
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
 * 0.04s -> Hero container horizontal reveal starts immediately with fluid overlap
 * 0.12s -> Hero headline lines text reveal
 * 0.18s -> Hero description
 * 0.20s -> Planet visual (Mobile: static 9KB single frame for pure 60fps; Desktop: subtle rotation)
 * 0.24s -> Hero benefits horizontal stagger (Tile 1 -> Tile 2 -> Tile 3)
 */
/**
 * Editorial Homepage Entrance:
 * Animates the actual banner and featured product section hierarchically:
 * 1. Hero banner: Smooth micro-rise + subtle scale settle (360ms)
 * 2. Category selector tabs: Settle at 80ms (280ms)
 * 3. Featured initial cards: Staggered entry at 120ms (300ms)
 */
export function animateHomepageHero(container: HTMLElement | null): (() => void) | undefined {
  if (!container || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    const banner = container.querySelector(
      '[data-gsap="hero-banner"], section[aria-label="Banner Promo Asterra"]'
    );
    const featuredSection = container.querySelector(
      '[data-gsap="featured-section"], #produk-unggulan'
    );
    const featuredTabs = featuredSection?.querySelector('[data-gsap="featured-tabs"]');
    const featuredCards = featuredSection?.querySelectorAll(
      '[data-gsap="featured-card"], [data-gsap="card"]'
    );

    const tl = gsap.timeline({
      defaults: { ease: 'power2.out', force3D: true },
    });

    // 1. Hero banner entrance
    if (banner) {
      tl.fromTo(
        banner,
        { opacity: 0.88, y: 8, scale: 0.995 },
        { opacity: 1, y: 0, scale: 1, duration: 0.36, clearProps: 'all' },
        0
      );
    }

    // 2. Featured Category Tabs
    if (featuredTabs) {
      tl.fromTo(
        featuredTabs,
        { opacity: 0.85, y: 6 },
        { opacity: 1, y: 0, duration: 0.28, clearProps: 'all' },
        0.08
      );
    }

    // 3. Initial Featured Cards (First 4 cards with tight stagger)
    if (featuredCards && featuredCards.length > 0) {
      const topCards = Array.from(featuredCards).slice(0, 4);
      tl.fromTo(
        topCards,
        { opacity: 0.85, y: 8 },
        { opacity: 1, y: 0, duration: 0.30, stagger: 0.035, clearProps: 'all' },
        0.12
      );
    }
  }, container);

  return () => ctx.revert();
}

/**
 * Backward-compatible alias for existing imports
 */
export const animateHeroMasterSequence = animateHomepageHero;

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
/**
 * Set up distinct, lightweight scroll-triggered reveals for below-the-fold sections:
 * - Keunggulan (#keunggulan)
 * - Panduan (#panduan)
 * - FAQ (#faq)
 * - CTA Banner
 * - Footer
 */
export function setupHomepageScrollReveal(root: HTMLElement | null): (() => void) | undefined {
  if (!root || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    const sections = [
      { id: 'keunggulan', selector: '[data-gsap-section="keunggulan"], #keunggulan' },
      { id: 'panduan', selector: '[data-gsap-section="panduan"], #panduan' },
      { id: 'faq', selector: '[data-gsap-section="faq"], #faq' },
      { id: 'cta', selector: '[data-gsap-section="cta"]' },
    ];

    sections.forEach(({ selector }) => {
      const sec = root.querySelector(selector);
      if (!sec) return;

      const header = sec.querySelector(
        '[data-gsap$="-header"], [data-gsap="cta-content"], div:first-child'
      );
      const items = sec.querySelectorAll(
        '[data-gsap$="-card"], [data-gsap$="-step"], [data-gsap="faq-item"], [data-gsap="cta-actions"], [data-gsap="card"]'
      );

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sec,
          start: 'top 88%',
          once: true,
        },
        defaults: { ease: 'power2.out', force3D: true },
      });

      if (header) {
        tl.fromTo(
          header,
          { opacity: 0.3, y: 10 },
          { opacity: 1, y: 0, duration: 0.35, clearProps: 'all' },
          0
        );
      }

      if (items.length > 0) {
        const limitedItems = Array.from(items).slice(0, 8);
        tl.fromTo(
          limitedItems,
          { opacity: 0.3, y: 12 },
          { opacity: 1, y: 0, duration: 0.36, stagger: 0.035, clearProps: 'all' },
          header ? 0.06 : 0
        );
      }
    });

    // Footer Scroll Reveal
    const footer = document.querySelector('footer[data-gsap="footer"], footer');
    if (footer) {
      const cols = footer.querySelectorAll('[data-gsap="footer-col"]');
      const bottom = footer.querySelector('[data-gsap="footer-bottom"]');

      const footerTl = gsap.timeline({
        scrollTrigger: {
          trigger: footer,
          start: 'top 92%',
          once: true,
        },
        defaults: { ease: 'power2.out', force3D: true },
      });

      if (cols.length > 0) {
        footerTl.fromTo(
          Array.from(cols),
          { opacity: 0.3, y: 10 },
          { opacity: 1, y: 0, duration: 0.35, stagger: 0.03, clearProps: 'all' },
          0
        );
      }

      if (bottom) {
        footerTl.fromTo(
          bottom,
          { opacity: 0.3, y: 6 },
          { opacity: 1, y: 0, duration: 0.30, clearProps: 'all' },
          0.1
        );
      }
    }
  }, root);

  return () => ctx.revert();
}

/* ==========================================================================
   4. FLOATING SUPPORT BUTTON
   ========================================================================== */

/**
 * Animate the floating support button with smooth micro-rise.
 */
export function animateFloatingButton(element: HTMLElement | null): (() => void) | undefined {
  if (!element || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const tween = gsap.fromTo(
    element,
    {
      y: 10,
      opacity: 0,
      scale: 0.95,
    },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.32,
      delay: 0.2,
      ease: 'power2.out',
      force3D: true,
      clearProps: 'all',
    }
  );

  return () => {
    tween.kill();
  };
}

/* ==========================================================================
   5. GENERAL SUBPAGE ENTRANCE & SCROLL REVEAL (FOR /products, /profile, ETC.)
   ========================================================================== */

/**
 * Animate general entrance elements on subpages (titles, breadcrumbs, content)
 * Fast, buttery 240-280ms transition with clear hierarchy.
 */
export function animatePageEntrance(container: HTMLElement | null): (() => void) | undefined {
  if (!container || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out', force3D: true },
    });

    // 1. Root page container immediate smooth fade
    tl.fromTo(
      container,
      { opacity: 0.9, y: 6 },
      { opacity: 1, y: 0, duration: 0.24, clearProps: 'all' },
      0
    );

    // 2. Headings & Titles
    const headings = container.querySelectorAll('h1, [data-gsap="page-title"]');
    if (headings.length > 0) {
      tl.fromTo(
        headings,
        { opacity: 0.85, y: 5 },
        { opacity: 1, y: 0, duration: 0.26, stagger: 0.025, clearProps: 'all' },
        0.02
      );
    }

    // 3. Subtitles & Leads
    const subheads = container.querySelectorAll(
      '[data-gsap="page-sub"], p[data-gsap="lead"], .hero-lead'
    );
    if (subheads.length > 0) {
      tl.fromTo(
        subheads,
        { opacity: 0.85, y: 4 },
        { opacity: 1, y: 0, duration: 0.26, stagger: 0.02, clearProps: 'all' },
        0.04
      );
    }

    // 4. Above-the-fold Cards (First 6 cards only)
    const cards = container.querySelectorAll(
      '[data-gsap="card"], [data-gsap="hero-card"], [data-gsap="benefit-card"]'
    );
    if (cards.length > 0) {
      const topCards = Array.from(cards).slice(0, 6);
      tl.fromTo(
        topCards,
        { opacity: 0.88, y: 6 },
        { opacity: 1, y: 0, duration: 0.28, stagger: 0.03, clearProps: 'all' },
        0.06
      );
    }
  }, container);

  return () => ctx.revert();
}

/* ==========================================================================
   6. COMPONENT-LEVEL SCROLL TRIGGERS & HOVER MICRO-INTERACTIONS
   ========================================================================== */

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
