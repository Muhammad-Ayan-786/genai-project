import { LogoMark } from '../../../../shared/ui/Logo.jsx';

/**
 * Milo's avatar next to every answer: the mascot. While Milo is thinking its
 * eyes look around and it bobs gently, the chat's "I'm working on it" signal.
 * `animate` (used by the big empty-state mark) pops it in and keeps it blinking.
 * @param {{ thinking?: boolean, size?: string, animate?: boolean }} props
 */
export function MiloMark({ thinking = false, size = 'size-4', animate = false }) {
  return (
    <span aria-hidden="true" className={`relative inline-flex shrink-0 items-center justify-center ${size}`}>
      <LogoMark className="size-full" thinking={thinking} animate={animate} alive={animate} />
    </span>
  );
}
