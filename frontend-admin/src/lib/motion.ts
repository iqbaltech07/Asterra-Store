/**
 * Centralized Motion Tokens & Utilities — AsterraStore
 * Provides unified timing, easing curves, staggers, and helper functions
 * for both Admin Console and Sales Portal data visualization and UI motion.
 */

export const MOTION_DURATION = {
  micro: 150,    // Icon translate, button feedback, tooltip, badge pop
  fast: 150,     // Alias for micro
  base: 200,     // Tab switch, crossfade, backdrop blur
  modal: 220,    // Dialog container spring-in, drawer enter
  panel: 250,    // Sidebar accordion expand, sliding pill tab, drawer slide
  card: 250,     // Staggered stat card reveal
  chart: 350,    // Bar scaleY interpolation, period transitions
  counter: 750,  // Numeric count-up transitions (smooth & tactile)
  flash: 700,    // Delta highlight pulse (green/red)
} as const;

export const MOTION_EASING = {
  // Operational general transition curve (fluid, responsive, zero perceived lag)
  standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  // Apple / Editorial exponential deceleration curve
  editorial: 'cubic-bezier(0.16, 1, 0.3, 1)',
  // Snappy modal enter with subtle spring physics
  modalSpring: 'cubic-bezier(0.34, 1.25, 0.64, 1)',
  // Smooth modal exit
  modalExit: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  springPop: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  linear: 'linear',
} as const;

export const MOTION_STAGGER = {
  tableRow: 20,   // 20ms per row (capped at 10 rows max)
  chartBar: 30,   // 30ms per bar
  metricCard: 50, // 50ms between KPI stat cards
} as const;

/**
 * Checks if reduced motion is requested by OS or in-app setting.
 */
export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const userPref = localStorage.getItem('asterra_reduce_motion');
    if (userPref !== null) return userPref === 'true';
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Pre-composed CSS transition strings for GPU-accelerated styling
 */
export const MOTION_CSS = {
  tabGlide: `transform ${MOTION_DURATION.base}ms ${MOTION_EASING.standard}, opacity ${MOTION_DURATION.base}ms ${MOTION_EASING.standard}`,
  accordion: `grid-template-rows ${MOTION_DURATION.panel}ms ${MOTION_EASING.standard}`,
  pill: `transform ${MOTION_DURATION.panel}ms ${MOTION_EASING.standard}`,
  modalBackdrop: `opacity ${MOTION_DURATION.base}ms ${MOTION_EASING.standard}, backdrop-filter ${MOTION_DURATION.base}ms ${MOTION_EASING.standard}`,
  modalContainer: `transform ${MOTION_DURATION.modal}ms ${MOTION_EASING.modalSpring}, opacity ${MOTION_DURATION.modal}ms ${MOTION_EASING.standard}`,
  chartBar: `transform ${MOTION_DURATION.chart}ms ${MOTION_EASING.standard}, opacity 200ms ease, background-color 150ms ease`,
  tooltip: `transform ${MOTION_DURATION.micro}ms ${MOTION_EASING.standard}, opacity ${MOTION_DURATION.micro}ms ease`,
  badge: `background-color 200ms ease, border-color 200ms ease, color 200ms ease, transform ${MOTION_DURATION.micro}ms ${MOTION_EASING.springPop}`,
  crossfade: `opacity ${MOTION_DURATION.base}ms ${MOTION_EASING.standard}, transform ${MOTION_DURATION.base}ms ${MOTION_EASING.standard}`,
  pulseDelta: `background-color ${MOTION_DURATION.flash}ms ease, border-color ${MOTION_DURATION.flash}ms ease`,
} as const;

