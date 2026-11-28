import { useRef } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, Check, LogOut, Moon, RefreshCw, Sun } from 'lucide-react';
import { useAccount } from '../../Hooks/useAuth.js';
import { useGoBack } from '../../Hooks/useGoBack.js';
import { ErrorMessage, Spinner } from '../components/Feedback.jsx';
import { gsap, useGSAP } from '../../../../shared/animations/gsap.js';
import { motion, prefersReducedMotion } from '../../../../shared/animations/motion.js';
import { splitReveal } from '../../../../shared/animations/splitReveal.js';
import { ThemeToggle } from '../../../../shared/theme/ThemeToggle.jsx';
import { useTheme } from '../../../../shared/theme/useTheme.js';
import { Wordmark } from '../../../../shared/ui/Wordmark.jsx';

const THEMES = [
  { value: 'light', name: 'Daylight', icon: Sun },
  { value: 'dark', name: 'Candlelight', icon: Moon },
];

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function Card({ children, className = '' }) {
  return (
    <section data-account="card" className={`rounded-[28px] border border-line bg-surface p-7 shadow-[var(--shadow-soft)] sm:p-9 ${className}`}>
      {children}
    </section>
  );
}

/** Light / dark picker: a real setting, saved on this device. */
function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  return (
    <Card>
      <p className="label">Appearance</p>
      <h2 className="mt-3 font-serif text-[26px] leading-tight font-normal">Light or dark</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">Saved on this device. You can also switch any time with the sun and moon button.</p>
      <div role="radiogroup" aria-label="Theme" className="mt-6 grid grid-cols-2 gap-2 rounded-full border border-line bg-raised p-1.5">
        {THEMES.map(({ value, name, icon }) => {
          const Icon = icon;
          const active = theme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(value)}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full text-[14px] transition-[background-color,color,box-shadow] duration-300 ${
                active ? 'bg-surface text-ink shadow-[var(--shadow-soft)]' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon size={15} strokeWidth={1.7} aria-hidden="true" /> {name}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function AccountPage() {
  const { user, pending, error, notice, logout, reloadProfile } = useAccount();
  const goBack = useGoBack('/chat');
  const firstName = user.name.split(' ')[0];
  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  const scope = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const ease = motion.ease.reveal;
    gsap.from('[data-account="bar"] > *', { autoAlpha: 0, y: -14, duration: 1, ease, stagger: 0.08 });
    gsap.from('[data-account="label"]', { autoAlpha: 0, y: 14, duration: 1, ease, delay: 0.15 });
    splitReveal('[data-account="title"]', { delay: 0.25, stagger: 0.07 });
    gsap.from('[data-account="lede"]', { autoAlpha: 0, y: 16, duration: 1.1, ease, delay: 0.55 });
    gsap.from('[data-account="card"]', { autoAlpha: 0, y: 40, duration: 1.3, ease, stagger: 0.1, delay: 0.6, clearProps: 'all' });
    gsap.from('[data-account="avatar"]', { scale: 0.4, rotate: -20, autoAlpha: 0, duration: 1.1, ease: 'back.out(2)', delay: 0.9 });
  }, { scope });

  return (
    <div ref={scope} className="grain relative isolate min-h-dvh overflow-hidden bg-canvas text-ink">
      <div className="pointer-events-none absolute -top-96 left-1/2 -z-10 -translate-x-1/2" aria-hidden="true">
        <div className="sun-glow size-[min(1000px,140vw)]" />
      </div>

      <header data-account="bar" className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
        <button type="button" onClick={goBack} className="group inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-surface/60 px-4 text-[14px] text-muted backdrop-blur-sm transition-colors hover:border-line-strong hover:text-ink">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to chats
        </button>
        <Wordmark to="/chat" size="sm" className="max-sm:hidden" />
        <ThemeToggle />
      </header>

      <main id="main" className="mx-auto max-w-5xl px-5 pt-8 pb-20 sm:px-8 sm:pt-14">
        <p data-account="label" className="label">Your account</p>
        <h1 data-account="title" className="mt-4 font-serif text-[clamp(2.6rem,6vw,4.25rem)] leading-[1.04] font-light tracking-[-0.03em]">
          You&apos;re home, <em className="accent">{firstName}</em>.
        </h1>
        <p data-account="lede" className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted">
          Your details, how Milo looks, and your session, all in one calm place.
        </p>

        {error && <div className="mt-8 max-w-xl"><ErrorMessage>{error}</ErrorMessage></div>}

        <div className="mt-12 grid gap-5 md:grid-cols-[1.25fr_1fr]">
          <Card className="md:row-span-2">
            <div className="flex items-start justify-between gap-4">
              <span data-account="avatar" aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-honey font-serif text-[24px] text-on-honey shadow-[0_0_0_6px_var(--color-honey-soft)]">
                {initials(user.name)}
              </span>
              <span className="label inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5">
                <Check size={12} className="text-honey-deep" aria-hidden="true" /> Signed in
              </span>
            </div>
            <h2 className="mt-7 font-serif text-[30px] leading-tight font-normal break-words">{user.name}</h2>
            <p className="mt-1 text-[15px] break-all text-muted">{user.email}</p>

            <dl className="mt-8 divide-y divide-line border-y border-line">
              {[
                ['Name', user.name],
                ['Email address', user.email],
                ['Member since', memberSince],
              ].map(([term, value]) => (
                <div key={term} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
                  <dt className="label">{term}</dt>
                  <dd className="text-[15px] break-all">{value}</dd>
                </div>
              ))}
            </dl>

            <button type="button" disabled={Boolean(pending)} onClick={reloadProfile} className="btn-ghost btn-sm mt-7 gap-2">
              {pending === 'profile' ? <Spinner className="size-4" /> : <RefreshCw size={14} aria-hidden="true" />}
              {pending === 'profile' ? 'Refreshing...' : 'Refresh account details'}
            </button>
            {notice && <p role="status" className="mt-3 text-[13px] leading-5 text-honey-deep">{notice}</p>}
          </Card>

          <AppearanceCard />

          <Card>
            <p className="label">Session</p>
            <h2 className="mt-3 font-serif text-[26px] leading-tight font-normal">Signed in on this device</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              Your session renews itself quietly for up to 7 days. Signing out ends it right away.
            </p>
            <button type="button" onClick={logout} disabled={Boolean(pending)} className="btn-ghost btn-sm mt-6 gap-2">
              {pending === 'logout' ? <Spinner className="size-4" /> : <LogOut size={15} strokeWidth={1.7} aria-hidden="true" />}
              {pending === 'logout' ? 'Signing out...' : 'Sign out'}
            </button>
          </Card>
        </div>

        <div data-account="card" className="mt-5 flex flex-col items-start justify-between gap-5 rounded-[28px] border border-line bg-raised px-7 py-7 sm:flex-row sm:items-center sm:px-9">
          <div>
            <p className="font-serif text-[24px] leading-tight">Ready to pick up where you left off?</p>
            <p className="mt-1 text-[14px] text-muted">Every conversation is waiting in your sidebar.</p>
          </div>
          <Link to="/chat" className="btn-primary group shrink-0">
            Open your chats
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </main>
    </div>
  );
}
