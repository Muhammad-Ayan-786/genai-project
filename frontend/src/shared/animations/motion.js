/**
 * Motion tokens: the animation equivalent of theme.css.
 * Tweak timing and easing here and every animation in the app follows.
 */
export const motion = Object.freeze({
  ease: {
    out: 'power3.out', // entrances: fast start, soft landing
    in: 'power2.in', // exits: gentle start, quick finish
    pop: 'back.out(1.6)', // small playful overshoot (toasts, badges)
    float: 'sine.inOut', // calm looping movement
  },
  duration: { fast: 0.25, base: 0.5, slow: 0.8 },
  stagger: 0.07, // delay between items in a list reveal
  distance: 16, // px an element travels when it fades in
});

/**
 * Respect the OS "reduce motion" setting. Environments without matchMedia
 * (e.g. jsdom in tests) are treated as reduced, so content is never hidden.
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
