import { useRef } from 'react';
import { AudioLines, History, MoonStar } from 'lucide-react';
import { gsap, useGSAP, SplitText } from '../../../../shared/animations/gsap.js';
import { motion, prefersReducedMotion } from '../../../../shared/animations/motion.js';
import { splitReveal } from '../../../../shared/animations/splitReveal.js';
import { Wordmark } from '../../../../shared/ui/Wordmark.jsx';
import { LogoMark } from '../../../../shared/ui/Logo.jsx';

/** What each page says, and the little conversations it plays on a loop. */
const COPY = {
  login: {
    label: 'Welcome back',
    title: <>Good to see you <em className="accent">again</em>.</>,
    lede: 'Your conversations are right where you left them.',
    examples: [
      { q: 'Where did we leave the Goa trip?', a: 'Day two: the quiet beaches up north, then dinner in Panjim. Shall we plan day three?' },
      { q: 'Explain recursion simply', a: 'A function that solves a big problem by calling itself on a smaller piece, until the piece is tiny.' },
      { q: 'Make my birthday note warmer', a: 'Happy birthday! Thank you for every long call and every terrible joke. This year is yours.' },
    ],
  },
  register: {
    label: 'Nice to meet you',
    title: <>Say hello to <em className="accent">Milo</em>.</>,
    lede: 'A calm, warm place for every question you have.',
    examples: [
      { q: 'Hi Milo! What can you do?', a: 'Explain, write, plan, debug, brainstorm. Ask me anything and I’ll answer word by word.' },
      { q: 'Plan a calm Sunday morning', a: 'Slow coffee by the window, a short walk with no podcast, then ten pages of a paper book.' },
      { q: 'Why is my useEffect looping?', a: 'It probably sets state that’s also in its dependency list. Let’s look at the array together.' },
    ],
  },
};

// Example asks drifting around the card. Positions are % of the stage; depth sets parallax strength.
// They sit on the card's corners, layered in front of it.
const CHIPS = [
  { text: 'Explain black holes simply', style: { left: '0%', top: '0%' }, depth: 1.2 },
  { text: 'Fix my useEffect loop', style: { right: '0%', top: '9%' }, depth: 0.7 },
  { text: 'Ideas for dinner tonight', style: { right: '2%', bottom: '2%' }, depth: 1.4 },
  { text: 'Write a thank-you note', style: { left: '3%', bottom: '10%' }, depth: 0.9 },
];

const FACTS = [
  { icon: AudioLines, text: 'Streams word by word' },
  { icon: History, text: 'Remembers every chat' },
  { icon: MoonStar, text: 'Light and dark' },
];

/**
 * The left half of the login / register pages: a warm panel with a living
 * demo. Purely decorative (aria-hidden) apart from the headline.
 * @param {{ variant: 'login' | 'register' }} props
 */
export function AuthShowcase({ variant }) {
  const copy = COPY[variant];
  const scope = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return undefined;
    const ease = motion.ease.reveal;
    const root = scope.current;

    // Entrance.
    gsap.from('[data-auth="top"] > *', { autoAlpha: 0, y: -14, duration: 1, ease, stagger: 0.1, delay: 0.1 });
    gsap.from('[data-auth="label"]', { autoAlpha: 0, y: 14, duration: 1, ease, delay: 0.25 });
    splitReveal('[data-auth="title"]', { delay: 0.35, stagger: 0.07 });
    gsap.from('[data-auth="lede"]', { autoAlpha: 0, y: 18, duration: 1.1, ease, delay: 0.8 });
    gsap.from('[data-auth="card"]', {
      autoAlpha: 0, y: 70, scale: 0.94, rotateX: 14, transformPerspective: 1200, duration: 1.6, ease, delay: 0.7,
    });
    gsap.from('[data-auth="chip"]', { autoAlpha: 0, scale: 0.6, duration: 1.2, ease: 'back.out(1.8)', stagger: 0.09, delay: 1.1 });
    gsap.from('[data-auth="fact"]', { autoAlpha: 0, y: 14, duration: 1, ease, stagger: 0.1, delay: 1.2 });

    // Chips drift on their own, each at its own pace ("fidgeting").
    gsap.utils.toArray('[data-auth="chip"]', root).forEach((chip) => {
      gsap.to(chip, {
        x: gsap.utils.random(-16, 16),
        y: gsap.utils.random(-20, 20),
        rotate: gsap.utils.random(-4, 4),
        duration: gsap.utils.random(3.2, 5.2),
        ease: motion.ease.float,
        repeat: -1,
        yoyo: true,
        delay: gsap.utils.random(0, 1.5),
      });
    });

    // Pointer: chips shift by depth, the card tilts toward the cursor.
    const layers = gsap.utils.toArray('[data-auth="depth"]', root).map((layer) => ({
      depth: Number(layer.dataset.depth),
      x: gsap.quickTo(layer, 'x', { duration: 1.2, ease: 'power3.out' }),
      y: gsap.quickTo(layer, 'y', { duration: 1.2, ease: 'power3.out' }),
    }));
    const tilt = root.querySelector('[data-auth="tilt"]');
    gsap.set(tilt, { transformPerspective: 1000 });
    const tiltX = gsap.quickTo(tilt, 'rotateX', { duration: 1, ease: 'power3.out' });
    const tiltY = gsap.quickTo(tilt, 'rotateY', { duration: 1, ease: 'power3.out' });
    const onMove = (event) => {
      const box = root.getBoundingClientRect();
      const px = (event.clientX - box.left) / box.width - 0.5;
      const py = (event.clientY - box.top) / box.height - 0.5;
      layers.forEach((layer) => { layer.x(px * 36 * layer.depth); layer.y(py * 28 * layer.depth); });
      tiltY(px * 9);
      tiltX(py * -7);
    };
    const onLeave = () => { layers.forEach((l) => { l.x(0); l.y(0); }); tiltX(0); tiltY(0); };
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);

    // The conversation loop: type the question, think, stream the answer, fade, next.
    const examples = gsap.utils.toArray('[data-auth="example"]', root);
    gsap.set(examples, { autoAlpha: 0 });
    const loop = gsap.timeline({ repeat: -1, delay: 1.6 });
    examples.forEach((example) => {
      const question = new SplitText(example.querySelector('[data-auth="q"]'), { type: 'chars' });
      const answer = new SplitText(example.querySelector('[data-auth="a"]'), { type: 'words' });
      const dots = example.querySelectorAll('[data-auth="dot"]');
      const bubble = example.querySelector('[data-auth="bubble"]');
      loop
        .set(example, { autoAlpha: 1, y: 0 })
        .set([question.chars, answer.words, dots], { autoAlpha: 0 })
        .from(bubble, { scale: 0.92, autoAlpha: 0, transformOrigin: '100% 100%', duration: 0.5, ease: 'back.out(1.6)' })
        .to(question.chars, { autoAlpha: 1, duration: 0.01, stagger: 0.035 }, '<0.1')
        .to(dots, { autoAlpha: 1, duration: 0.2, stagger: 0.12 }, '+=0.25')
        .to(dots, { y: -4, duration: 0.3, stagger: 0.1, yoyo: true, repeat: 3, ease: 'sine.inOut' }, '<')
        .to(dots, { autoAlpha: 0, duration: 0.2 })
        .to(answer.words, { autoAlpha: 1, duration: 0.25, stagger: 0.06, ease: 'none' })
        .to(example, { autoAlpha: 0, y: -18, duration: 0.6, ease: motion.ease.in }, '+=2.6');
    });

    return () => {
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, { scope });

  return (
    <section ref={scope} className="grain relative isolate flex h-full flex-col overflow-hidden rounded-[32px] border border-line bg-raised px-10 pt-8 pb-10 xl:px-12">
      <div className="pointer-events-none absolute -top-64 left-1/2 -z-10 -translate-x-1/2" aria-hidden="true">
        <div className="sun-glow size-[880px]" />
      </div>

      <div data-auth="top" className="flex items-center justify-between">
        <Wordmark animate />
        <p className="label hidden xl:block">A warm place to think</p>
      </div>

      <div className="mt-[clamp(1.5rem,5vh,4rem)] max-w-xl">
        <p data-auth="label" className="label">{copy.label}</p>
        <p data-auth="title" className="mt-4 font-serif text-[clamp(2.6rem,4vw,3.9rem)] leading-[1.06] font-light tracking-[-0.03em]">
          {copy.title}
        </p>
        <p data-auth="lede" className="mt-4 text-[17px] leading-relaxed text-muted">{copy.lede}</p>
      </div>

      <div className="relative my-6 flex min-h-[240px] flex-1 items-center justify-center" aria-hidden="true">
        {CHIPS.map((chip) => (
          <div key={chip.text} data-auth="depth" data-depth={chip.depth} className="absolute z-10 hidden xl:block" style={chip.style}>
            <span data-auth="chip" className="block rounded-full border border-line bg-surface/80 px-4 py-2 text-[13px] whitespace-nowrap text-muted shadow-[var(--shadow-soft)] backdrop-blur-sm">
              {chip.text}
            </span>
          </div>
        ))}

        <div data-auth="card" className="relative w-full max-w-[380px]">
          <div data-auth="tilt" className="rounded-[24px] border border-line bg-surface shadow-[var(--shadow-lift)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <span className="label flex items-center gap-2">
                <span className="size-1.5 animate-pulse rounded-full bg-honey" /> Milo
              </span>
              <span className="label">GPT-OSS 120B</span>
            </div>
            <div className="relative h-[176px] px-5 py-5">
              {copy.examples.map((example, index) => (
                <div key={example.q} data-auth="example" className={`absolute inset-x-5 top-5 space-y-4 ${index ? 'invisible opacity-0' : ''}`}>
                  <p data-auth="bubble" className="ml-auto w-fit max-w-[88%] rounded-[18px] rounded-br-md bubble-sun px-4 py-2.5 text-[14px]">
                    <span data-auth="q">{example.q}</span>
                  </p>
                  <div className="flex gap-3">
                    <LogoMark className="mt-1 size-4" />
                    <div className="relative flex-1">
                      <span className="absolute top-1.5 left-0 flex gap-1">
                        {[0, 1, 2].map((dot) => <span key={dot} data-auth="dot" className="invisible size-1.5 rounded-full bg-faint" />)}
                      </span>
                      <p data-auth="a" className="font-serif text-[15.5px] leading-[1.6] text-ink">{example.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ul className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-6" aria-label="What Milo does">
        {FACTS.map(({ icon, text }) => {
          const Icon = icon;
          return (
            <li key={text} data-auth="fact" className="flex items-center gap-2 text-[13px] text-muted">
              <Icon className="size-[15px] text-honey" strokeWidth={1.7} aria-hidden="true" /> {text}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
