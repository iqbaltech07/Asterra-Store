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

/**
 * Check if current viewport is mobile (< 768px).
 */
export function isMobileScreen(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Convert any target into a guaranteed array of valid Element instances.
 * Prevents GSAP "Cannot read properties of null (reading '_gsap')" crash.
 */
export function toSafeTargets(target: gsap.TweenTarget | null | undefined): Element[] {
  if (!target) return [];
  if (typeof target === 'string') {
    if (typeof document === 'undefined') return [];
    try {
      return Array.from(document.querySelectorAll(target));
    } catch {
      return [];
    }
  }
  if (target instanceof Element) return [target];
  if (target instanceof NodeList) {
    return Array.from(target).filter((el): el is Element => el instanceof Element);
  }
  if (Array.isArray(target)) {
    return target.filter((el): el is Element => el instanceof Element);
  }
  return [];
}

export interface MotionOptions {
  duration?: number;
  delay?: number;
  ease?: string;
  dist?: number;
  stagger?: number | gsap.StaggerVars;
  scale?: number;
  onComplete?: () => void;
}

/* ==========================================================================
   REUSABLE MOTION SYSTEM PRIMITIVES
   ========================================================================== */

/**
 * 1. Vertical Rise: y: 20–40px → 0, opacity: 0 → 1
 */
export function animateFadeUp(
  target: gsap.TweenTarget,
  options: MotionOptions = {}
) {
  const elements = toSafeTargets(target);
  if (elements.length === 0) return;

  const reduced = prefersReducedMotion();
  const dur = options.duration ?? (reduced ? 0.2 : isMobileScreen() ? 0.36 : 0.44);
  const ease = options.ease ?? (reduced ? 'power1.out' : 'power3.out');
  const dist = options.dist ?? (reduced ? 0 : 25);

  if (reduced) {
    return gsap.fromTo(
      elements,
      { opacity: 0 },
      {
        opacity: 1,
        duration: dur,
        delay: options.delay ?? 0,
        ease,
        stagger: options.stagger ?? 0,
        clearProps: 'opacity',
        onComplete: options.onComplete,
      }
    );
  }

  return gsap.fromTo(
    elements,
    { y: dist, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: dur,
      delay: options.delay ?? 0,
      ease,
      stagger: options.stagger ?? 0,
      force3D: true,
      clearProps: 'transform,opacity',
      onComplete: options.onComplete,
    }
  );
}

/**
 * 2. Horizontal reveal from left: x: -20px → 0, opacity: 0 → 1
 */
export function animateSlideFromLeft(
  target: gsap.TweenTarget,
  options: MotionOptions = {}
) {
  const elements = toSafeTargets(target);
  if (elements.length === 0) return;

  const reduced = prefersReducedMotion();
  const dur = options.duration ?? (reduced ? 0.2 : 0.42);
  const ease = options.ease ?? (reduced ? 'power1.out' : 'power3.out');
  const dist = options.dist ?? (reduced ? 0 : 18);

  if (reduced) {
    return gsap.fromTo(
      elements,
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
    elements,
    { x: -dist, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      duration: dur,
      delay: options.delay ?? 0,
      ease,
      stagger: options.stagger ?? 0,
      force3D: true,
      clearProps: 'transform,opacity',
      onComplete: options.onComplete,
    }
  );
}

/**
 * 3. Horizontal reveal from right: x: 20px → 0, opacity: 0 → 1
 */
export function animateSlideFromRight(
  target: gsap.TweenTarget,
  options: MotionOptions = {}
) {
  const elements = toSafeTargets(target);
  if (elements.length === 0) return;

  const reduced = prefersReducedMotion();
  const dur = options.duration ?? (reduced ? 0.2 : 0.42);
  const ease = options.ease ?? (reduced ? 'power1.out' : 'power3.out');
  const dist = options.dist ?? (reduced ? 0 : 18);

  if (reduced) {
    return gsap.fromTo(
      elements,
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
    elements,
    { x: dist, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      duration: dur,
      delay: options.delay ?? 0,
      ease,
      stagger: options.stagger ?? 0,
      force3D: true,
      clearProps: 'transform,opacity',
      onComplete: options.onComplete,
    }
  );
}

/**
 * 4. Clip-path or Vertical reveal
 * Types: 'clip-horizontal' | 'top-reveal' | 'bottom-reveal'
 */
export function animateReveal(
  target: gsap.TweenTarget,
  options: MotionOptions & { type?: 'clip-horizontal' | 'top-reveal' | 'bottom-reveal' } = {}
) {
  const elements = toSafeTargets(target);
  if (elements.length === 0) return;

  const type = options.type ?? 'clip-horizontal';
  const reduced = prefersReducedMotion();

  if (reduced) {
    return gsap.fromTo(
      elements,
      { opacity: 0 },
      {
        opacity: 1,
        duration: options.duration ?? 0.25,
        delay: options.delay ?? 0,
        ease: 'power1.out',
        clearProps: 'opacity',
        onComplete: options.onComplete,
      }
    );
  }

  if (type === 'clip-horizontal') {
    const dur = options.duration ?? (isMobileScreen() ? 0.72 : 0.82);
    return gsap.fromTo(
      elements,
      { clipPath: 'inset(0% 100% 0% 0%)', opacity: 0 },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        opacity: 1,
        duration: dur,
        delay: options.delay ?? 0,
        ease: options.ease ?? 'power3.inOut',
        force3D: true,
        clearProps: 'clipPath,opacity',
        onComplete: options.onComplete,
      }
    );
  }

  if (type === 'top-reveal') {
    const dur = options.duration ?? 0.7;
    return gsap.fromTo(
      elements,
      { yPercent: -100, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: dur,
        delay: options.delay ?? 0,
        ease: options.ease ?? 'power3.out',
        force3D: true,
        clearProps: 'transform,opacity',
        onComplete: options.onComplete,
      }
    );
  }

  // bottom-reveal
  const dur = options.duration ?? 0.7;
  return gsap.fromTo(
    elements,
    { yPercent: 100, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      duration: dur,
      delay: options.delay ?? 0,
      ease: options.ease ?? 'power3.out',
      force3D: true,
      clearProps: 'transform,opacity',
      onComplete: options.onComplete,
    }
  );
}

/**
 * 5. Stagger for lists/cards
 */
export function animateStagger(
  targets: gsap.TweenTarget,
  options: MotionOptions = {}
) {
  const elements = toSafeTargets(targets);
  if (elements.length === 0) return;

  const reduced = prefersReducedMotion();
  const mobile = isMobileScreen();
  const dur = options.duration ?? (reduced ? 0.2 : 0.38);
  const staggerTime = options.stagger ?? (reduced ? 0 : mobile ? 0.03 : 0.045);
  const dist = options.dist ?? (reduced ? 0 : 25);

  if (reduced) {
    return gsap.fromTo(
      elements,
      { opacity: 0 },
      {
        opacity: 1,
        duration: dur,
        delay: options.delay ?? 0,
        stagger: 0.02,
        ease: 'power1.out',
        clearProps: 'opacity',
        onComplete: options.onComplete,
      }
    );
  }

  return gsap.fromTo(
    elements,
    { y: dist, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: dur,
      delay: options.delay ?? 0,
      stagger: staggerTime,
      ease: options.ease ?? 'power3.out',
      force3D: true,
      clearProps: 'transform,opacity',
      onComplete: options.onComplete,
    }
  );
}

/**
 * 6. Subtle Scale & Rise for Buttons/Pills/Icons
 */
export function animateButton(
  target: gsap.TweenTarget,
  options: MotionOptions = {}
) {
  const elements = toSafeTargets(target);
  if (elements.length === 0) return;

  const reduced = prefersReducedMotion();
  const dur = options.duration ?? (reduced ? 0.2 : 0.36);
  const dist = options.dist ?? (reduced ? 0 : 16);
  const scaleFrom = options.scale ?? (reduced ? 1 : 0.97);

  if (reduced) {
    return gsap.fromTo(
      elements,
      { opacity: 0 },
      {
        opacity: 1,
        duration: dur,
        delay: options.delay ?? 0,
        ease: 'power1.out',
        clearProps: 'opacity',
        onComplete: options.onComplete,
      }
    );
  }

  return gsap.fromTo(
    elements,
    { y: dist, opacity: 0, scale: scaleFrom },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: dur,
      delay: options.delay ?? 0,
      ease: options.ease ?? 'power3.out',
      stagger: options.stagger ?? 0,
      force3D: true,
      clearProps: 'transform,opacity',
      onComplete: options.onComplete,
    }
  );
}

/**
 * 7. Section Entrance Helper
 */
export function animateSection(
  section: HTMLElement | null,
  options: MotionOptions = {}
) {
  if (!section) return;
  const heading = section.querySelector('[data-gsap="section-heading"], h2, h3');
  const items = section.querySelectorAll('[data-gsap="card"], [data-gsap="product-card"], .grid > div');

  const tl = gsap.timeline({ defaults: { ease: 'power3.out', force3D: true } });
  if (heading) {
    tl.fromTo(heading, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, clearProps: 'all' }, options.delay ?? 0);
  }
  if (items.length > 0) {
    const limited = Array.from(items).slice(0, 8);
    tl.fromTo(
      limited,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.38, stagger: 0.04, clearProps: 'all' },
      heading ? '-=0.2' : (options.delay ?? 0)
    );
  }
  return tl;
}

/* ==========================================================================
   BACKWARD-COMPATIBLE UTILITIES & ALIASES
   ========================================================================== */

export const revealFromTop = (target: gsap.TweenTarget, options: MotionOptions = {}) =>
  animateReveal(target, { ...options, type: 'top-reveal' });

export const revealHorizontal = (target: gsap.TweenTarget, options: MotionOptions = {}) =>
  animateReveal(target, { ...options, type: 'clip-horizontal' });

export const revealFromBottom = (target: gsap.TweenTarget, options: MotionOptions = {}) =>
  animateFadeUp(target, options);

export const revealFromSide = (target: gsap.TweenTarget, options: MotionOptions = {}) =>
  animateSlideFromLeft(target, options);

export const revealScale = (target: gsap.TweenTarget, options: MotionOptions = {}) =>
  animateButton(target, options);

/* ==========================================================================
   1. NAVBAR MOTION ORCHESTRATION
   ========================================================================== */

let hasNavbarRunOnce = false;

/**
 * Navbar Entrance on initial page load / full browser refresh.
 * yPercent: -100 → 0, opacity: 0 → 1, duration: 0.7s, ease: power3.out.
 * Persistent: never restarts on SPA route navigation.
 */
export function animateNavbar(headerElement: HTMLElement | null): (() => void) | undefined {
  if (!headerElement || typeof window === 'undefined') return;
  if (hasNavbarRunOnce) return;
  hasNavbarRunOnce = true;

  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    const bar = headerElement.querySelector('[data-gsap="nav-bar"], div.max-w-7xl') || headerElement;

    gsap.fromTo(
      bar,
      {
        yPercent: -100,
        opacity: 0,
      },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
        force3D: true,
        clearProps: 'transform,opacity',
      }
    );
  }, headerElement);

  return () => ctx.revert();
}

/* ==========================================================================
   2. HOMEPAGE HERO & PRODUCT SECTION MASTER CHOREOGRAPHY
   ========================================================================== */

/**
 * AsterraStore Homepage Master Sequence:
 * - Hero banner: clip-path inset(0 100% 0 0) → inset(0 0 0 0), 0.75-0.85s, power3.inOut
 * - Inner visual: y: 15px → 0, opacity 0.92 → 1, 0.5s
 * - Text hero: y: 30px → 0, opacity: 0 → 1, delay: 0.25-0.35s
 * - Hero button: y: 20px → 0, opacity: 0 → 1, scale: 0.97 → 1, delay: 0.4s
 * - Section heading: y: 25px → 0, opacity: 0 → 1
 * - Category tabs: y: 15px → 0, opacity: 0 → 1
 * - Product cards: y: 25px → 0, opacity: 0 → 1, stagger: 0.04-0.06s
 * - Product card inner: name y: 8px → 0, price y: 10px → 0, CTA y: 8px → 0
 */
export function animateHomepageHero(container: HTMLElement | null): (() => void) | undefined {
  if (!container || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    const banner = container.querySelector(
      '[data-gsap="hero-banner"], section[aria-label="Banner Promo Asterra"]'
    );
    const bannerInner = banner?.querySelector(
      '[data-gsap="hero-banner-inner"], a, img'
    );
    const heroTexts = container.querySelectorAll(
      '[data-gsap="hero-text"], [data-gsap="referral-text"]'
    );
    const heroButtons = container.querySelectorAll('[data-gsap="hero-button"]');

    // Homepage product section
    const heading = container.querySelector('[data-gsap="section-heading"]');
    const categoryTabs = container.querySelector(
      '[data-gsap="category-tabs"], [data-gsap="featured-tabs"]'
    );
    const productCards = container.querySelectorAll(
      '[data-gsap="featured-card"], [data-gsap="product-card"], [data-gsap="card"]'
    );

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out', force3D: true },
    });

    // 1. Hero banner: CapCut-style horizontal wipe reveal
    if (banner) {
      tl.fromTo(
        banner,
        {
          clipPath: 'inset(0% 100% 0% 0%)',
          opacity: 0,
        },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          opacity: 1,
          duration: 0.8,
          ease: 'power3.inOut',
          clearProps: 'clipPath,opacity',
        },
        0.05
      );
    }

    // 2. Banner inner visual settle
    if (bannerInner) {
      tl.fromTo(
        bannerInner,
        {
          y: 15,
          opacity: 0.92,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        },
        0.2
      );
    }

    // 3. Hero text rise
    if (heroTexts.length > 0) {
      tl.fromTo(
        heroTexts,
        {
          y: 30,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.48,
          ease: 'power3.out',
          stagger: 0.05,
          clearProps: 'transform,opacity',
        },
        0.28
      );
    }

    // 4. Hero button settle
    if (heroButtons.length > 0) {
      tl.fromTo(
        heroButtons,
        {
          y: 20,
          opacity: 0,
          scale: 0.97,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        },
        0.38
      );
    }

    // 5. Section heading
    if (heading) {
      tl.fromTo(
        heading,
        {
          y: 25,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        },
        0.34
      );
    }

    // 6. Category tabs
    if (categoryTabs) {
      tl.fromTo(
        categoryTabs,
        {
          y: 15,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.38,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        },
        0.38
      );
    }

    // 7. Product cards stagger
    if (productCards.length > 0) {
      const topCards = Array.from(productCards).slice(0, 8);
      tl.fromTo(
        topCards,
        {
          y: 25,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.42,
          ease: 'power3.out',
          stagger: isMobileScreen() ? 0.03 : 0.05,
          clearProps: 'transform,opacity',
        },
        0.42
      );

      // Micro elements inside top cards
      const names = container.querySelectorAll('[data-gsap="product-title"]');
      const prices = container.querySelectorAll('[data-gsap="product-price"]');
      const cardBtns = container.querySelectorAll('[data-gsap="product-button"]');

      if (names.length > 0) {
        tl.fromTo(
          Array.from(names).slice(0, 6),
          { y: 8 },
          { y: 0, duration: 0.28, stagger: 0.02, clearProps: 'transform' },
          0.5
        );
      }
      if (prices.length > 0) {
        tl.fromTo(
          Array.from(prices).slice(0, 6),
          { y: 10 },
          { y: 0, duration: 0.28, stagger: 0.02, clearProps: 'transform' },
          0.52
        );
      }
      if (cardBtns.length > 0) {
        tl.fromTo(
          Array.from(cardBtns).slice(0, 6),
          { y: 8 },
          { y: 0, duration: 0.28, stagger: 0.02, clearProps: 'transform' },
          0.54
        );
      }
    }
  }, container);

  return () => ctx.revert();
}

export const animateHeroMasterSequence = animateHomepageHero;

/* ==========================================================================
   3. HOMEPAGE SCROLL REVEAL (BELOW-THE-FOLD SECTIONS)
   ========================================================================== */

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
  }, root);

  return () => ctx.revert();
}

/* ==========================================================================
   4. PRODUCTS PAGE (/products)
   ========================================================================== */

export function animateProductsPage(container: HTMLElement | null): (() => void) | undefined {
  if (!container || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    const breadcrumb = container.querySelector('[data-gsap="breadcrumb"]');
    const title = container.querySelector('[data-gsap="page-title"], h1');
    const desc = container.querySelector('[data-gsap="page-desc"], p[data-gsap="lead"], p.text-xs');
    const badge = container.querySelector('[data-gsap="hero-badge"]');
    const search = container.querySelector('[data-gsap="search-bar"]');
    const filters = container.querySelector('[data-gsap="filter-controls"]');
    const categoryTabs = container.querySelector('[data-gsap="category-tabs"]');
    const cards = container.querySelectorAll('[data-gsap="product-card"], [data-gsap="card"]');
    const pagination = container.querySelector('[data-gsap="pagination"], nav[aria-label="Pagination"]');

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', force3D: true } });

    // Breadcrumb: x: -15px → 0, opacity 0 → 1
    if (breadcrumb) {
      tl.fromTo(breadcrumb, { x: -15, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, clearProps: 'all' }, 0);
    }

    // Page title: y: 30px → 0, opacity 0 → 1
    if (title) {
      tl.fromTo(title, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42, clearProps: 'all' }, 0.04);
    }

    // Description: y: 15px → 0, opacity 0 → 1
    if (desc) {
      tl.fromTo(desc, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, clearProps: 'all' }, 0.08);
    }

    // Badge
    if (badge) {
      tl.fromTo(badge, { y: 12, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.36, clearProps: 'all' }, 0.1);
    }

    // Search: x: 20px → 0, opacity 0 → 1
    if (search) {
      tl.fromTo(search, { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, clearProps: 'all' }, 0.12);
    }

    // Filter controls: y: 15px → 0, opacity 0 → 1
    if (filters) {
      tl.fromTo(filters, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, clearProps: 'all' }, 0.14);
    }

    // Category tabs: y: 15px → 0
    if (categoryTabs) {
      tl.fromTo(categoryTabs, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.36, clearProps: 'all' }, 0.16);
    }

    // Product cards: y: 25px → 0, opacity 0 → 1, stagger 40ms
    if (cards.length > 0) {
      const topCards = Array.from(cards).slice(0, 9);
      tl.fromTo(
        topCards,
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.04, clearProps: 'all' },
        0.2
      );
    }

    // Pagination: y: 15px → 0
    if (pagination) {
      tl.fromTo(pagination, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, clearProps: 'all' }, 0.32);
    }
  }, container);

  return () => ctx.revert();
}

/* ==========================================================================
   5. PRODUCT DETAIL PAGE (/products/[id])
   ========================================================================== */

export function animateProductDetailPage(container: HTMLElement | null): (() => void) | undefined {
  if (!container || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    const breadcrumb = container.querySelector('[data-gsap="breadcrumb"]');
    const imageBanner = container.querySelector('[data-gsap="product-detail-image"]');
    const title = container.querySelector('[data-gsap="product-detail-title"]');
    const badge = container.querySelector('[data-gsap="product-detail-badge"]');
    const benefits = container.querySelector('[data-gsap="product-detail-benefits"]');
    const orderBox = container.querySelector('[data-gsap="product-detail-order-box"]');
    const price = container.querySelector('[data-gsap="product-detail-price"]');
    const variants = container.querySelector('[data-gsap="product-detail-variants"]');
    const quantity = container.querySelector('[data-gsap="product-detail-quantity"]');
    const cta = container.querySelector('[data-gsap="product-detail-cta"]');
    const desc = container.querySelector('[data-gsap="product-detail-desc"]');
    const related = container.querySelectorAll(
      '[data-gsap="product-detail-related"] [data-gsap="product-card"], [data-gsap="product-detail-related"] .grid > div'
    );

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', force3D: true } });

    // Breadcrumb: x: -15 → 0
    if (breadcrumb) {
      tl.fromTo(breadcrumb, { x: -15, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, clearProps: 'all' }, 0);
    }

    // Product image: clip/reveal from left
    if (imageBanner) {
      tl.fromTo(
        imageBanner,
        { clipPath: 'inset(0% 100% 0% 0%)', opacity: 0.4 },
        { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, duration: 0.72, ease: 'power3.inOut', clearProps: 'clipPath,opacity' },
        0.04
      );
    }

    // Product title: y: 25 → 0
    if (title) {
      tl.fromTo(title, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42, clearProps: 'all' }, 0.12);
    }

    // Brand / category: y: 12 → 0
    if (badge) {
      tl.fromTo(badge, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.36, clearProps: 'all' }, 0.15);
    }

    // Rating / benefits: y: 10 → 0
    if (benefits) {
      tl.fromTo(benefits, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, clearProps: 'all' }, 0.18);
    }

    // Order box container
    if (orderBox) {
      tl.fromTo(orderBox, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.44, clearProps: 'all' }, 0.1);
    }

    // Price: y: 20 → 0
    if (price) {
      tl.fromTo(price, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, clearProps: 'all' }, 0.18);
    }

    // Variant selector: y: 15 → 0
    if (variants) {
      tl.fromTo(variants, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, clearProps: 'all' }, 0.22);
    }

    // Quantity: y: 10 → 0
    if (quantity) {
      tl.fromTo(quantity, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, clearProps: 'all' }, 0.26);
    }

    // CTA: y: 20 → 0, opacity 0 → 1, scale 0.97 → 1
    if (cta) {
      tl.fromTo(cta, { y: 20, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, clearProps: 'all' }, 0.3);
    }

    // Description: y: 20 → 0
    if (desc) {
      tl.fromTo(desc, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42, clearProps: 'all' }, 0.25);
    }

    // Related products: stagger
    if (related.length > 0) {
      const topRelated = Array.from(related).slice(0, 6);
      tl.fromTo(
        topRelated,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.04, clearProps: 'all' },
        0.35
      );
    }
  }, container);

  return () => ctx.revert();
}

/* ==========================================================================
   6. ORDERS PAGE (/orders)
   ========================================================================== */

export function animateOrdersPage(container: HTMLElement | null): (() => void) | undefined {
  if (!container || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    const breadcrumb = container.querySelector('[data-gsap="breadcrumb"]');
    const heading = container.querySelector('[data-gsap="orders-title"]');
    const desc = container.querySelector('[data-gsap="orders-desc"]');
    const tabs = container.querySelector('[data-gsap="orders-tabs"]');
    const buttons = container.querySelectorAll('[data-gsap="orders-button"]');
    const cards = container.querySelectorAll('[data-gsap="order-card"]');
    const badges = container.querySelectorAll('[data-gsap="order-status"]');
    const info = container.querySelectorAll('[data-gsap="order-info"]');

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', force3D: true } });

    if (breadcrumb) {
      tl.fromTo(breadcrumb, { x: -15, opacity: 0 }, { x: 0, opacity: 1, duration: 0.32, clearProps: 'all' }, 0);
    }

    // Heading: y: 25 → 0
    if (heading) {
      tl.fromTo(heading, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, clearProps: 'all' }, 0.04);
    }

    if (desc) {
      tl.fromTo(desc, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.36, clearProps: 'all' }, 0.08);
    }

    // Tabs: y: 15 → 0
    if (tabs) {
      tl.fromTo(tabs, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, clearProps: 'all' }, 0.12);
    }

    // Button: y: 10 → 0
    if (buttons.length > 0) {
      tl.fromTo(buttons, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, clearProps: 'all' }, 0.14);
    }

    // Order cards: y: 25 → 0, stagger 50ms
    if (cards.length > 0) {
      const topCards = Array.from(cards).slice(0, 8);
      tl.fromTo(
        topCards,
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.42, stagger: 0.05, clearProps: 'all' },
        0.18
      );

      // Status badge: opacity 0 → 1, scale 0.95 → 1
      if (badges.length > 0) {
        tl.fromTo(
          Array.from(badges).slice(0, 8),
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.35, stagger: 0.03, clearProps: 'all' },
          0.26
        );
      }

      // Order information: y: 8 → 0
      if (info.length > 0) {
        tl.fromTo(
          Array.from(info).slice(0, 8),
          { y: 8, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.32, stagger: 0.03, clearProps: 'all' },
          0.24
        );
      }
    }
  }, container);

  return () => ctx.revert();
}

/* ==========================================================================
   7. SELLER PAGE (/seller)
   ========================================================================== */

export function animateSellerPage(container: HTMLElement | null): (() => void) | undefined {
  if (!container || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    const hero = container.querySelector('[data-gsap="seller-hero"]');
    const title = container.querySelector('[data-gsap="seller-title"]');
    const desc = container.querySelector('[data-gsap="seller-desc"]');
    const cards = container.querySelectorAll('[data-gsap="seller-card"]');
    const info = container.querySelector('[data-gsap="seller-info"]');
    const cta = container.querySelector('[data-gsap="seller-cta"]');

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', force3D: true } });

    if (hero) {
      tl.fromTo(hero, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, clearProps: 'all' }, 0);
    }

    // Heading: y: 25 → 0
    if (title) {
      tl.fromTo(title, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42, clearProps: 'all' }, 0.08);
    }

    // Description: y: 15 → 0
    if (desc) {
      tl.fromTo(desc, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, clearProps: 'all' }, 0.12);
    }

    // Stats / benefit cards: y: 20 → 0, stagger
    if (cards.length > 0) {
      const topCards = Array.from(cards).slice(0, 8);
      tl.fromTo(
        topCards,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.045, clearProps: 'all' },
        0.16
      );
    }

    // Form / sales information: y: 20 → 0
    if (info) {
      tl.fromTo(info, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42, clearProps: 'all' }, 0.2);
    }

    // CTA: y: 15 → 0, scale 0.97 → 1
    if (cta) {
      tl.fromTo(cta, { y: 15, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.38, clearProps: 'all' }, 0.25);
    }
  }, container);

  return () => ctx.revert();
}

/* ==========================================================================
   8. DAFTAR SALES PAGE (/daftar-sales)
   ========================================================================== */

export function animateDaftarSalesPage(container: HTMLElement | null): (() => void) | undefined {
  if (!container || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    const heading = container.querySelector('[data-gsap="daftar-title"]');
    const desc = container.querySelector('[data-gsap="daftar-desc"]');
    const featureCards = container.querySelectorAll('[data-gsap="daftar-feature-card"]');
    const form = container.querySelector('[data-gsap="daftar-form"]');
    const inputs = container.querySelectorAll('[data-gsap="daftar-input"], form > div');
    const button = container.querySelector('[data-gsap="daftar-button"]');

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', force3D: true } });

    // Heading: y: 25 → 0
    if (heading) {
      tl.fromTo(heading, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.42, clearProps: 'all' }, 0);
    }

    // Description: y: 15 → 0
    if (desc) {
      tl.fromTo(desc, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, clearProps: 'all' }, 0.06);
    }

    // Form sections / feature cards: y: 20 → 0, stagger
    if (featureCards.length > 0) {
      tl.fromTo(
        Array.from(featureCards),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, clearProps: 'all' },
        0.12
      );
    }

    // Form container: y: 20 → 0
    if (form) {
      tl.fromTo(form, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.44, clearProps: 'all' }, 0.18);
    }

    // Inputs: opacity 0 → 1, y: 8 → 0
    if (inputs.length > 0) {
      const topInputs = Array.from(inputs).slice(0, 6);
      tl.fromTo(
        topInputs,
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.32, stagger: 0.03, clearProps: 'all' },
        0.24
      );
    }

    // Button: y: 15 → 0, scale 0.97 → 1
    if (button) {
      tl.fromTo(button, { y: 15, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.38, clearProps: 'all' }, 0.32);
    }
  }, container);

  return () => ctx.revert();
}

/* ==========================================================================
   9. SALES LOGIN PAGE (/sales/login)
   ========================================================================== */

export function animateSalesLoginPage(container: HTMLElement | null): (() => void) | undefined {
  if (!container || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    const card = container.querySelector('[data-gsap="login-card"], .card');
    const logo = container.querySelector('[data-gsap="login-logo"]');
    const heading = container.querySelector('[data-gsap="login-heading"], h2, h3');
    const inputs = container.querySelectorAll('[data-gsap="login-input"]');
    const button = container.querySelector('[data-gsap="login-button"]');

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', force3D: true } });

    // Card: y: 30 → 0, opacity 0 → 1
    if (card) {
      tl.fromTo(card, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.48, clearProps: 'all' }, 0);
    }

    // Logo: y: -10 → 0, opacity 0 → 1
    if (logo) {
      tl.fromTo(logo, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.36, clearProps: 'all' }, 0.1);
    }

    // Heading: y: 15 → 0
    if (heading) {
      tl.fromTo(heading, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, clearProps: 'all' }, 0.14);
    }

    // Inputs: y: 10 → 0, stagger
    if (inputs.length > 0) {
      tl.fromTo(
        Array.from(inputs),
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.34, stagger: 0.04, clearProps: 'all' },
        0.18
      );
    }

    // Button: y: 12 → 0, opacity 0 → 1, scale 0.97 → 1
    if (button) {
      tl.fromTo(button, { y: 12, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.38, clearProps: 'all' }, 0.26);
    }
  }, container);

  return () => ctx.revert();
}

/* ==========================================================================
   10. FOOTER SCROLL REVEAL
   ========================================================================== */

/**
 * Footer bottom reveal triggered when footer enters viewport.
 * footer inner: yPercent: 100 → 0, opacity: 0 → 1, duration: 0.65-0.75s, power3.out.
 * Child: logo, columns stagger, copyright fade.
 */
export function setupFooterReveal(footerElement: HTMLElement | null): (() => void) | undefined {
  if (!footerElement || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    const footerContent = footerElement.querySelector('[data-gsap="footer-content"], div.max-w-7xl') || footerElement;
    const cols = footerElement.querySelectorAll('[data-gsap="footer-col"]');
    const bottom = footerElement.querySelector('[data-gsap="footer-bottom"]');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: footerElement,
        start: 'top 92%',
        once: true,
      },
      defaults: { ease: 'power3.out', force3D: true },
    });

    // Footer inner: yPercent: 100 → 0, opacity: 0 → 1, duration: 0.7s
    tl.fromTo(
      footerContent,
      { yPercent: 100, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.7, clearProps: 'transform,opacity' },
      0
    );

    // Columns stagger
    if (cols.length > 0) {
      tl.fromTo(
        Array.from(cols),
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.04, clearProps: 'all' },
        0.2
      );
    }

    // Bottom copyright & links
    if (bottom) {
      tl.fromTo(
        bottom,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, clearProps: 'opacity' },
        0.35
      );
    }
  }, footerElement);

  return () => ctx.revert();
}

/* ==========================================================================
   11. GENERAL SUBPAGE FALLBACK
   ========================================================================== */

export function animateGeneralSubpage(container: HTMLElement | null): (() => void) | undefined {
  if (!container || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    const breadcrumb = container.querySelector('nav[aria-label="Breadcrumb"], [data-gsap="breadcrumb"]');
    const heading = container.querySelector('h1, [data-gsap="page-title"]');
    const desc = container.querySelector('p[data-gsap="page-sub"], p[data-gsap="lead"], [data-gsap="page-desc"]');
    const cards = container.querySelectorAll('[data-gsap="card"], [data-gsap="product-card"], form, .grid > div:not(.col-span-12)');

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', force3D: true } });

    if (breadcrumb) {
      tl.fromTo(breadcrumb, { x: -15, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, clearProps: 'all' }, 0);
    }
    if (heading) {
      tl.fromTo(heading, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, clearProps: 'all' }, 0.04);
    }
    if (desc) {
      tl.fromTo(desc, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, clearProps: 'all' }, 0.08);
    }
    if (cards.length > 0) {
      const topCards = Array.from(cards).slice(0, 8);
      tl.fromTo(
        topCards,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.42, stagger: 0.035, clearProps: 'all' },
        0.12
      );
    }
  }, container);

  return () => ctx.revert();
}

export const animatePageEntrance = animateGeneralSubpage;

/* ==========================================================================
   12. FLOATING SUPPORT BUTTON
   ========================================================================== */

export function animateFloatingButton(element: HTMLElement | null): (() => void) | undefined {
  if (!element || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const tween = gsap.fromTo(
    element,
    {
      y: 8,
      opacity: 0,
      scale: 0.96,
    },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.28,
      delay: 0.15,
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
   13. CARD HOVER MICRO-INTERACTIONS
   ========================================================================== */

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
