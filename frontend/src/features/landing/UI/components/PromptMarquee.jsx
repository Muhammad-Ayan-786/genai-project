import { useRef } from 'react';
import { gsap, useGSAP } from '../../../../shared/animations/gsap.js';
import { prefersReducedMotion } from '../../../../shared/animations/motion.js';

// Real things people can ask Milo. Two rows that drift in opposite directions.
const ROWS = [
  ['Explain black holes like I’m ten', 'Plan a calm Sunday morning', 'Why is my useEffect looping?', 'Write a warm thank-you note', 'Compare SQL and MongoDB', 'Ideas for dinner with what’s in my fridge'],
  ['Summarise this in three lines', 'Help me study React in four weeks', 'Make this email sound kinder', 'What should I read next?', 'Explain JWT refresh tokens', 'Name my new houseplant'],
];

function Row({ items, direction }) {
  return (
    <div data-marquee-row data-direction={direction} className="flex w-max gap-3">
      {/* Two copies, so the loop is seamless when the first one scrolls away. */}
      {[0, 1].map((copy) => (
        <ul key={copy} aria-hidden={copy === 1 || undefined} className="flex gap-3">
          {items.map((text) => (
            <li key={text} className="flex items-center gap-2.5 rounded-full border border-line bg-surface/70 px-5 py-3 text-[15px] whitespace-nowrap text-muted transition-colors duration-300 hover:border-line-strong hover:text-ink">
              <span className="size-1.5 shrink-0 rounded-full bg-honey" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

/** "Ask it anything": two endless rows of example questions. Hovering slows them down. */
export function PromptMarquee() {
  const scope = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return undefined;
    const loops = gsap.utils.toArray('[data-marquee-row]', scope.current).map((row) => {
      const half = row.scrollWidth / 2;
      const left = row.dataset.direction === 'left';
      return gsap.fromTo(row, { x: left ? 0 : -half }, { x: left ? -half : 0, duration: half / 38, ease: 'none', repeat: -1 });
    });
    gsap.from(scope.current, {
      autoAlpha: 0, y: 30, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: scope.current, start: 'top 88%', once: true },
    });
    const slow = () => loops.forEach((loop) => gsap.to(loop, { timeScale: 0.25, duration: 0.6, overwrite: true }));
    const fast = () => loops.forEach((loop) => gsap.to(loop, { timeScale: 1, duration: 0.6, overwrite: true }));
    scope.current.addEventListener('pointerenter', slow);
    scope.current.addEventListener('pointerleave', fast);
    const element = scope.current;
    return () => {
      element.removeEventListener('pointerenter', slow);
      element.removeEventListener('pointerleave', fast);
    };
  }, { scope });

  return (
    <section ref={scope} aria-label="Things you can ask Milo" className="relative space-y-3 overflow-hidden py-6 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
      <Row items={ROWS[0]} direction="left" />
      <Row items={ROWS[1]} direction="right" />
    </section>
  );
}
