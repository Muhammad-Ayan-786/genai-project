import { useRef } from 'react';
import { AudioLines, BookOpen, History } from 'lucide-react';
import { gsap, useGSAP } from '../../../../shared/animations/gsap.js';
import { motion, prefersReducedMotion } from '../../../../shared/animations/motion.js';
import { splitReveal } from '../../../../shared/animations/splitReveal.js';

// Only things Milo really does today.
const FEATURES = [
  {
    icon: AudioLines,
    title: 'Answers that arrive as they’re written',
    body: 'Milo streams every reply word by word. Changed your mind? Stop it mid-sentence and ask again.',
  },
  {
    icon: History,
    title: 'Every conversation, remembered',
    body: 'Your chats wait in the sidebar, grouped by today, yesterday and the days before, so any thread is easy to pick up.',
  },
  {
    icon: BookOpen,
    title: 'Made for reading',
    body: 'Answers are set in a calm serif, with tidy lists, tables and code blocks you can copy in one click.',
  },
];

export function FeatureList() {
  const scope = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const ease = motion.ease.reveal;
    const head = { trigger: '[data-features="head"]', start: 'top 85%', once: true };
    gsap.from('[data-features="label"]', { autoAlpha: 0, y: 14, duration: 1, ease, scrollTrigger: head });
    splitReveal('[data-features="title"]', { delay: 0.1, scrollTrigger: head });

    const list = { trigger: '[data-features="list"]', start: 'top 82%', once: true };
    gsap.from('[data-features="list"]', { autoAlpha: 0, y: 40, duration: 1.4, ease, scrollTrigger: list });
    gsap.from('[data-features="item"]', { autoAlpha: 0, y: 50, duration: 1.3, ease, stagger: 0.13, delay: 0.15, scrollTrigger: list });
    gsap.from('[data-features="icon"]', {
      scale: 0.3, rotate: -45, autoAlpha: 0, duration: 1, ease: 'back.out(2.2)', stagger: 0.13, delay: 0.45, scrollTrigger: list,
    });
  }, { scope });

  return (
    <section ref={scope} id="features" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-28 sm:px-8 sm:py-36" aria-labelledby="features-title">
      <div data-features="head" className="max-w-2xl">
        <p data-features="label" className="label">How Milo feels</p>
        <h2 id="features-title" data-features="title" className="mt-5 font-serif text-[clamp(2.4rem,5vw,3.75rem)] leading-[1.06] font-light tracking-[-0.025em] text-balance">
          Quiet tools, carefully made.
        </h2>
      </div>

      <ol data-features="list" className="mt-16 grid gap-4 md:grid-cols-3">
        {FEATURES.map(({ icon, title, body }, index) => {
          const Icon = icon;
          return (
            <li
              key={title}
              data-features="item"
              onPointerMove={(event) => {
                const box = event.currentTarget.getBoundingClientRect();
                event.currentTarget.style.setProperty('--spot-x', `${event.clientX - box.left}px`);
                event.currentTarget.style.setProperty('--spot-y', `${event.clientY - box.top}px`);
              }}
              className="spotlight relative flex flex-col rounded-[26px] border border-line bg-surface/50 p-8 sm:p-10"
            >
              <div className="flex items-center justify-between">
                <span data-features="icon" className="btn-sun inline-flex size-11 items-center justify-center rounded-full text-on-primary">
                  <Icon className="size-[18px]" strokeWidth={1.6} aria-hidden="true" />
                </span>
                <span className="label">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-10 font-serif text-[26px] leading-[1.15] font-normal tracking-[-0.015em] text-balance">{title}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">{body}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
