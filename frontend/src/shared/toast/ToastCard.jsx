import { useRef } from 'react';
import toast from 'react-hot-toast';
import { CircleAlert, X } from 'lucide-react';
import { gsap, useGSAP } from '../animations/gsap.js';
import { motion, prefersReducedMotion } from '../animations/motion.js';
import { LogoMark } from '../ui/Logo.jsx';

// react-hot-toast pauses every toast's timer while any toast is hovered.
// All countdown rings live here so they can pause and resume together.
// (Don't use useToasterStore() for this: in v2.6 a second subscriber's
// cleanup unsubscribes the Toaster itself, which freezes all toasts.)
const countdowns = new Set();
const pauseAll = () => countdowns.forEach((tween) => tween.pause());
const resumeAll = () => countdowns.forEach((tween) => tween.resume());

const RING = 2 * Math.PI * 15; // circumference of the countdown ring (r = 15)

/**
 * Milo's toast: a small floating pill at the top of the screen. The icon sits
 * inside a thin ring that empties as the toast's time runs out.
 * Don't render this directly; call `notify.*` from shared/toast/notify.js.
 */
export function ToastCard({ t, variant = 'info', title, message }) {
  const card = useRef(null);
  const ring = useRef(null);
  const isError = variant === 'error';

  // Drops in from above with a soft stretch, lifts away to leave.
  useGSAP(() => {
    if (prefersReducedMotion()) {
      gsap.set(card.current, { autoAlpha: t.visible ? 1 : 0 });
      return;
    }
    if (t.visible) {
      gsap.timeline()
        .fromTo(card.current,
          { autoAlpha: 0, y: -24, scaleX: 0.86, scaleY: 0.92 },
          { autoAlpha: 1, y: 0, scaleX: 1, scaleY: 1, duration: 0.6, ease: motion.ease.pop })
        .from('[data-toast-icon]', { scale: 0.3, rotate: -90, duration: 0.6, ease: motion.ease.pop }, '-=0.4')
        .from('[data-toast-text]', { autoAlpha: 0, x: -6, duration: 0.4, ease: motion.ease.out }, '-=0.45');
    } else {
      gsap.to(card.current, { autoAlpha: 0, y: -14, scale: 0.94, duration: motion.duration.fast, ease: motion.ease.in });
    }
  }, { dependencies: [t.visible], scope: card });

  // The ring around the icon empties over the toast's lifetime.
  useGSAP(() => {
    if (prefersReducedMotion() || !Number.isFinite(t.duration)) return undefined;
    const tween = gsap.fromTo(ring.current,
      { strokeDashoffset: 0 }, { strokeDashoffset: RING, duration: t.duration / 1000, ease: 'none' });
    countdowns.add(tween);
    return () => countdowns.delete(tween);
  }, { scope: card });

  return (
    <div
      ref={card}
      onMouseEnter={pauseAll}
      onMouseLeave={resumeAll}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className="pointer-events-auto flex max-w-[min(460px,calc(100vw-24px))] items-center gap-3 rounded-full border border-line bg-surface/85 py-1.5 pr-1.5 pl-1.5 shadow-toast backdrop-blur-xl"
    >
      <span data-toast-icon className="relative flex size-9 shrink-0 items-center justify-center">
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="18" cy="18" r="15" fill="none" strokeWidth="1.5" className="stroke-line" />
          <circle
            ref={ring}
            cx="18" cy="18" r="15" fill="none" strokeWidth="1.5" strokeLinecap="round"
            strokeDasharray={RING}
            className={isError ? 'stroke-error' : 'stroke-honey'}
          />
        </svg>
        {isError
          ? <CircleAlert size={16} className="text-error" aria-hidden="true" />
          : <LogoMark className="size-[18px]" />}
      </span>
      <p data-toast-text className="min-w-0 truncate text-[14px] leading-tight">
        <span className="font-medium text-ink">{title}</span>
        {message && <span className="text-muted"> · {message}</span>}
      </p>
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        aria-label="Dismiss notification"
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-faint transition-colors hover:bg-raised hover:text-ink"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
