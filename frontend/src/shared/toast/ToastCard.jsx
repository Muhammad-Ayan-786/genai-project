import { useRef } from 'react';
import toast from 'react-hot-toast';
import { CircleAlert, CircleCheck, Sparkles, X } from 'lucide-react';
import { gsap, useGSAP } from '../animations/gsap.js';
import { motion, prefersReducedMotion } from '../animations/motion.js';

const variants = {
  success: { Icon: CircleCheck, tile: 'bg-sage text-forest', bar: 'bg-forest' },
  error: { Icon: CircleAlert, tile: 'bg-error-soft text-error', bar: 'bg-error' },
  info: { Icon: Sparkles, tile: 'bg-sage text-forest', bar: 'bg-bar-strong' },
};

// react-hot-toast pauses every toast's timer while any toast is hovered.
// All countdown bars live here so they can pause and resume together.
// (Don't use useToasterStore() for this: in v2.6 a second subscriber's
// cleanup unsubscribes the Toaster itself, which freezes all toasts.)
const countdowns = new Set();
const pauseAll = () => countdowns.forEach((tween) => tween.pause());
const resumeAll = () => countdowns.forEach((tween) => tween.resume());

/**
 * Milo's own toast design. Rendered through react-hot-toast's `toast.custom`,
 * so react-hot-toast handles stacking/timing and we fully own the look.
 * Don't render this directly; call `notify.*` from shared/toast/notify.js.
 */
export function ToastCard({ t, variant = 'info', title, message }) {
  const card = useRef(null);
  const bar = useRef(null);
  const { Icon, tile, bar: barColor } = variants[variant] ?? variants.info;
  const isError = variant === 'error';

  // Toasts sit bottom-right (AppToaster.jsx): rise up with a soft pop, sink down to leave.
  // If you move the toaster to the top, flip the signs of these two `y` values.
  useGSAP(() => {
    if (prefersReducedMotion()) {
      gsap.set(card.current, { autoAlpha: t.visible ? 1 : 0 });
      return;
    }
    if (t.visible) {
      gsap.timeline()
        .fromTo(card.current,
          { autoAlpha: 0, y: 20, scale: 0.94 },
          { autoAlpha: 1, y: 0, scale: 1, duration: motion.duration.base, ease: motion.ease.pop })
        .from('[data-toast-icon]',
          { scale: 0.4, rotate: -45, duration: motion.duration.base, ease: motion.ease.pop }, '-=0.3');
    } else {
      gsap.to(card.current, {
        autoAlpha: 0, y: 12, scale: 0.96, duration: motion.duration.fast, ease: motion.ease.in,
      });
    }
  }, { dependencies: [t.visible], scope: card });

  // Countdown bar that shrinks over the toast's lifetime.
  useGSAP(() => {
    if (prefersReducedMotion() || !Number.isFinite(t.duration)) return;
    const tween = gsap.fromTo(bar.current,
      { scaleX: 1 }, { scaleX: 0, duration: t.duration / 1000, ease: 'none' });
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
      className="pointer-events-auto relative w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-line bg-surface shadow-toast"
    >
      <div className="flex items-start gap-3.5 p-4 pr-3">
        <span data-toast-icon className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tile}`}>
          <Icon size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-display text-sm font-semibold text-ink">{title}</p>
          {message && <p className="mt-1 text-[13px] leading-5 text-muted">{message}</p>}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          aria-label="Dismiss notification"
          className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sage hover:text-forest"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>
      <span
        ref={bar}
        aria-hidden="true"
        className={`absolute inset-x-0 bottom-0 h-[3px] origin-left motion-reduce:hidden ${barColor}`}
      />
    </div>
  );
}
