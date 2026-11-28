import { RotateCcw, Square } from 'lucide-react';
import { DEMO_QUESTION, useStreamingDemo } from '../../Hooks/useStreamingDemo.js';
import { LogoMark } from '../../../../shared/ui/Logo.jsx';

const STATUS_LABEL = {
  thinking: 'Thinking',
  streaming: 'Streaming',
  stopped: 'Stopped',
  done: 'Done',
};

/** Render one block of the answer, showing only its first `visible` words. */
function Words({ words, visible }) {
  return words.slice(0, visible).join(' ');
}

/**
 * A live, interactive preview of a Milo conversation: the answer streams in
 * word by word and the Stop button really stops it.
 */
export function ChatPreview() {
  const { blocks, shown, status, stop, replay } = useStreamingDemo();
  const live = status === 'thinking' || status === 'streaming';

  let start = 0;
  const rendered = [];
  let lastVisible = -1;
  const visibleCounts = blocks.map((block) => {
    const size = block.titleWords.length + block.words.length;
    const visible = Math.max(0, Math.min(size, shown - start));
    start += size;
    return visible;
  });
  visibleCounts.forEach((count, index) => { if (count > 0) lastVisible = index; });

  blocks.forEach((block, index) => {
    const visible = visibleCounts[index];
    if (visible === 0) return;
    const titleVisible = Math.min(visible, block.titleWords.length);
    const textVisible = visible - titleVisible;
    const caret = status === 'streaming' && index === lastVisible ? <span className="stream-caret" aria-hidden="true" /> : null;

    rendered.push(block.kind === 'p' ? (
      <p key={index}>
        <Words words={block.words} visible={textVisible} />
        {caret}
      </p>
    ) : (
      <div key={index} className="flex gap-4">
        <span className="font-label pt-[0.3em] text-[12px] text-clay">{block.n}</span>
        <p>
          <strong className="font-medium text-ink"><Words words={block.titleWords} visible={titleVisible} /></strong>
          {textVisible > 0 && ' '}
          <span className="text-muted"><Words words={block.words} visible={textVisible} /></span>
          {caret}
        </p>
      </div>
    ));
  });

  return (
    <figure
      className="relative overflow-hidden rounded-[28px] border border-line bg-surface text-left shadow-[var(--shadow-lift)]"
      aria-label="A preview of a conversation with Milo"
    >
      <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4 sm:px-8">
        <p className="label flex items-center gap-2.5">
          <span className={`size-2 rounded-full bg-honey ${live ? 'animate-pulse' : ''}`} aria-hidden="true" />
          Milo · <span aria-live="polite">{STATUS_LABEL[status]}</span>
        </p>
        <p className="label hidden rounded-full border border-line px-3 py-1.5 sm:block">GPT-OSS 120B · Groq</p>
      </header>

      <div className="space-y-7 px-6 py-7 sm:px-8 sm:py-8">
        <p className="ml-auto w-fit max-w-[85%] rounded-[20px] rounded-br-md bubble-sun px-5 py-3 text-[15px]">
          {DEMO_QUESTION}
        </p>

        <div className="flex gap-4">
          <LogoMark className="mt-1 size-[18px]" />
          <div className="min-h-[13.5rem] flex-1 space-y-3.5 font-serif text-[17px] leading-[1.65] text-ink sm:min-h-[12rem]">
            {status === 'thinking' ? (
              <p className="flex items-center gap-1.5 pt-2" aria-label="Milo is thinking">
                {[0, 1, 2].map((dot) => (
                  <span key={dot} className="thinking-dot size-1.5 rounded-full bg-faint" style={{ animationDelay: `${dot * 160}ms` }} />
                ))}
              </p>
            ) : rendered}
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-line px-6 py-3.5 sm:px-8">
        {live ? (
          <button type="button" onClick={stop} className="btn-ghost btn-sm min-h-9 gap-2 px-4 text-[13px]">
            <Square className="size-3 fill-current" aria-hidden="true" /> Stop
          </button>
        ) : (
          <button type="button" onClick={replay} className="btn-ghost btn-sm min-h-9 gap-2 px-4 text-[13px]">
            <RotateCcw className="size-3.5" aria-hidden="true" /> Replay
          </button>
        )}
        <p className="label hidden sm:block">
          {status === 'stopped' ? 'You’re in control' : 'Answers arrive as they’re written'}
        </p>
      </footer>
    </figure>
  );
}
