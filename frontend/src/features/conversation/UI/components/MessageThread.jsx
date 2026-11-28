import { memo, useLayoutEffect, useRef } from 'react';
import { ArrowUpRight, CircleSlash, RotateCw } from 'lucide-react';
import { ErrorMessage } from '../../../auth/UI/components/Feedback.jsx';
import { gsap, useGSAP } from '../../../../shared/animations/gsap.js';
import { motion, prefersReducedMotion } from '../../../../shared/animations/motion.js';
import { splitReveal } from '../../../../shared/animations/splitReveal.js';
import { useCurrentMessages } from '../../Hooks/useConversation.js';
import {
  useChatNavigation, useGreeting, useHasStreamingReply, useSendPrompt, useStreamingReply,
} from '../../Hooks/useChat.js';
import { Composer } from './Composer.jsx';
import { CopyButton } from './CopyButton.jsx';
import { MiloMark } from './MiloMark.jsx';
import { BRAND } from '../../../../shared/brand.js';
import { MarkdownMessage } from './MarkdownMessage.jsx';

const SCROLL_SELECTOR = '[data-chat-scroll]';
const STICK_THRESHOLD = 160;
const COLUMN = 'mx-auto w-full max-w-[46rem] px-5 sm:px-8';

const SUGGESTIONS = [
  'Explain JWT refresh tokens simply',
  'Compare SQL and MongoDB in a table',
  'Plan a 4-week React study schedule',
  'Write a polite deadline-extension email',
];

/** "MILO" label above every answer, with the sun that ripples while thinking. */
function AssistantLabel({ thinking = false, note }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <MiloMark thinking={thinking} />
      <span className="label">{BRAND.name}</span>
      {note && <span className="label text-honey-deep">· {note}</span>}
    </div>
  );
}

export const MessageBubble = memo(function MessageBubble({ role, content, stopped = false }) {
  if (role === 'user') {
    return (
      <article data-message="user" aria-label="You" className="flex justify-end">
        <p className="max-w-[85%] rounded-[22px] rounded-br-md bubble-sun px-5 py-3 text-[15.5px] leading-7 break-words whitespace-pre-wrap">
          {content}
        </p>
      </article>
    );
  }
  return (
    <article data-message="assistant" aria-label={BRAND.name} className="group">
      <AssistantLabel />
      <MarkdownMessage content={content} />
      <div className="mt-3 -ml-2 flex items-center gap-3">
        <CopyButton text={content} label="Copy reply" className="sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100" />
        {stopped && (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-faint">
            <CircleSlash size={13} /> Stopped early
          </span>
        )}
      </div>
    </article>
  );
});

/**
 * The reply being written right now. It is the only component that reads the streaming
 * text, so each new token re-renders this bubble and nothing else.
 */
function StreamingMessage() {
  const latest = useStreamingReply();
  const ref = useRef(null);
  const content = latest?.content;
  const present = Boolean(latest);

  useLayoutEffect(() => {
    const container = ref.current?.closest(SCROLL_SELECTOR);
    if (!container) return;
    // Follow the stream only if the reader hasn't scrolled up to read earlier messages.
    const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distance < STICK_THRESHOLD) container.scrollTop = container.scrollHeight;
  }, [content]);

  // The reply area fades up as soon as Milo starts working.
  useGSAP(() => {
    if (!present || !ref.current || prefersReducedMotion()) return;
    gsap.from(ref.current, { autoAlpha: 0, y: 14, duration: 0.7, ease: motion.ease.reveal, delay: 0.1, clearProps: 'all' });
  }, { dependencies: [present] });

  if (!latest) return null;
  const working = latest.status !== 'error';
  const pending = latest.status === 'pending';
  return (
    <article ref={ref} aria-label={BRAND.name} aria-busy={working}>
      <AssistantLabel thinking={working} note={pending ? 'thinking' : latest.status === 'streaming' ? 'writing' : null} />
      <div className="space-y-4">
        {pending ? (
          <p role="status" className="flex items-center gap-3 font-serif text-[17px] text-muted italic">
            <span className="flex gap-1" aria-hidden="true">
              {[0, 1, 2].map((dot) => (
                <span key={dot} className="thinking-dot size-1.5 rounded-full bg-faint" style={{ animationDelay: `${dot * 160}ms` }} />
              ))}
            </span>
            Thinking&hellip;
          </p>
        ) : latest.content && (
          <MarkdownMessage content={latest.content} streaming={latest.status === 'streaming'} />
        )}
        <ErrorMessage>{latest.status === 'error' ? latest.error : null}</ErrorMessage>
      </div>
    </article>
  );
}

/** Turns "Good evening, Ayan." into "Good evening, <em>Ayan</em>." for the headline. */
function Greeting({ text }) {
  const match = /^(.*, )(.+)\.$/.exec(text);
  if (!match) return text;
  return <>{match[1]}<em className="accent">{match[2]}</em>.</>;
}

/** The "new chat" screen: greeting, a large composer and a few starter prompts. */
function EmptyState() {
  const greeting = useGreeting();
  const { canSend, send } = useSendPrompt();
  const scope = useRef(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const ease = motion.ease.reveal;
    gsap.from('[data-empty="glow"]', { autoAlpha: 0, scale: 0.6, duration: 2.2, ease: 'power2.out' });
    splitReveal('[data-empty="title"]', { delay: 0.2, stagger: 0.08 });
    gsap.from('[data-empty="lede"]', { autoAlpha: 0, y: 16, duration: 1.1, ease, delay: 0.55 });
    gsap.from('[data-empty="composer"]', { autoAlpha: 0, y: 30, scale: 0.98, duration: 1.3, ease, delay: 0.65 });
    gsap.from('[data-empty="chip"]', { autoAlpha: 0, y: 14, scale: 0.92, duration: 0.9, ease, stagger: 0.07, delay: 0.85 });
  }, { scope });

  return (
    <div ref={scope} className={`${COLUMN} relative isolate flex flex-1 flex-col items-center justify-center py-12 text-center`}>
      <div data-empty="glow" className="pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-[62%]" aria-hidden="true">
        <div className="sun-glow size-[min(720px,120vw)]" />
      </div>
      <span data-empty="sun" className="inline-flex"><MiloMark size="size-14" animate /></span>
      <h2 data-empty="title" className="mt-7 font-serif text-[clamp(2.6rem,5.5vw,3.75rem)] leading-[1.05] font-light tracking-[-0.03em] text-balance">
        <Greeting text={greeting} />
      </h2>
      <p data-empty="lede" className="mt-3 font-serif text-[19px] text-muted italic">What&apos;s on your mind?</p>
      <div data-empty="composer" className="mt-10 w-full text-left"><Composer variant="hero" /></div>
      <ul aria-label="Suggestions" className="mt-6 flex flex-wrap justify-center gap-2.5">
        {SUGGESTIONS.map((prompt) => (
          <li key={prompt} data-empty="chip">
            <button
              type="button"
              disabled={!canSend}
              onClick={() => send(prompt)}
              className="group inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-surface/70 px-4 text-[14px] text-muted backdrop-blur-sm transition-[border-color,color,background-color] duration-300 hover:border-line-strong hover:bg-surface hover:text-ink disabled:opacity-50"
            >
              {prompt}
              <ArrowUpRight size={14} className="text-honey-deep opacity-50 transition-opacity duration-300 group-hover:opacity-100" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Soft placeholder lines while a conversation's messages load. */
function ThreadSkeleton() {
  return (
    <div role="status" aria-label="Loading messages" className={`${COLUMN} space-y-12 py-12`}>
      {[0, 1].map((row) => (
        <div key={row} className="space-y-10 motion-safe:animate-pulse">
          <div className="ml-auto h-12 w-2/5 rounded-[22px] bubble-sun opacity-50" />
          <div className="space-y-3">
            <div className="mb-5 h-2 w-16 rounded-full bg-line-strong" />
            <div className="h-3 w-11/12 rounded-full bg-line" />
            <div className="h-3 w-4/5 rounded-full bg-line" />
            <div className="h-3 w-3/5 rounded-full bg-line" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ThreadError({ message, onRetry }) {
  const { startNewChat } = useChatNavigation();
  return (
    <div className={`${COLUMN} flex flex-1 flex-col justify-center py-16`}>
      <div className="mx-auto w-full max-w-sm space-y-5 text-center">
        <ErrorMessage>{message}</ErrorMessage>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onRetry} className="btn-ghost btn-sm gap-2"><RotateCw size={14} /> Try again</button>
          <button type="button" onClick={startNewChat} className="text-link min-h-10 px-2 text-sm">Start a new chat</button>
        </div>
      </div>
    </div>
  );
}

/**
 * The scrollable middle of the chat page. Shows, in order of priority: loading skeleton,
 * load error, the empty "new chat" screen, or the conversation with its docked composer.
 */
export function MessageThread() {
  const { conversationId, messages, loading, error, retry } = useCurrentMessages();
  const hasStreamingReply = useHasStreamingReply();
  const list = useRef(null);
  const shownThread = useRef(null);
  const count = messages.length;
  const firstId = messages[0]?.id;

  // Jump to the newest message when switching conversations or when a message is added.
  useLayoutEffect(() => {
    const container = list.current?.closest(SCROLL_SELECTOR);
    if (container) container.scrollTop = container.scrollHeight;
  }, [count, conversationId]);

  // Opening a chat: the last few messages rise in, one after another.
  // Sending a message: just the new one glides in (yours from the right).
  useGSAP(() => {
    if (!list.current || prefersReducedMotion()) return;
    const items = list.current.querySelectorAll(':scope > [data-message]');
    if (!items.length) return;
    const opened = shownThread.current !== firstId;
    shownThread.current = firstId;
    const ease = motion.ease.reveal;
    if (opened) {
      gsap.from([...items].slice(-6), { autoAlpha: 0, y: 22, duration: 0.9, ease, stagger: 0.07, clearProps: 'all' });
    } else {
      const last = items[items.length - 1];
      const mine = last.dataset.message === 'user';
      gsap.from(last, {
        autoAlpha: 0, y: 16, x: mine ? 18 : 0, scale: mine ? 0.96 : 1, transformOrigin: mine ? '100% 100%' : '0% 0%',
        duration: 0.7, ease, clearProps: 'all',
      });
    }
  }, { dependencies: [count, firstId, loading] });

  const empty = !loading && !error && count === 0 && !hasStreamingReply;

  return (
    <>
      <section data-chat-scroll aria-label="Messages" className="flex flex-1 flex-col overflow-y-auto">
        {loading && <ThreadSkeleton />}
        {error && <ThreadError message={error} onRetry={retry} />}
        {empty && <EmptyState />}
        {!loading && !error && !empty && (
          <div ref={list} className={`${COLUMN} flex flex-col gap-10 pt-12 pb-10`}>
            {messages.map((message) => (
              <MessageBubble key={message.id} role={message.role} content={message.content} stopped={message.stopped} />
            ))}
            <StreamingMessage />
          </div>
        )}
      </section>
      {!empty && (
        <div className="relative shrink-0">
          {/* Soft fade so text dissolves behind the composer instead of being cut. */}
          <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-linear-to-t from-canvas to-transparent" aria-hidden="true" />
          <div className={`${COLUMN} pt-1 pb-4`}>
            <Composer />
            <p className="label mt-3 text-center text-[10px]">{BRAND.name} can make mistakes. Check what matters.</p>
          </div>
        </div>
      )}
    </>
  );
}
