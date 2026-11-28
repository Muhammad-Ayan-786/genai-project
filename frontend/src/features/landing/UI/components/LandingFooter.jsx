import { useRef } from 'react';
import { Link } from 'react-router';
import { ArrowUp, Moon, Sun } from 'lucide-react';
import { gsap, useGSAP } from '../../../../shared/animations/gsap.js';
import { motion, prefersReducedMotion } from '../../../../shared/animations/motion.js';
import { BRAND } from '../../../../shared/brand.js';
import { LogoMark } from '../../../../shared/ui/Logo.jsx';
import { Wordmark } from '../../../../shared/ui/Wordmark.jsx';
import { useTheme } from '../../../../shared/theme/useTheme.js';
import { LANDING_SECTIONS } from '../../sections.js';

const THEMES = [
  { value: 'light', label: 'Daylight', icon: Sun },
  { value: 'dark', label: 'Candlelight', icon: Moon },
];

const linkClass = 'text-[15px] text-muted transition-colors duration-200 hover:text-ink';

/** Footer: what Milo is, the real places to go, a theme switch, and a giant wordmark the mascot peeks over. */
export function LandingFooter() {
  const scope = useRef(null);
  const { theme, setTheme } = useTheme();

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const ease = motion.ease.reveal;
    const enter = { trigger: scope.current, start: 'top 88%', once: true };
    gsap.from('[data-footer="col"]', { autoAlpha: 0, y: 28, duration: 1.2, ease, stagger: 0.1, scrollTrigger: enter });
    const giant = { trigger: '[data-footer="giant"]', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 };
    gsap.fromTo('[data-footer="word"]', { yPercent: 55 }, { yPercent: 0, ease: 'none', scrollTrigger: giant });
    gsap.from('[data-footer="peek"]', {
      yPercent: 120, rotate: -14, duration: 1.1, ease: 'back.out(1.8)',
      scrollTrigger: { trigger: '[data-footer="giant"]', start: 'top 70%', once: true },
    });
  }, { scope });

  const toTop = () => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

  return (
    <footer ref={scope} className="relative overflow-hidden border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 pt-16 pb-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div data-footer="col">
          <Wordmark />
          <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-muted">
            A warm, calm place to think out loud. Ask anything and watch the answer arrive word by word.
          </p>
          <p className="label mt-6 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5">
            <span className="size-1.5 rounded-full bg-honey" aria-hidden="true" /> GPT-OSS 120B · Groq
          </p>
        </div>

        <nav data-footer="col" aria-label="This page">
          <p className="label">Explore</p>
          <ul className="mt-5 space-y-3">
            {LANDING_SECTIONS.map(({ id, label }) => (
              <li key={id}><a href={`#${id}`} className={linkClass}>{label}</a></li>
            ))}
          </ul>
        </nav>

        <nav data-footer="col" aria-label="Account">
          <p className="label">Account</p>
          <ul className="mt-5 space-y-3">
            <li><Link to="/login" className={linkClass}>Log in</Link></li>
            <li><Link to="/register" className={linkClass}>Create an account</Link></li>
          </ul>
        </nav>

        <div data-footer="col">
          <p className="label" id="footer-theme">Appearance</p>
          <div role="radiogroup" aria-labelledby="footer-theme" className="mt-5 inline-flex rounded-full border border-line bg-surface/60 p-1">
            {THEMES.map(({ value, label, icon }) => {
              const Icon = icon;
              const active = theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(value)}
                  className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 text-[13.5px] transition-colors duration-300 ${
                    active ? 'btn-sun text-on-primary' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon className="size-3.5" strokeWidth={1.8} aria-hidden="true" /> {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 border-t border-line px-5 py-6 sm:px-8">
        <p className="text-[13px] text-faint">© {new Date().getFullYear()} {BRAND.name}. Made with warmth.</p>
        <button type="button" onClick={toTop} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line px-4 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-ink">
          <ArrowUp className="size-3.5" aria-hidden="true" /> Back to top
        </button>
      </div>

      {/* Giant wordmark rising from the bottom edge, with the mascot peeking over its shoulder. */}
      <div data-footer="giant" aria-hidden="true" className="relative mx-auto -mb-[0.32em] flex max-w-6xl justify-center overflow-hidden px-5 sm:px-8">
        <span className="relative">
          <span
            data-footer="word"
            className="block bg-linear-to-b from-line-strong to-transparent bg-clip-text font-serif text-[clamp(7rem,30vw,24rem)] leading-[1.2] font-light tracking-[-0.055em] text-transparent select-none"
          >
            {BRAND.wordmark}
          </span>
          <span data-footer="peek" className="absolute top-[14%] -right-[6%] block w-[18%]">
            <LogoMark alive className="h-auto w-full" />
          </span>
        </span>
      </div>
    </footer>
  );
}
