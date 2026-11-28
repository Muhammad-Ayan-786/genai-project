import { useRef } from 'react';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import { gsap, useGSAP } from '../../../../shared/animations/gsap.js';
import { prefersReducedMotion } from '../../../../shared/animations/motion.js';

/** Error banner. Each new message drops in with a small "no-no" shake. */
export function ErrorMessage({ children }) {
  const box = useRef(null);

  useGSAP(() => {
    if (!children || !box.current || prefersReducedMotion()) return;
    gsap.timeline()
      .from(box.current, { autoAlpha: 0, y: -8, duration: 0.35, ease: 'power3.out' })
      .to(box.current, { keyframes: { x: [-7, 6, -4, 2, 0] }, duration: 0.45, ease: 'power1.out' }, '<0.1');
  }, { dependencies: [children], scope: box });

  if (!children) return null;
  return (
    <div ref={box} role="alert" className="flex items-start gap-3 rounded-2xl border border-error-line bg-error-soft px-4 py-3.5 text-[14px] leading-6 text-error">
      <CircleAlert size={18} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function Spinner({ className = '' }) {
  return <LoaderCircle aria-hidden="true" size={18} className={`animate-spin motion-reduce:animate-none ${className}`} />;
}
