import { memo, useLayoutEffect, useRef } from 'react';
import { ArrowUpRight, CircleSlash, RotateCw } from 'lucide-react';
import { ErrorMessage } from '../../../auth/UI/components/Feedback.jsx';
import { useReveal } from '../../../../shared/animations/useReveal.js';
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
  'Explain how JWT refresh tokens work, in simple words',
  'Compare SQL and MongoDB in a short table',
  'Help me plan a 4-week study schedule for React',
  'Write a friendly email asking for a deadline extension',
];

function AssistantAvatar({ thinking = false }) {
  return <MiloMark className="mt-1 size-7 shrink-0 text-forest max-sm:hidden" thinking={thinking} />;
}

export const MessageBubble = memo(function MessageBubble({ role, content, stopped = false }) {
  if (role === 'user') {
    return (
      <article aria-label="You" className="message-enter flex justify-end">
        <p className="max-w-[85%] rounded-[20px] rounded-br-md bg-bubble px-4.5 py-3 text-[15px] leading-7 break-words whitespace-pre-wrap text-ink">
          {content}
        </p>
      </article>
    );
  }
  return (
    <article aria-label={BRAND.name} className="group flex gap-4">
      <AssistantAvatar />
      <div className="min-w-0 flex-1">
        <MarkdownMessage content={content} />
        <div className="mt-3 -ml-2 flex items-center gap-3">
          <CopyButton text={content} label="Copy reply" className="sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100" />
          {stopped && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <CircleSlash size={13} /> Stopped early
            </span>
          )}
        </div>
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

  useLayoutEffect(() => {
    const container = ref.current?.closest(SCROLL_SELECTOR);
    if (!container) return;
    // Follow the stream only if the reader hasn't scrolled up to read earlier messages.
    const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distance < STICK_THRESHOLD) container.scrollTop = container.scrollHeight;
  }, [content]);

  if (!latest) return null;
  const working = latest.status !== 'error';
  return (
    <article ref={ref} aria-label={BRAND.name} aria-busy={working} className="flex gap-4">
      <AssistantAvatar thinking={working} />
      <div className="min-w-0 flex-1 space-y-4">
        {latest.status === 'pending' ? (
          <p role="status" className="pt-1 font-reading text-[17px] text-muted italic">Thinking&hellip;</p>
        ) : latest.content && (
          <MarkdownMessage content={latest.content} streaming={latest.status === 'streaming'} />
        )}
        <ErrorMessage>{latest.status === 'error' ? latest.error : null}</ErrorMessage>
      </div>
    </article>
  );
}

/** The "new chat" screen: greeting, a large composer and a few starter prompts. */
function EmptyState() {
  const greeting = useGreeting();
  const { canSend, send } = useSendPrompt();
  const scope = useReveal();
  return (
    <div ref={scope} className={`${COLUMN} flex flex-1 flex-col justify-center py-12`}>
      <h2 data-reveal className="font-headline text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.035em] text-ink text-balance sm:text-[3.25rem]">
        {greeting}
      </h2>
      <p data-reveal className="mt-3 font-reading text-lg text-muted italic">What should we think through today?</p>
      <div data-reveal className="mt-9"><Composer variant="hero" /></div>
      <ul data-reveal aria-label="Suggestions" className="mt-6 divide-y divide-line border-y border-line">
        {SUGGESTIONS.map((prompt) => (
          <li key={prompt}>
            <button
              type="button"
              disabled={!canSend}
              onClick={() => send(prompt)}
              className="group/s flex min-h-12 w-full items-center justify-between gap-4 px-1 py-3 text-left text-sm text-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              <span>{prompt}</span>
              <ArrowUpRight size={16} className="shrink-0 text-forest opacity-40 transition-[opacity,transform] duration-200 group-hover/s:translate-x-0.5 group-hover/s:-translate-y-0.5 group-hover/s:opacity-100 motion-reduce:transition-none" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Grey placeholder lines while a conversation's messages load. */
function ThreadSkeleton() {
  return (
    <div role="status" aria-label="Loading messages" className={`${COLUMN} space-y-10 py-12`}>
      {[0, 1].map((row) => (
        <div key={row} className="space-y-10 motion-safe:animate-pulse">
          <div className="ml-auto h-11 w-2/5 rounded-[20px] bg-bubble" />
          <div className="flex gap-4">
            <div className="size-7 shrink-0 rounded-lg bg-line" />
            <div className="flex-1 space-y-3 pt-1">
              <div className="h-3.5 w-11/12 rounded bg-line" />
              <div className="h-3.5 w-4/5 rounded bg-line" />
              <div className="h-3.5 w-3/5 rounded bg-line" />
            </div>
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
          <button type="button" onClick={onRetry} className="button-secondary gap-2 px-4 text-sm"><RotateCw size={14} /> Try again</button>
          <button type="button" onClick={startNewChat} className="text-link min-h-11 px-2 text-sm">Start a new chat</button>
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
  const count = messages.length;

  // Jump to the newest message when switching conversations or when a message is added.
  useLayoutEffect(() => {
    const container = list.current?.closest(SCROLL_SELECTOR);
    if (container) container.scrollTop = container.scrollHeight;
  }, [count, conversationId]);

  const empty = !loading && !error && count === 0 && !hasStreamingReply;

  return (
    <>
      <section data-chat-scroll aria-label="Messages" className="chat-scroll flex flex-1 flex-col overflow-y-auto">
        {loading && <ThreadSkeleton />}
        {error && <ThreadError message={error} onRetry={retry} />}
        {empty && <EmptyState />}
        {!loading && !error && !empty && (
          <div ref={list} className={`${COLUMN} flex flex-col gap-8 pt-10 pb-8`}>
            {messages.map((message) => (
              <MessageBubble key={message.id} role={message.role} content={message.content} stopped={message.stopped} />
            ))}
            <StreamingMessage />
          </div>
        )}
      </section>
      {!empty && (
        <div className={`${COLUMN} shrink-0 pt-2 pb-4`}>
          <Composer />
          <p className="mt-2 text-center text-[11px] text-muted">{BRAND.name} can make mistakes. Check important answers.</p>
        </div>
      )}
    </>
  );
}
