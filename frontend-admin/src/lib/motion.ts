/**
 * Centralized Motion Tokens & Utilities — AsterraStore
 * Provides unified timing, easing curves, staggers, and helper functions
 * for both Admin Console and Sales Portal data visualization and UI motion.
 */

export const MOTION_DURATION = {
  fast: 150,     // Tooltip, hover glow, micro-feedback
  press: 120,    // Button active scale press feedback
  modal: 250,    // Dialog & drawer transitions
  slidingPill: 300, // Segmented tabs indicator transition
  accordion: 320,  // Grid accordion expansion
  base: 350,     // Tab glide, crossfades, content swap
  kpiReveal: 500, // Staggered reveal for metric cards
  chart: 650,    // Bar chart height interpolation & period FLIP
  cardSheen: 700, // Border sheen sweep effect
  flash: 700,    // Delta highlight pulse (green/red)
  counter: 750,  // Numeric count-up transitions (smooth & tactile)
  sparklineDraw: 900, // SVG sparkline stroke drawing
  copyFeedback: 1600, // Duration of 'Tersalin!' state before revert
  // Aliases for component backwards compatibility
  micro: 150,
  panel: 320,
  card: 500,
} as const;

export const MOTION_EASING = {
  // Monetira / Apple style smooth exponential deceleration
  editorial: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  springPop: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  springSubtle: 'cubic-bezier(0.25, 1.4, 0.5, 1)',
  linear: 'linear',
  standard: 'cubic-bezier(0.16, 1, 0.3, 1)',
  modalSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  modalExit: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export const MOTION_STAGGER = {
  chartBar: 30, // 30ms per bar from left to right
  tableRow: 30, // 30ms per table row (capped at 8 items)
  catalogCard: 40, // 40ms per catalog product card (capped at 8 items)
  faqItem: 50, // 50ms per FAQ/copywriting item
  metricCard: 80, // 80ms between executive KPI cards
} as const;

/**
 * Checks if reduced motion is requested via user preference or OS setting.
 */
export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem('asterra_reduce_motion');
    if (stored === 'true') return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Pre-composed CSS transition strings for GPU-accelerated styling
 */
export const MOTION_CSS = {
  chartBar: `height ${MOTION_DURATION.chart}ms ${MOTION_EASING.editorial}, opacity 300ms ease, background-color 150ms ease`,
  tooltip: `transform ${MOTION_DURATION.fast}ms ${MOTION_EASING.editorial}, opacity ${MOTION_DURATION.fast}ms ease`,
  badge: `background-color 250ms ease, border-color 250ms ease, color 250ms ease, transform 200ms ${MOTION_EASING.springPop}`,
  crossfade: `opacity ${MOTION_DURATION.base}ms ${MOTION_EASING.editorial}, transform ${MOTION_DURATION.base}ms ${MOTION_EASING.editorial}`,
  pulseDelta: `background-color ${MOTION_DURATION.flash}ms ease, border-color ${MOTION_DURATION.flash}ms ease`,
  slidingPill: `transform ${MOTION_DURATION.slidingPill}ms ${MOTION_EASING.editorial}, width ${MOTION_DURATION.slidingPill}ms ${MOTION_EASING.editorial}`,
  cardLift: `transform 300ms ${MOTION_EASING.editorial}, box-shadow 300ms ${MOTION_EASING.editorial}, border-color 250ms ease`,
  copyButton: `transform ${MOTION_DURATION.press}ms ${MOTION_EASING.editorial}, background-color 200ms ease, border-color 200ms ease, color 200ms ease`,
  tabGlide: `transform ${MOTION_DURATION.base}ms ${MOTION_EASING.editorial}, opacity ${MOTION_DURATION.base}ms ${MOTION_EASING.editorial}`,
  accordion: `grid-template-rows ${MOTION_DURATION.accordion}ms ${MOTION_EASING.editorial}`,
  modalBackdrop: `opacity ${MOTION_DURATION.modal}ms ${MOTION_EASING.editorial}, backdrop-filter ${MOTION_DURATION.modal}ms ${MOTION_EASING.editorial}`,
  modalContainer: `transform ${MOTION_DURATION.modal}ms ${MOTION_EASING.modalSpring}, opacity ${MOTION_DURATION.modal}ms ${MOTION_EASING.editorial}`,
} as const;
