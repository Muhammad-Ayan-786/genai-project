import { useEffect, useLayoutEffect, useRef } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { gsap, useGSAP } from '../../../../shared/animations/gsap.js';
import { prefersReducedMotion } from '../../../../shared/animations/motion.js';
import { MAX_MESSAGE_LENGTH, useComposer } from '../../Hooks/useChat.js';
import { BRAND } from '../../../../shared/brand.js';

const MAX_HEIGHT = 240;

/**
 * The message box. `hero` is the large centered version on the empty "new chat" screen;
 * `dock` sits under the thread.
 */
export function Composer({ variant = 'dock' }) {
  const { value, setValue, ready, streaming, submit, stop, conversationId, nearLimit } = useComposer();
  const textarea = useRef(null);
  const action = useRef(null);
  const hero = variant === 'hero';

  useEffect(() => { textarea.current?.focus(); }, [conversationId]);

  // Grow with the text up to MAX_HEIGHT, then scroll inside.
  useLayoutEffect(() => {
    const element = textarea.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  // Send <-> Stop swap with a small spin-and-pop.
  useGSAP(() => {
    if (!action.current || prefersReducedMotion()) return;
    gsap.from(action.current, { scale: 0.5, rotate: -90, autoAlpha: 0, duration: 0.45, ease: 'back.out(2)', clearProps: 'all' });
  }, { dependencies: [streaming], revertOnUpdate: true });

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submit(event);
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div
        className={`rounded-[26px] border border-line bg-surface shadow-[var(--shadow-soft)] transition-[border-color,box-shadow] duration-300 focus-within:border-line-strong focus-within:shadow-[0_0_0_5px_var(--color-honey-soft),var(--shadow-soft)] ${
          hero ? 'p-3.5 pl-5' : 'p-2.5 pl-5'
        }`}
      >
        <label htmlFor="chat-input" className="sr-only">Message {BRAND.name}</label>
        <textarea
          id="chat-input"
          ref={textarea}
          rows={hero ? 2 : 1}
          value={value}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={hero ? `Ask ${BRAND.name} anything…` : `Reply to ${BRAND.name}…`}
          className="block w-full resize-none bg-transparent py-2 pr-2 text-[16px] leading-6 text-ink placeholder:text-placeholder focus:outline-none"
        />
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="pl-0.5 text-[12px] text-faint" aria-live="polite">
            {nearLimit ? `${value.length.toLocaleString()} / ${MAX_MESSAGE_LENGTH.toLocaleString()} characters` : (
              <span className="max-sm:hidden">
                <kbd className="font-label text-[11px]">Enter</kbd> to send · <kbd className="font-label text-[11px]">Shift + Enter</kbd> for a new line
              </span>
            )}
          </p>
          <span ref={action} className="inline-flex">
            {streaming ? (
              <button type="button" onClick={stop} aria-label="Stop reply" title="Stop"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-canvas active:scale-95">
                <Square size={12} fill="currentColor" strokeWidth={0} />
              </button>
            ) : (
              <button type="submit" disabled={!ready} aria-label="Send message" title="Send"
                className="flex size-10 shrink-0 items-center justify-center rounded-full btn-sun text-on-primary active:scale-95 disabled:bg-none disabled:bg-raised disabled:text-faint disabled:shadow-none">
                <ArrowUp size={18} strokeWidth={2.1} />
              </button>
            )}
          </span>
        </div>
      </div>
    </form>
  );
}
