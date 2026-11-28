import { useRef } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { gsap, useGSAP } from '../../../../shared/animations/gsap.js';
import { motion, prefersReducedMotion } from '../../../../shared/animations/motion.js';
import { splitReveal } from '../../../../shared/animations/splitReveal.js';
import { useFloat } from '../../../../shared/animations/useFloat.js';
import { LogoMark } from '../../../../shared/ui/Logo.jsx';
import { LandingNav } from '../components/LandingNav.jsx';
import { ChatPreview } from '../components/ChatPreview.jsx';
import { FeatureList } from '../components/FeatureList.jsx';
import { ThemeShowcase } from '../components/ThemeShowcase.jsx';
import { PromptMarquee } from '../components/PromptMarquee.jsx';
import { Statement } from '../components/Statement.jsx';
import { LandingFooter } from '../components/LandingFooter.jsx';

function Hero() {
  const scope = useRef(null);
  const float = useFloat({ distance: 6, duration: 4.4, delay: 2.4 });

  useGSAP(() => {
    if (prefersReducedMotion()) return undefined;
    const ease = motion.ease.reveal;

    // 1. Entrance, in reading order.
    gsap.from('[data-hero="label"]', { autoAlpha: 0, y: 16, duration: 1, ease, delay: 0.35 });
    splitReveal('[data-hero="title"]', { delay: 0.35, stagger: 0.07 });
    gsap.from('[data-hero="lede"]', { autoAlpha: 0, y: 24, duration: 1.2, ease, delay: 0.95 });
    gsap.from('[data-hero="cta"] > *', { autoAlpha: 0, y: 20, duration: 1.1, ease, stagger: 0.1, delay: 1.1 });
    gsap.from('[data-hero="card"]', {
      autoAlpha: 0, y: 110, rotateX: 16, scale: 0.94, transformPerspective: 1400, transformOrigin: '50% 0%',
      duration: 1.8, ease, delay: 1.25,
    });

    // 2. Scroll: the glow sinks and the copy drifts up a little slower than the page.
    const scrub = { trigger: scope.current, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('[data-hero="sky"]', { yPercent: 30, scale: 1.2, ease: 'none', scrollTrigger: scrub });
    gsap.to('[data-hero="copy"]', { y: -90, autoAlpha: 0.15, ease: 'none', scrollTrigger: { ...scrub, end: '60% top' } });

    // 3. The sun leans gently toward the pointer.
    const sun = scope.current.querySelector('[data-hero="sun"]');
    const toX = gsap.quickTo(sun, 'x', { duration: 1.6, ease: 'power3.out' });
    const toY = gsap.quickTo(sun, 'y', { duration: 1.6, ease: 'power3.out' });
    const onMove = (event) => {
      toX((event.clientX / window.innerWidth - 0.5) * 120);
      toY((event.clientY / window.innerHeight - 0.5) * 70);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, { scope });

  return (
    <section ref={scope} className="relative isolate overflow-hidden px-5 pt-36 pb-24 sm:px-8 sm:pt-44 sm:pb-32">
      {/* Three layers so scroll, pointer and breathing never fight over `transform`. */}
      <div data-hero="sky" className="pointer-events-none absolute inset-x-0 -top-88 -z-10 flex justify-center" aria-hidden="true">
        <div data-hero="sun">
          <div className="sun-glow size-[min(1100px,140vw)]" />
        </div>
      </div>

      <div data-hero="copy" className="mx-auto max-w-4xl text-center">
        <LogoMark animate alive delay={0.1} className="mx-auto mb-8 size-[72px] drop-shadow-[0_14px_22px_var(--color-glow)]" />
        <p data-hero="label" className="label inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/60 px-4 py-2 backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-clay" aria-hidden="true" />
          A warm place to think
        </p>

        <h1 data-hero="title" className="mt-8 font-serif text-[clamp(3.4rem,9vw,7.75rem)] leading-[1.02] font-light tracking-[-0.035em]">
          <span className="block">Think out loud.</span>{' '}
          <span className="block">Milo <em className="accent">listens</em>.</span>
        </h1>

        <p data-hero="lede" className="mx-auto mt-8 max-w-136 text-[clamp(1.05rem,1.6vw,1.2rem)] leading-relaxed text-muted">
          Ask anything and watch the answer arrive word by word: clear, kind, and yours to keep.
        </p>

        <div data-hero="cta" className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/register" className="btn-primary group min-h-13 px-7">
            Start a conversation
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link to="/login" className="btn-ghost min-h-13 px-7">I have an account</Link>
        </div>
      </div>

      <div data-hero="card" className="mx-auto mt-20 max-w-2xl sm:mt-24">
        <div ref={float}>
          <ChatPreview />
        </div>
      </div>
    </section>
  );
}

function Closing() {
  const scope = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const trigger = { trigger: scope.current, start: 'top 72%', once: true };
    gsap.from('[data-closing="sun"]', { scale: 0, autoAlpha: 0, duration: 1.2, ease: 'back.out(2.4)', scrollTrigger: trigger });
    splitReveal('[data-closing="title"]', { delay: 0.15, stagger: 0.05, scrollTrigger: trigger });
    gsap.from('[data-closing="rest"] > *', { autoAlpha: 0, y: 22, duration: 1.1, ease: motion.ease.reveal, stagger: 0.12, delay: 0.6, scrollTrigger: trigger });
    gsap.fromTo('[data-closing="glow"]', { yPercent: 30, scale: 0.8 }, {
      yPercent: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: scope.current, start: 'top bottom', end: 'bottom bottom', scrub: true },
    });
  }, { scope });

  return (
    <section ref={scope} className="relative isolate overflow-hidden px-5 py-32 text-center sm:px-8 sm:py-44">
      <div data-closing="glow" className="pointer-events-none absolute inset-x-0 -bottom-72 -z-10 flex justify-center" aria-hidden="true">
        <div className="sun-glow size-190" />
      </div>
      <span data-closing="sun" className="mx-auto block w-fit"><LogoMark alive className="size-16" /></span>
      <h2 data-closing="title" className="mx-auto mt-10 max-w-3xl font-serif text-[clamp(2.6rem,6vw,4.75rem)] leading-[1.06] font-light tracking-[-0.03em] text-balance">
        Your next good idea is <em className="accent">one question</em> away.
      </h2>
      <div data-closing="rest">
        <p className="mt-6 text-[16px] text-muted">Make an account in under a minute. Just a name, an email and a password.</p>
        <div className="mt-10">
          <Link to="/register" className="btn-primary group min-h-13 px-8">
            Create your free account
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** The first page a visitor sees: what Milo is, and the way in. */
export function LandingPage() {
  return (
    <div className="grain relative min-h-svh bg-canvas text-ink">
      <LandingNav />
      <main>
        <Hero />
        <PromptMarquee />
        <Statement />
        <FeatureList />
        <ThemeShowcase />
        <Closing />
      </main>
      <LandingFooter />
    </div>
  );
}
