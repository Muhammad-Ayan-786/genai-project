import { useRef } from 'react';
import { gsap, useGSAP, SplitText } from '../../../../shared/animations/gsap.js';
import { prefersReducedMotion } from '../../../../shared/animations/motion.js';

/**
 * One big sentence that "lights up" word by word as you scroll into it,
 * like someone reading it to you. It is fully lit by the time the whole
 * paragraph is on screen (its bottom reaches ~80% of the viewport).
 */
export function Statement() {
  const scope = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const split = SplitText.create('[data-statement]', { type: 'words', autoSplit: true });
    gsap.fromTo(split.words, { opacity: 0.16 }, {
      opacity: 1,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: { trigger: '[data-statement]', start: 'top 88%', end: 'bottom 80%', scrub: 0.5 },
    });
  }, { scope });

  return (
    <section ref={scope} id="why" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-28 sm:px-8 sm:py-36">
      <p className="label mb-8">Why Milo</p>
      <p data-statement className="font-serif text-[clamp(2rem,4.4vw,3.6rem)] leading-[1.18] font-light tracking-[-0.02em] text-balance">
        Milo is a calm place to ask the questions you&apos;d ask a patient friend. It answers word by word,
        lets you stop it mid-thought, and keeps every conversation right where you left it.
      </p>
    </section>
  );
}
