'use client';

import gsap from 'gsap';

// Helper to check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animate Header & Navbar components smoothly on mount
 */
export function animateNavbar(headerElement: HTMLElement | null) {
  if (!headerElement || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    // 1. Logo mark & brand image animation (subtle drop & fade)
    const logo = headerElement.querySelector('[data-gsap="nav-logo"], .nav-logo');
    if (logo) {
      gsap.fromTo(
        logo,
        { y: -10, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'power2.out' }
      );
    }

    // 2. Navigation links (staggered cascade from top)
    const navLinks = headerElement.querySelectorAll('[data-gsap="nav-link"], nav a');
    if (navLinks.length > 0) {
      gsap.fromTo(
        navLinks,
        { y: -8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: 'power2.out', delay: 0.08 }
      );
    }

    // 3. Action buttons (cart, profile, login, mobile toggle)
    const actions = headerElement.querySelectorAll('[data-gsap="nav-action"], header button');
    if (actions.length > 0) {
      gsap.fromTo(
        actions,
        { scale: 0.94, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, stagger: 0.05, ease: 'back.out(1.2)', delay: 0.12 }
      );
    }
  }, headerElement);

  return () => ctx.revert();
}

/**
 * Animate page entrance elements (Hero, titles, lead texts, media, badges)
 */
export function animatePageEntrance(container: HTMLElement | null) {
  if (!container || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    // 1. Main Headings (h1, page titles)
    const headings = container.querySelectorAll('h1, [data-gsap="page-title"]');
    if (headings.length > 0) {
      gsap.fromTo(
        headings,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.07 }
      );
    }

    // 2. Subtitles & Lead descriptions
    const subheads = container.querySelectorAll(
      '[data-gsap="page-sub"], p[data-gsap="lead"], .hero-lead'
    );
    if (subheads.length > 0) {
      gsap.fromTo(
        subheads,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', delay: 0.08, stagger: 0.05 }
      );
    }

    // 3. Hero media, graphics, and images
    const media = container.querySelectorAll(
      '[data-gsap="hero-media"], [data-gsap="media"]'
    );
    if (media.length > 0) {
      gsap.fromTo(
        media,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.65, ease: 'power2.out', delay: 0.06 }
      );
    }

    // 4. Initial above-the-fold cards / benefit badges
    const initialCards = container.querySelectorAll(
      '[data-gsap="hero-card"], [data-gsap="benefit-card"]'
    );
    if (initialCards.length > 0) {
      gsap.fromTo(
        initialCards,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out', delay: 0.15 }
      );
    }
  }, container);

  return () => ctx.revert();
}

/**
 * Set up smooth, lightweight scroll reveals for sections, headings, and card grids across any page.
 * Uses IntersectionObserver so there is zero scroll-lag or heavy ScrollTrigger overhead.
 */
export function setupScrollReveal(root: HTMLElement | null) {
  if (!root || typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;

  const observed = new WeakSet<Element>();

  const reveal = (target: HTMLElement) => {
    // Section heading + its sibling description only (never pick text inside cards)
    const header = target.querySelector<HTMLElement>('h2, [data-gsap="section-title"]');
    const desc = header?.parentElement?.querySelector<HTMLElement>('p') ?? null;

    const cardNodes = target.querySelectorAll<HTMLElement>('[data-gsap="card"], .grid > div');
    const cards = Array.from(cardNodes).filter((el) => !el.closest('.carousel-viewport'));

    const tl = gsap.timeline({ defaults: { ease: 'power2.out', overwrite: 'auto' } });

    if (header) tl.fromTo(header, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 });
    if (desc) tl.fromTo(desc, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, '<0.1');

    if (cards.length > 0) {
      // Cap stagger to first 12 items; the rest appear together to keep it light
      tl.fromTo(
        cards,
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
          stagger: { each: 0.04, amount: Math.min(cards.length, 12) * 0.04 },
          clearProps: 'transform',
        },
        header || desc ? '<0.12' : 0
      );
    } else if (!header && !desc) {
      tl.fromTo(target, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, clearProps: 'transform' });
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
    { rootMargin: '0px 0px -30px 0px', threshold: 0.06 }
  );

  const scan = () => {
    root.querySelectorAll<HTMLElement>('[data-gsap-reveal]').forEach((el) => {
      if (observed.has(el) || el.closest('.carousel-track')) return;
      observed.add(el);
      io.observe(el);
    });
  };

  scan();

  // Pick up sections rendered later (data fetched async, view mode toggles, etc.)
  const mo = new MutationObserver(() => scan());
  mo.observe(root, { childList: true, subtree: true });

  return () => {
    io.disconnect();
    mo.disconnect();
  };
}
