import { useCallback, useEffect, useState } from 'react';
import { useChatRoute } from '../../Hooks/useChat.js';
import { useIsDesktop, useSidebarCollapsed } from '../../Hooks/useSidebar.js';
import { ConversationSidebar } from '../components/ConversationSidebar.jsx';
import { ChatHeader } from '../components/ChatHeader.jsx';
import { MessageThread } from '../components/MessageThread.jsx';

export function ChatPage() {
  useChatRoute();
  const isDesktop = useIsDesktop();
  const { collapsed, toggleCollapsed } = useSidebarCollapsed();
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
    <div className="flex h-dvh overflow-hidden bg-canvas text-ink">
      <a href="#main" className="sr-only z-50 rounded-full bg-primary px-4 py-3 text-on-primary focus:not-sr-only focus:absolute focus:top-3 focus:left-3">
        Skip to chat
      </a>
      <ConversationSidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        isDesktop={isDesktop}
      />
      <main id="main" className="relative flex min-w-0 flex-1 flex-col">
        <ChatHeader onOpenSidebar={openSidebar} />
        <MessageThread />
      </main>
    </div>
  );
}
