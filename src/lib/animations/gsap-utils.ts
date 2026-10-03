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

  const reduced = prefersReducedMotion();
  const dur = reduced ? 0.25 : 0.45;
  const dist = reduced ? 4 : 10;

  const ctx = gsap.context(() => {
    const bar = headerElement.querySelector('div.max-w-7xl');
    if (bar) {
      gsap.fromTo(
        bar,
        { y: -dist, opacity: 0 },
        { y: 0, opacity: 1, duration: dur, ease: 'power2.out', force3D: true, clearProps: 'all' }
      );
    }

    const logo = headerElement.querySelector('[data-gsap="nav-logo"], .nav-logo');
    if (logo) {
      gsap.fromTo(
        logo,
        { y: -dist * 0.5, opacity: 0 },
        { y: 0, opacity: 1, duration: dur, ease: 'power2.out', delay: 0.04, force3D: true, clearProps: 'all' }
      );
    }

    const navLinks = headerElement.querySelectorAll('[data-gsap="nav-link"], nav a');
    if (navLinks.length > 0) {
      gsap.fromTo(
        navLinks,
        { y: -dist * 0.5, opacity: 0 },
        { y: 0, opacity: 1, duration: dur * 0.8, stagger: 0.03, ease: 'power2.out', delay: 0.06, force3D: true, clearProps: 'all' }
      );
    }

    const actions = headerElement.querySelectorAll('[data-gsap="nav-action"], header button');
    if (actions.length > 0) {
      gsap.fromTo(
        actions,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: dur * 0.8, stagger: 0.03, ease: 'power2.out', delay: 0.08, force3D: true, clearProps: 'all' }
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
  const dur = reduced ? 0.2 : 0.38;
  const dist = reduced ? 3 : 8;

  const ctx = gsap.context(() => {
    // 1. Main Headings (h1, page titles)
    const headings = container.querySelectorAll('h1, [data-gsap="page-title"]');
    if (headings.length > 0) {
      gsap.fromTo(
        headings,
        { y: dist, opacity: 0 },
        { y: 0, opacity: 1, duration: dur, ease: 'power2.out', stagger: 0.04, force3D: true, clearProps: 'transform,opacity' }
      );
    }

    // 2. Subtitles & Lead descriptions
    const subheads = container.querySelectorAll(
      '[data-gsap="page-sub"], p[data-gsap="lead"], .hero-lead'
    );
    if (subheads.length > 0) {
      gsap.fromTo(
        subheads,
        { y: dist * 0.5, opacity: 0 },
        { y: 0, opacity: 1, duration: dur * 0.9, ease: 'power2.out', delay: 0.04, stagger: 0.03, force3D: true, clearProps: 'transform,opacity' }
      );
    }

    // 3. Hero media, graphics, and images (smooth subtle entrance, no raster recomputation)
    const media = container.querySelectorAll(
      '[data-gsap="hero-media"], [data-gsap="media"]'
    );
    if (media.length > 0) {
      gsap.fromTo(
        media,
        { y: dist * 0.5, opacity: 0 },
        { y: 0, opacity: 1, duration: dur, ease: 'power2.out', delay: 0.04, force3D: true, clearProps: 'transform,opacity' }
      );
    }

    // 4. Initial above-the-fold cards / benefit badges
    const initialCards = container.querySelectorAll(
      '[data-gsap="hero-card"], [data-gsap="benefit-card"]'
    );
    if (initialCards.length > 0) {
      gsap.fromTo(
        initialCards,
        { y: dist * 0.5, opacity: 0 },
        { y: 0, opacity: 1, duration: dur * 0.85, stagger: 0.03, ease: 'power2.out', delay: 0.06, force3D: true, clearProps: 'transform,opacity' }
      );
    }
  }, container);

  return () => ctx.revert();
}

/**
 * Set up smooth, lightweight scroll reveals for sections, headings, and card grids.
 * Uses positive bottom rootMargin so items start revealing smoothly before entering view.
 */
export function setupScrollReveal(root: HTMLElement | null) {
  if (!root || typeof window === 'undefined') return;

  const revealedElements = new WeakSet<Element>();

  const reveal = (target: HTMLElement) => {
    if (revealedElements.has(target)) return;
    revealedElements.add(target);

    // Target cards or elements inside section
    const cards = Array.from(
      target.querySelectorAll<HTMLElement>('[data-gsap="card"], .card')
    ).filter((el) => !el.closest('.carousel-track') && !el.closest('.carousel-viewport'));

    const tl = gsap.timeline({ defaults: { ease: 'power2.out', overwrite: 'auto', force3D: true } });

    if (cards.length > 0) {
      tl.fromTo(
        cards,
        { y: 8, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.35,
          stagger: 0.03,
          clearProps: 'transform,opacity',
        }
      );
    } else {
      tl.fromTo(
        target,
        { y: 8, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.35,
          clearProps: 'transform,opacity',
        }
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
    { rootMargin: '60px 0px 20px 0px', threshold: 0.01 }
  );

  const scan = () => {
    // Only target explicit sections that are below the initial fold
    const targets = root.querySelectorAll<HTMLElement>('[data-gsap-reveal], section[id]');

    targets.forEach((el) => {
      if (
        revealedElements.has(el) ||
        el.closest('.carousel-track') ||
        el.closest('.carousel-viewport')
      )
        return;

      const rect = el.getBoundingClientRect();
      // If already in viewport on load, mark it without re-triggering a competing animation
      if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) {
        revealedElements.add(el);
      } else {
        io.observe(el);
      }
    });
  };

  scan();

  // Debounced observer for dynamically loaded elements
  let debounceTimer: NodeJS.Timeout;
  const mo = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(scan, 200);
  });
  mo.observe(root, { childList: true, subtree: true });

  return () => {
    io.disconnect();
    mo.disconnect();
    clearTimeout(debounceTimer);
  };
}

/**
 * Attach tactile GSAP hover interactions to interactive cards
 */
export function attachCardHoverEffect(cardElement: HTMLElement | null) {
  if (!cardElement || typeof window === 'undefined') return;

  const onEnter = () => {
    gsap.to(cardElement, { y: -3, duration: 0.18, ease: 'power1.out', overwrite: 'auto', force3D: true });
  };
  const onLeave = () => {
    gsap.to(cardElement, { y: 0, duration: 0.22, ease: 'power1.out', overwrite: 'auto', force3D: true });
  };

  cardElement.addEventListener('mouseenter', onEnter);
  cardElement.addEventListener('mouseleave', onLeave);

  return () => {
    cardElement.removeEventListener('mouseenter', onEnter);
    cardElement.removeEventListener('mouseleave', onLeave);
  };
}
