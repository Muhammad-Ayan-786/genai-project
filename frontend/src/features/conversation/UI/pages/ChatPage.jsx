import { useCallback, useEffect, useState } from 'react';
import { useChatRoute } from '../../Hooks/useChat.js';
import { ConversationSidebar } from '../components/ConversationSidebar.jsx';
import { ChatHeader } from '../components/ChatHeader.jsx';
import { MessageThread } from '../components/MessageThread.jsx';

export function ChatPage() {
  useChatRoute();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') closeSidebar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen, closeSidebar]);

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      <a href="#main" className="sr-only z-50 rounded bg-forest p-3 text-on-forest focus:not-sr-only focus:absolute">Skip to chat</a>
      <ConversationSidebar open={sidebarOpen} onClose={closeSidebar} />
      <main id="main" className="flex min-w-0 flex-1 flex-col">
        <ChatHeader onOpenSidebar={openSidebar} />
        <MessageThread />
      </main>
    </div>
  );
}
