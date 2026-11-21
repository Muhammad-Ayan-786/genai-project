import { useRef } from 'react';
import { gsap, useGSAP } from './gsap.js';
import { motion, prefersReducedMotion } from './motion.js';

/**
 * A slow, endless up-and-down drift for decorative elements.
 * Keep it for artwork only, never for text people need to read.
 *
 * @param {object} [options]
 * @param {number} [options.distance] Px to drift.
 * @param {number} [options.duration] Seconds for one direction.
 * @param {number} [options.delay] Seconds before starting.
 * @returns {import('react').RefObject<HTMLElement>} Ref to attach to the element.
 */
export function useFloat({ distance = 6, duration = 3.2, delay = 0 } = {}) {
  const target = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.to(target.current, {
      y: -distance, duration, delay, ease: motion.ease.float, repeat: -1, yoyo: true,
    });
  });

  return target;
}
