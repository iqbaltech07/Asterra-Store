/**
 * Centralized Motion Tokens & Utilities — AsterraStore
 * Provides unified timing, easing curves, staggers, and helper functions
 * for both Admin Console and Sales Portal data visualization and UI motion.
 */

export const MOTION_DURATION = {
  fast: 150,     // Tooltip, hover glow, micro-feedback
  base: 350,     // Tab glide, crossfades, content swap
  counter: 750,  // Numeric count-up transitions (smooth & tactile)
  flash: 700,    // Delta highlight pulse (green/red)
  chart: 650,    // Bar chart height interpolation & period FLIP
  modal: 250,    // Dialog & drawer transitions
} as const;

export const MOTION_EASING = {
  // Monetira / Apple style smooth exponential deceleration
  editorial: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  springPop: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  linear: 'linear',
} as const;

export const MOTION_STAGGER = {
  chartBar: 30, // 30ms per bar from left to right
  tableRow: 40, // 40ms per table row (capped at 10 items)
  metricCard: 70, // 70ms between metric cards
} as const;

/**
 * Checks if reduced motion is explicitly toggled by user preference in app.
 * Defaults to false so rich dashboard motions always play smoothly.
 */
export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('asterra_reduce_motion') === 'true';
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
} as const;
