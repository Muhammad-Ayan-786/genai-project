import { memo } from 'react';
import { Menu, SquarePen } from 'lucide-react';
import { useChatNavigation, useChatTitle } from '../../Hooks/useChat.js';

/** The model that answers today (see backend/src/services/ai/main.service.js). */
const MODEL_NAME = 'GPT-OSS 120B';

export const ChatHeader = memo(function ChatHeader({ onOpenSidebar }) {
  const title = useChatTitle();
  const { startNewChat } = useChatNavigation();
  return (
    <header className="flex h-15 shrink-0 items-center gap-2 border-b border-line/70 px-3 sm:px-6">
      <button type="button" onClick={onOpenSidebar} aria-label="Open conversations"
        className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sage hover:text-forest lg:hidden">
        <Menu size={19} />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{title}</h1>
      <p className="hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-muted sm:flex" title="The model answering in this chat">
        <span className="size-1.5 rounded-full bg-forest" aria-hidden="true" />
        {MODEL_NAME}
      </p>
      <button type="button" onClick={startNewChat} aria-label="New chat" title="New chat"
        className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sage hover:text-forest lg:hidden">
        <SquarePen size={18} />
      </button>
    </header>
  );
});
