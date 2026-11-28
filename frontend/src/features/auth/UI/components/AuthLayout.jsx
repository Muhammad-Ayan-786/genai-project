import { useRef } from 'react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { gsap, useGSAP } from '../../../../shared/animations/gsap.js';
import { motion, prefersReducedMotion } from '../../../../shared/animations/motion.js';
import { Wordmark } from '../../../../shared/ui/Wordmark.jsx';
import { ThemeToggle } from '../../../../shared/theme/ThemeToggle.jsx';
import { AuthShowcase } from './AuthShowcase.jsx';

/**
 * Login / register frame: the living showcase on the left (large screens),
 * the form on the right.
 * @param {{ variant: 'login' | 'register', children: import('react').ReactNode }} props
 */
export function AuthLayout({ variant, children }) {
  const form = useRef(null);

  // The form column rises in, piece by piece, in reading order.
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const pieces = form.current.querySelectorAll(':scope > *:not(form), :scope form > fieldset > *');
    gsap.from(pieces, {
      autoAlpha: 0, y: 26, duration: 1.2, ease: motion.ease.reveal, stagger: 0.07, delay: 0.25,
      clearProps: 'opacity,visibility,transform',
    });
  }, { scope: form });

  return (
    <div className="flex min-h-dvh bg-canvas text-ink">
      <a href="#main" className="sr-only z-50 rounded-full bg-primary px-4 py-3 text-on-primary focus:not-sr-only focus:absolute focus:top-3 focus:left-3">
        Skip to form
      </a>

      <aside className="sticky top-0 hidden h-dvh w-[54%] shrink-0 p-3 lg:block">
        <AuthShowcase variant={variant} />
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-10">
          <span className="lg:invisible"><Wordmark /></span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/" className="group inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[15px] text-muted transition-colors hover:text-ink">
              <ArrowLeft className="size-4" aria-hidden="true" /> Home
            </Link>
          </div>
        </header>

        <main id="main" className="flex flex-1 items-center justify-center px-6 pt-4 pb-16 sm:px-10">
          <div ref={form} className="w-full max-w-[400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
