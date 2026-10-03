'use client';

import gsap from 'gsap';

// Helper to check if user prefers reduced motion (use subtle easing if true, but don't disable completely)
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animate Header & Navbar components smoothly on mount
 */
export function animateNavbar(headerElement: HTMLElement | null) {
  if (!headerElement || typeof window === 'undefined') return;

  const reduced = prefersReducedMotion();
  const dur = reduced ? 0.3 : 0.6;
  const dist = reduced ? 6 : 14;

  const ctx = gsap.context(() => {
    // 1. Navbar container soft slide down & fade
    const bar = headerElement.querySelector('div.max-w-7xl');
    if (bar) {
      gsap.fromTo(
        bar,
        { y: -dist, opacity: 0 },
        { y: 0, opacity: 1, duration: dur, ease: 'power2.out' }
      );
    }

    // 2. Logo mark & brand image animation
    const logo = headerElement.querySelector('[data-gsap="nav-logo"], .nav-logo');
    if (logo) {
      gsap.fromTo(
        logo,
        { y: -dist * 0.7, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: dur, ease: 'power2.out', delay: 0.05 }
      );
    }

    // 3. Navigation links (staggered cascade from top)
    const navLinks = headerElement.querySelectorAll('[data-gsap="nav-link"], nav a');
    if (navLinks.length > 0) {
      gsap.fromTo(
        navLinks,
        { y: -dist * 0.6, opacity: 0 },
        { y: 0, opacity: 1, duration: dur * 0.85, stagger: 0.05, ease: 'power2.out', delay: 0.1 }
      );
    }

    // 4. Action buttons (cart, profile, login, mobile toggle)
    const actions = headerElement.querySelectorAll('[data-gsap="nav-action"], header button');
    if (actions.length > 0) {
      gsap.fromTo(
        actions,
        { scale: 0.92, opacity: 0 },
        { scale: 1, opacity: 1, duration: dur * 0.85, stagger: 0.05, ease: 'back.out(1.2)', delay: 0.15 }
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

  const reduced = prefersReducedMotion();
  const dur = reduced ? 0.35 : 0.65;
  const dist = reduced ? 8 : 20;

  const ctx = gsap.context(() => {
    // 1. Main Headings (h1, page titles)
    const headings = container.querySelectorAll('h1, [data-gsap="page-title"]');
    if (headings.length > 0) {
      gsap.fromTo(
        headings,
        { y: dist, opacity: 0 },
        { y: 0, opacity: 1, duration: dur, ease: 'power3.out', stagger: 0.08 }
      );
    }

    // 2. Subtitles & Lead descriptions
    const subheads = container.querySelectorAll(
      '[data-gsap="page-sub"], p[data-gsap="lead"], .hero-lead'
    );
    if (subheads.length > 0) {
      gsap.fromTo(
        subheads,
        { y: dist * 0.7, opacity: 0 },
        { y: 0, opacity: 1, duration: dur * 0.9, ease: 'power2.out', delay: 0.1, stagger: 0.05 }
      );
    }

    // 3. Hero media, graphics, and images
    const media = container.querySelectorAll(
      '[data-gsap="hero-media"], [data-gsap="media"]'
    );
    if (media.length > 0) {
      gsap.fromTo(
        media,
        { scale: 0.94, opacity: 0 },
        { scale: 1, opacity: 1, duration: dur, ease: 'power2.out', delay: 0.08 }
      );
    }

    // 4. Initial above-the-fold cards / benefit badges
    const initialCards = container.querySelectorAll(
      '[data-gsap="hero-card"], [data-gsap="benefit-card"]'
    );
    if (initialCards.length > 0) {
      gsap.fromTo(
        initialCards,
        { y: dist * 0.8, opacity: 0 },
        { y: 0, opacity: 1, duration: dur * 0.85, stagger: 0.06, ease: 'power2.out', delay: 0.18 }
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

  const observed = new WeakSet<Element>();

  const reveal = (target: HTMLElement, immediate = false) => {
    // Section heading + its sibling description only (never pick text inside cards)
    const header = target.querySelector<HTMLElement>('h2, [data-gsap="section-title"]');
    const desc = header?.parentElement?.querySelector<HTMLElement>('p') ?? null;

    const cardNodes = target.querySelectorAll<HTMLElement>('[data-gsap="card"], .grid > div');
    const cards = Array.from(cardNodes).filter((el) => !el.closest('.carousel-viewport'));

    const tl = gsap.timeline({ defaults: { ease: 'power2.out', overwrite: 'auto' } });
    const dur = immediate ? 0.45 : 0.55;

    if (header) {
      tl.fromTo(header, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: dur });
    }
    if (desc) {
      tl.fromTo(desc, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: dur * 0.9 }, '<0.08');
    }

    if (cards.length > 0) {
      tl.fromTo(
        cards,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: dur * 0.85,
          stagger: { each: 0.04, amount: Math.min(cards.length, 12) * 0.04 },
          clearProps: 'transform',
        },
        header || desc ? '<0.1' : 0
      );
    } else if (!header && !desc) {
      tl.fromTo(target, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: dur, clearProps: 'transform' });
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
    { rootMargin: '0px 0px 60px 0px', threshold: 0.01 }
  );

  const scan = () => {
    root.querySelectorAll<HTMLElement>('[data-gsap-reveal]').forEach((el) => {
      if (observed.has(el) || el.closest('.carousel-track')) return;
      observed.add(el);

      // Check if already in initial viewport on mount
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        io.unobserve(el);
        // Small delay to let entrance finish
        setTimeout(() => reveal(el, true), 120);
      } else {
        io.observe(el);
      }
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

/**
 * Attach tactile GSAP hover interactions to interactive cards
 */
export function attachCardHoverEffect(cardElement: HTMLElement | null) {
  if (!cardElement || typeof window === 'undefined') return;

  const onEnter = () => {
    gsap.to(cardElement, { y: -3, duration: 0.22, ease: 'power1.out', overwrite: 'auto' });
  };
  const onLeave = () => {
    gsap.to(cardElement, { y: 0, duration: 0.28, ease: 'power1.out', overwrite: 'auto' });
  };

  cardElement.addEventListener('mouseenter', onEnter);
  cardElement.addEventListener('mouseleave', onLeave);

  return () => {
    cardElement.removeEventListener('mouseenter', onEnter);
    cardElement.removeEventListener('mouseleave', onLeave);
  };
}
