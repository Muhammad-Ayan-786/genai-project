import { useRef } from 'react';
import { Link } from 'react-router';
import { gsap, useGSAP } from '../../../../shared/animations/gsap.js';
import { motion, prefersReducedMotion } from '../../../../shared/animations/motion.js';
import { Wordmark } from '../../../../shared/ui/Wordmark.jsx';
import { ThemeToggle } from '../../../../shared/theme/ThemeToggle.jsx';
import { useScrolled } from '../../Hooks/useScrolled.js';
import { useActiveSection } from '../../Hooks/useActiveSection.js';
import { LANDING_SECTIONS } from '../../sections.js';
const SECTION_IDS = LANDING_SECTIONS.map((section) => section.id);

/**
 * Floating top bar. Clear at the top of the page; once you scroll it becomes a
 * frosted pill with a thin saffron reading-progress line. A soft marker slides
 * under the link of the section you're reading.
 */
export function LandingNav() {
  const scrolled = useScrolled();
  const active = useActiveSection(SECTION_IDS);
  const bar = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from('[data-nav="item"]', { autoAlpha: 0, y: -18, duration: 1.1, ease: motion.ease.reveal, stagger: 0.08, delay: 0.1 });
    gsap.fromTo('[data-nav="progress"]', { scaleX: 0 }, {
      scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
    });
  }, { scope: bar });

  // Slide the marker to the active link (or fade it out between sections).
  useGSAP(() => {
    const marker = bar.current.querySelector('[data-nav="marker"]');
    const link = active && bar.current.querySelector(`[data-section="${active}"]`);
    const vars = link
      ? { x: link.offsetLeft, width: link.offsetWidth, autoAlpha: 1 }
      : { autoAlpha: 0 };
    if (prefersReducedMotion()) gsap.set(marker, vars);
    else gsap.to(marker, { ...vars, duration: 0.6, ease: 'expo.out' });
  }, { scope: bar, dependencies: [active] });

  return (
    <header ref={bar} className="fixed inset-x-0 top-0 z-30 px-3 pt-3 sm:px-5 sm:pt-4">
      <nav
        aria-label="Main"
        className={`relative mx-auto flex h-16 max-w-6xl items-center justify-between overflow-hidden rounded-full border px-2 transition-[background-color,border-color,box-shadow] duration-500 md:grid md:grid-cols-[1fr_auto_1fr] ${
          scrolled
            ? 'border-line bg-canvas/85 shadow-[var(--shadow-soft)] backdrop-blur-xl'
            : 'border-transparent'
        }`}
      >
        {/* Equal outer columns keep the links in the exact centre of the bar. */}
        <span data-nav="item" className="pl-3 sm:pl-4 md:justify-self-start"><Wordmark animate /></span>

        <div data-nav="item" className="relative hidden md:block">
          <span
            data-nav="marker"
            aria-hidden="true"
            className="invisible absolute top-0 left-0 h-full rounded-full border border-line bg-surface shadow-[var(--shadow-soft)]"
          />
          <ul className="flex items-center">
            {LANDING_SECTIONS.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  data-section={id}
                  aria-current={active === id ? 'location' : undefined}
                  className={`relative inline-flex min-h-10 items-center rounded-full px-4 text-[14.5px] transition-colors duration-300 ${
                    active === id ? 'text-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div data-nav="item" className="flex items-center gap-1.5 sm:gap-2 md:justify-self-end">
          <ThemeToggle />
          <Link to="/login" className="hidden min-h-10 items-center rounded-full px-4 text-[14.5px] text-muted transition-colors hover:text-ink sm:inline-flex">
            Log in
          </Link>
          <Link to="/register" className="btn-primary btn-sm">Get started</Link>
        </div>

        <span
          data-nav="progress"
          aria-hidden="true"
          className={`btn-sun absolute inset-x-8 bottom-0 h-[2px] shadow-none origin-left rounded-full transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`}
        />
      </nav>
    </header>
  );
}
