import { useRef } from 'react';
import { gsap, useGSAP } from './gsap.js';
import { motion, prefersReducedMotion } from './motion.js';

/**
 * Fade-and-rise entrance for a group of elements, one after another.
 *
 * Usage:
 *   const scope = useReveal();                       // animates [data-reveal] children
 *   const scope = useReveal({ targets: ':scope > *' }); // or any CSS selector
 *   return <section ref={scope}>...</section>;
 *
 * @param {object} [options]
 * @param {string} [options.targets] Selector, searched inside the scope element.
 * @param {number} [options.delay] Seconds to wait before starting.
 * @param {number} [options.y] Distance in px to rise from.
 * @returns {import('react').RefObject<HTMLElement>} Ref to attach to the container.
 */
export function useReveal({ targets = '[data-reveal]', delay = 0, y = motion.distance } = {}) {
  const scope = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const items = gsap.utils.toArray(scope.current.querySelectorAll(targets));
    if (!items.length) return;
    gsap.from(items, {
      autoAlpha: 0,
      y,
      delay,
      duration: motion.duration.slow,
      ease: motion.ease.out,
      stagger: motion.stagger,
      clearProps: 'opacity,visibility,transform', // leave no inline styles behind
    });
  }, { scope });

  return scope;
}
