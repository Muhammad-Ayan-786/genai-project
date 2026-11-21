import { useEffect, useLayoutEffect, useRef } from 'react';
import { ArrowUp, Square } from 'lucide-react';
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
  const hero = variant === 'hero';

  useEffect(() => { textarea.current?.focus(); }, [conversationId]);

  // Grow with the text up to MAX_HEIGHT, then scroll inside.
  useLayoutEffect(() => {
    const element = textarea.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submit(event);
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div
        className={`group rounded-[22px] border border-field-line bg-surface shadow-composer transition-[border-color,box-shadow] duration-200 focus-within:border-forest/60 ${
          hero ? 'p-3 pl-5' : 'p-2.5 pl-4.5'
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
          placeholder={hero ? 'Ask anything, or start with an idea below' : `Reply to ${BRAND.name}`}
          className="chat-scroll block w-full resize-none bg-transparent py-2 pr-2 text-[15px] leading-6 text-ink placeholder:text-placeholder focus:outline-none"
        />
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="pl-0.5 text-[11px] text-muted" aria-live="polite">
            {nearLimit ? `${value.length.toLocaleString()} / ${MAX_MESSAGE_LENGTH.toLocaleString()} characters` : (
              <span className="max-sm:hidden"><kbd className="font-sans font-medium">Enter</kbd> to send, <kbd className="font-sans font-medium">Shift + Enter</kbd> for a new line</span>
            )}
          </p>
          {streaming ? (
            <button type="button" onClick={stop} aria-label="Stop reply"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-canvas transition-transform duration-150 hover:scale-105 active:scale-95 motion-reduce:transition-none">
              <Square size={13} fill="currentColor" strokeWidth={0} />
            </button>
          ) : (
            <button type="submit" disabled={!ready} aria-label="Send message"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest text-on-forest transition-[background-color,transform,opacity] duration-150 hover:bg-forest-hover active:scale-95 disabled:bg-line disabled:text-muted motion-reduce:transition-none">
              <ArrowUp size={18} strokeWidth={2.25} />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
