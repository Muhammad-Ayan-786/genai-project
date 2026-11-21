import { memo } from 'react';
import { Link } from 'react-router';
import { LogOut, Plus, RotateCw, X } from 'lucide-react';
import { Spinner } from '../../../auth/UI/components/Feedback.jsx';
import { useConversationList } from '../../Hooks/useConversation.js';
import { useChatAccount, useChatNavigation, useIsCurrentConversation } from '../../Hooks/useChat.js';
import { MiloMark } from './MiloMark.jsx';
import { BRAND } from '../../../../shared/brand.js';

const ConversationItem = memo(function ConversationItem({ id, title, onSelect }) {
  const isCurrent = useIsCurrentConversation(id);
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(id)}
        aria-current={isCurrent ? 'page' : undefined}
        title={title}
        className={`flex min-h-10 w-full items-center rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors duration-150 ${
          isCurrent ? 'bg-shell-active font-medium text-shell-ink' : 'text-shell-ink/80 hover:bg-shell-hover hover:text-shell-ink'
        }`}
      >
        <span className="truncate">{title}</span>
      </button>
    </li>
  );
});

function ListSkeleton() {
  return (
    <div role="status" aria-label="Loading conversations" className="space-y-2 px-3 pt-2 motion-safe:animate-pulse">
      <div className="mb-4 h-2.5 w-14 rounded bg-shell-active" />
      {['w-4/5', 'w-3/5', 'w-11/12', 'w-2/3', 'w-3/4'].map((width) => (
        <div key={width} className={`h-3 rounded bg-shell-hover ${width} mb-4`} />
      ))}
    </div>
  );
}

function ConversationList({ onSelect }) {
  const { groups, isEmpty, status, error, retry } = useConversationList();

  if (status === 'loading' && isEmpty) return <ListSkeleton />;
  return (
    <>
      {status === 'error' && (
        <div role="alert" className="mx-1 mb-4 rounded-lg bg-shell-hover p-3 text-xs leading-5 text-shell-ink">
          <p>{error}</p>
          <button type="button" onClick={retry} className="mt-2 inline-flex min-h-8 items-center gap-1.5 font-semibold text-mint underline-offset-4 hover:underline">
            <RotateCw size={12} /> Try again
          </button>
        </div>
      )}
      {isEmpty && status === 'ready' ? (
        <p className="px-3 py-2 text-[13px] leading-6 text-shell-muted">
          Your conversations will appear here. Send a message to start the first one.
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, items }) => (
            <section key={label}>
              <h2 className="px-3 pb-1.5 text-[11px] font-medium text-shell-muted">{label}</h2>
              <ul aria-label={label} className="space-y-0.5">
                {items.map(({ id, title }) => <ConversationItem key={id} id={id} title={title} onSelect={onSelect} />)}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function SidebarAccount() {
  const { name, email, signingOut, error, signOut } = useChatAccount();
  return (
    <div className="border-t border-shell-line p-3">
      {error && <p role="alert" className="mb-2 px-2 text-xs leading-5 text-mint">{error}</p>}
      <div className="flex items-center gap-1">
        <Link to="/account" className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-shell-hover">
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-mint font-headline text-sm font-semibold text-on-mint">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-medium text-shell-ink">{name}</span>
            <span className="block truncate text-[11px] text-shell-muted">{email}</span>
          </span>
        </Link>
        <button type="button" onClick={signOut} disabled={signingOut} aria-label="Sign out" title="Sign out"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-shell-muted transition-colors hover:bg-shell-hover hover:text-shell-ink disabled:opacity-60">
          {signingOut ? <Spinner className="size-4" /> : <LogOut size={16} />}
        </button>
      </div>
    </div>
  );
}

/** Left rail: brand, new chat, conversation history and the account. A drawer below `lg`. */
export const ConversationSidebar = memo(function ConversationSidebar({ open, onClose }) {
  const { openConversation, startNewChat } = useChatNavigation();
  const select = (id) => { openConversation(id); onClose(); };
  const startNew = () => { startNewChat(); onClose(); };

  return (
    <>
      {open && (
        <button type="button" aria-label="Close conversations" onClick={onClose}
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-[2px] lg:hidden" />
      )}
      <aside
        aria-label="Conversation history"
        className={`fixed inset-y-0 left-0 z-40 [&_:focus-visible]:outline-mint flex w-[17.5rem] flex-col border-r border-shell-line bg-shell text-shell-ink transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:static lg:visible lg:translate-x-0 ${
          open ? 'translate-x-0 shadow-2xl' : 'max-lg:invisible -translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <Link to="/chat" onClick={onClose} aria-label={`${BRAND.name} home`} className="inline-flex items-center gap-2.5 rounded-lg">
            <MiloMark className="size-8 text-mint" ink="var(--color-on-mint)" />
            <span className="font-display text-[21px] font-bold tracking-[-1px] text-shell-ink">{BRAND.wordmark}</span>
          </Link>
          <button type="button" onClick={onClose} aria-label="Close sidebar"
            className="flex size-11 items-center justify-center rounded-lg text-shell-muted hover:bg-shell-hover hover:text-shell-ink lg:hidden">
            <X size={18} />
          </button>
        </div>
        <div className="px-3 pt-1 pb-5">
          <button type="button" onClick={startNew}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-mint px-4 text-[13.5px] font-semibold text-on-mint transition-[filter,transform] duration-150 hover:brightness-105 active:scale-[0.98] motion-reduce:transition-none">
            <Plus size={16} strokeWidth={2.5} /> New chat
          </button>
        </div>
        <nav aria-label="Conversations" className="shell-scroll flex-1 overflow-y-auto px-2 pb-4">
          <ConversationList onSelect={select} />
        </nav>
        <SidebarAccount />
      </aside>
    </>
  );
});
