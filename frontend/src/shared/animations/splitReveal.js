import { gsap, SplitText } from './gsap.js';
import { motion } from './motion.js';

/**
 * Editorial headline entrance: the text is split into lines and words, each
 * line gets an invisible "mask", and the words rise up from behind it.
 *
 * Call it INSIDE a useGSAP callback (after checking prefersReducedMotion),
 * so GSAP cleans the split and the tween up when the component unmounts.
 * Screen readers still read the whole sentence (SplitText adds aria-label).
 *
 * @param {Element | string} target The heading (or a selector inside the useGSAP scope).
 * @param {object} [options]
 * @param {number} [options.delay] Seconds before starting.
 * @param {number} [options.stagger] Seconds between words.
 * @param {ScrollTrigger.Vars} [options.scrollTrigger] Start when scrolled into view instead of at once.
 * @returns {SplitText}
 */
export function splitReveal(target, { delay = 0, stagger = 0.055, scrollTrigger } = {}) {
  return SplitText.create(target, {
    type: 'lines,words',
    mask: 'lines',
    autoSplit: true, // re-split if fonts load late or the width changes
    onSplit: (self) => {
      const tl = gsap.timeline({ delay, scrollTrigger });
      tl.from(self.words, { yPercent: 118, rotate: 2, duration: 1.25, ease: motion.ease.reveal, stagger }, 0);
      // Accent words (`.accent`) get their saffron marker drawn in, left to right, as the words land.
      const marks = self.elements.flatMap((element) => [...element.querySelectorAll('.accent')]);
      if (marks.length) tl.add(drawAccent(marks), '>-0.55');
      return tl;
    },
  });
}

/**
 * Draws the saffron marker under `.accent` words from left to right.
 * @param {Element | Element[] | string} targets
 * @param {gsap.TweenVars} [vars] Extra tween vars (delay, scrollTrigger...).
 * @returns {gsap.core.Tween}
 */
export function drawAccent(targets, vars = {}) {
  return gsap.from(targets, { backgroundSize: '0% 0.085em', duration: 1.1, ease: 'power3.inOut', ...vars });
}
