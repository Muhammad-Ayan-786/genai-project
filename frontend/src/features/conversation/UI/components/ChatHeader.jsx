import { memo, useRef } from 'react';
import { Menu, SquarePen } from 'lucide-react';
import { gsap, useGSAP } from '../../../../shared/animations/gsap.js';
import { motion, prefersReducedMotion } from '../../../../shared/animations/motion.js';
import { useChatNavigation, useChatTitle } from '../../Hooks/useChat.js';

/** The model that answers today (see backend/src/services/ai/main.service.js). */
const MODEL_NAME = 'GPT-OSS 120B';

export const ChatHeader = memo(function ChatHeader({ onOpenSidebar }) {
  const title = useChatTitle();
  const { startNewChat } = useChatNavigation();
  const heading = useRef(null);

  // Each new title slides in softly (switching chats, or a new chat getting its name).
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from(heading.current, { autoAlpha: 0, y: 8, duration: 0.6, ease: motion.ease.reveal, clearProps: 'all' });
  }, { dependencies: [title] });

  return (
    <header className="relative z-10 flex h-16 shrink-0 items-center gap-2 border-b border-line bg-canvas/80 px-3 backdrop-blur-md sm:px-6">
      <button type="button" onClick={onOpenSidebar} aria-label="Open conversations"
        className="flex size-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-raised hover:text-ink lg:hidden">
        <Menu size={19} strokeWidth={1.7} />
      </button>
      <h1 ref={heading} className="min-w-0 flex-1 truncate font-serif text-[20px] font-normal tracking-[-0.01em]">{title}</h1>
      <p className="label hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 sm:flex" title="The model answering in this chat">
        <span className="size-1.5 rounded-full bg-honey" aria-hidden="true" />
        {MODEL_NAME} · Groq
      </p>
      <button type="button" onClick={startNewChat} aria-label="New chat" title="New chat"
        className="flex size-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-raised hover:text-ink lg:hidden">
        <SquarePen size={18} strokeWidth={1.7} />
      </button>
    </header>
  );
});
