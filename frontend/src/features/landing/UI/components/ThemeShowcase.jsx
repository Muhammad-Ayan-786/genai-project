import { useRef } from 'react';
import { Check } from 'lucide-react';
import { gsap, useGSAP } from '../../../../shared/animations/gsap.js';
import { motion, prefersReducedMotion } from '../../../../shared/animations/motion.js';
import { splitReveal } from '../../../../shared/animations/splitReveal.js';
import { useTheme } from '../../../../shared/theme/useTheme.js';

/**
 * A tiny drawing of the chat screen. `scheme` forces its colors: because all
 * tokens use light-dark(), setting color-scheme on the wrapper is enough.
 */
function MiniChat({ scheme }) {
  return (
    <div className={`${scheme === 'dark' ? '[color-scheme:dark]' : '[color-scheme:light]'} flex h-52 overflow-hidden rounded-[18px] border border-line bg-canvas sm:h-60`} aria-hidden="true">
      <div className="flex w-[30%] flex-col gap-2 border-r border-line bg-raised p-3">
        <span className="mb-1 flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-honey" />
          <span className="h-1.5 w-8 rounded-full bg-ink/70" />
        </span>
        <span className="h-5 rounded-full bg-honey" />
        <span className="mt-2 h-1.5 w-10 rounded-full bg-faint/50" />
        <span className="h-4 rounded-md bg-surface" />
        <span className="h-1.5 w-4/5 rounded-full bg-muted/40" />
        <span className="h-1.5 w-3/5 rounded-full bg-muted/40" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <span className="bubble-sun ml-auto h-6 w-3/5 rounded-full" />
        <span className="mt-1 h-2 w-11/12 rounded-full bg-ink/60" />
        <span className="h-2 w-4/5 rounded-full bg-ink/40" />
        <span className="h-2 w-3/5 rounded-full bg-ink/40" />
        <span className="mt-auto h-8 rounded-full border border-line bg-surface" />
      </div>
    </div>
  );
}

const OPTIONS = [
  { value: 'light', name: 'Daylight', note: 'Warm ivory paper' },
  { value: 'dark', name: 'Candlelight', note: 'Soft roast and honey' },
];

/** "Morning or midnight": two live previews that also switch the theme. */
export function ThemeShowcase() {
  const scope = useRef(null);
  const { theme, setTheme } = useTheme();

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const ease = motion.ease.reveal;
    const panel = scope.current.querySelector('[data-show="panel"]');
    const enter = { trigger: panel, start: 'top 80%', once: true };
    gsap.from(panel, { autoAlpha: 0, y: 60, scale: 0.97, duration: 1.5, ease, scrollTrigger: enter });
    gsap.from('[data-show="label"], [data-show="lede"]', { autoAlpha: 0, y: 18, duration: 1.1, ease, stagger: 0.25, delay: 0.3, scrollTrigger: enter });
    splitReveal('[data-show="title"]', { delay: 0.35, scrollTrigger: enter });
    gsap.from('[data-show="card"]', {
      autoAlpha: 0, y: 90, rotate: (index) => (index ? 4 : -4), transformOrigin: '50% 100%',
      duration: 1.5, ease, stagger: 0.15, delay: 0.55, scrollTrigger: enter,
    });
    gsap.fromTo('[data-show="glow"]', { yPercent: -20 }, {
      yPercent: 25, ease: 'none', scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }, { scope });

  return (
    <section ref={scope} id="themes" className="scroll-mt-24 px-5 sm:px-8" aria-labelledby="theme-title">
      <div data-show="panel" className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] border border-line bg-raised px-6 py-20 sm:px-14 sm:py-24">
        <div data-show="glow" className="pointer-events-none absolute inset-x-0 -top-48 flex justify-center" aria-hidden="true">
          <div className="sun-glow size-160" />
        </div>

        <div className="relative mx-auto max-w-xl text-center">
          <p data-show="label" className="label">Two moods</p>
          <h2 id="theme-title" data-show="title" className="mt-5 font-serif text-[clamp(2.2rem,4.6vw,3.5rem)] leading-[1.08] font-light tracking-[-0.025em]">
            Morning or midnight.
          </h2>
          <p data-show="lede" className="mt-5 text-[16px] leading-relaxed text-muted">
            Milo comes in light and dark. Pick the one that suits the hour. Go on, try it.
          </p>
        </div>

        <div className="relative mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2" role="radiogroup" aria-label="Theme">
          {OPTIONS.map((option) => {
            const active = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                data-show="card"
                onClick={() => setTheme(option.value)}
                className={`group rounded-[24px] border p-3 text-left transition-[border-color,box-shadow] duration-300 ${
                  active ? 'border-honey shadow-[var(--shadow-soft)]' : 'border-line hover:border-line-strong'
                }`}
              >
                <MiniChat scheme={option.value} />
                <span className="flex items-center justify-between px-2 pt-4 pb-1">
                  <span>
                    <span className="block font-serif text-[20px]">{option.name}</span>
                    <span className="text-[13px] text-muted">{option.note}</span>
                  </span>
                  <span className={`inline-flex size-7 items-center justify-center rounded-full transition-colors ${active ? 'bg-honey text-on-honey' : 'border border-line-strong text-transparent'}`}>
                    <Check className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
