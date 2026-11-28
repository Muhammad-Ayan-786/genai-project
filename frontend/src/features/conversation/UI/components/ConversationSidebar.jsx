import { memo, useRef } from 'react';
import { Link } from 'react-router';
import { LogOut, PanelLeftClose, PanelLeftOpen, Plus, RotateCw, X } from 'lucide-react';
import { gsap, useGSAP } from '../../../../shared/animations/gsap.js';
import { motion, prefersReducedMotion } from '../../../../shared/animations/motion.js';
import { Wordmark } from '../../../../shared/ui/Wordmark.jsx';
import { LogoMark } from '../../../../shared/ui/Logo.jsx';
import { ThemeToggle } from '../../../../shared/theme/ThemeToggle.jsx';
import { Spinner } from '../../../auth/UI/components/Feedback.jsx';
import { useConversationList } from '../../Hooks/useConversation.js';
import { useChatAccount, useChatNavigation, useIsCurrentConversation } from '../../Hooks/useChat.js';

const FULL = 272; // px, expanded
const RAIL = 68; // px, collapsed

const ConversationItem = memo(function ConversationItem({ id, title, onSelect }) {
  const isCurrent = useIsCurrentConversation(id);
  return (
    <li data-sb="item">
      <button
        type="button"
        onClick={() => onSelect(id)}
        aria-current={isCurrent ? 'page' : undefined}
        title={title}
        className={`group flex min-h-10 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] transition-[background-color,color] duration-200 ${
          isCurrent ? 'bg-surface text-ink shadow-[var(--shadow-soft)]' : 'text-muted hover:bg-canvas/70 hover:text-ink'
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {isCurrent && <span className="size-1.5 shrink-0 rounded-full bg-honey" aria-hidden="true" />}
      </button>
    </li>
  );
});

function ListSkeleton() {
  return (
    <div role="status" aria-label="Loading conversations" className="space-y-3 px-3 pt-3 motion-safe:animate-pulse">
      <div className="mb-5 h-2 w-12 rounded-full bg-line-strong" />
      {['w-4/5', 'w-3/5', 'w-11/12', 'w-2/3', 'w-3/4'].map((width) => (
        <div key={width} className={`h-2.5 rounded-full bg-line ${width} mb-5`} />
      ))}
    </div>
  );
}

function ConversationList({ onSelect }) {
  const { groups, isEmpty, status, error, retry } = useConversationList();
  const scope = useRef(null);

  // When the list first arrives, the items fall softly into place.
  useGSAP(() => {
    if (status !== 'ready' || prefersReducedMotion()) return;
    gsap.from('[data-sb="group"], [data-sb="item"]', {
      autoAlpha: 0, x: -10, duration: 0.7, ease: motion.ease.reveal, stagger: 0.025, clearProps: 'all',
    });
  }, { scope, dependencies: [status === 'ready'] });

  if (status === 'loading' && isEmpty) return <ListSkeleton />;
  return (
    <div ref={scope}>
      {status === 'error' && (
        <div role="alert" className="mx-1 mb-4 rounded-2xl border border-error-line bg-error-soft p-3.5 text-[13px] leading-5 text-error">
          <p>{error}</p>
          <button type="button" onClick={retry} className="mt-2 inline-flex min-h-8 items-center gap-1.5 font-medium text-ink underline-offset-4 hover:underline">
            <RotateCw size={12} /> Try again
          </button>
        </div>
      )}
      {isEmpty && status === 'ready' ? (
        <p className="px-3 py-2 text-[14px] leading-6 text-muted">
          Your conversations will appear here. Send a message to start the first one.
        </p>
      ) : (
        <div className="space-y-7">
          {groups.map(({ label, items }) => (
            <section key={label}>
              <h2 data-sb="group" className="label px-3 pb-2">{label}</h2>
              <ul aria-label={label} className="space-y-0.5">
                {items.map(({ id, title }) => <ConversationItem key={id} id={id} title={title} onSelect={onSelect} />)}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Avatar({ name, className = '' }) {
  return (
    <span aria-hidden="true" className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-honey font-serif text-[15px] text-on-honey ${className}`}>
      {name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')}
    </span>
  );
}

function SignOutButton({ account, className = '' }) {
  return (
    <button type="button" onClick={account.signOut} disabled={account.signingOut} aria-label="Sign out" title="Sign out"
      className={`flex size-10 shrink-0 items-center justify-center rounded-full text-faint transition-colors hover:bg-canvas/70 hover:text-ink disabled:opacity-60 ${className}`}>
      {account.signingOut ? <Spinner className="size-4" /> : <LogOut size={16} strokeWidth={1.7} />}
    </button>
  );
}

/** A rail icon with a small label that slides out on hover/focus. */
function RailTip({ text, children }) {
  return (
    <div className="group/tip relative flex justify-center">
      {children}
      <span role="presentation" className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-x-1 -translate-y-1/2 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] whitespace-nowrap text-ink opacity-0 shadow-[var(--shadow-soft)] transition-[opacity,translate] duration-200 group-focus-within/tip:translate-x-0 group-focus-within/tip:opacity-100 group-hover/tip:translate-x-0 group-hover/tip:opacity-100">
        {text}
      </span>
    </div>
  );
}

/**
 * Left side of the chat: brand, new chat, history and the account.
 * - Large screens: docked, either expanded (272px) or a slim rail (68px).
 * - Small screens: a drawer that slides over the chat.
 */
export const ConversationSidebar = memo(function ConversationSidebar({ open, onClose, collapsed, onToggleCollapsed, isDesktop }) {
  const { openConversation, startNewChat } = useChatNavigation();
  const account = useChatAccount();
  const select = (id) => { openConversation(id); onClose(); };
  const startNew = () => { startNewChat(); onClose(); };

  const aside = useRef(null);
  const animated = useRef(false); // skip the very first render: no animation on page load
  const rail = isDesktop && collapsed;

  // Collapse / expand: the width glides while the two layouts cross-fade.
  useGSAP(() => {
    const firstRun = !animated.current;
    animated.current = true;
    if (firstRun || !isDesktop || prefersReducedMotion()) return;
    const full = aside.current.querySelector('[data-sb="full"]');
    const icons = aside.current.querySelectorAll('[data-sb="rail"] > *');
    const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    if (collapsed) {
      tl.fromTo(full, { autoAlpha: 1, x: 0 }, { autoAlpha: 0, x: -16, duration: 0.2, ease: motion.ease.in })
        .fromTo(aside.current, { '--sidebar-w': `${FULL}px` }, { '--sidebar-w': `${RAIL}px`, duration: 0.55, ease: 'power3.inOut' }, '<0.05')
        .fromTo(icons, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.04, ease: motion.ease.out }, '-=0.25');
    } else {
      tl.fromTo(icons, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.15 })
        .fromTo(aside.current, { '--sidebar-w': `${RAIL}px` }, { '--sidebar-w': `${FULL}px`, duration: 0.55, ease: 'power3.inOut' }, '<')
        .fromTo(full, { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: motion.ease.out }, '-=0.25');
    }
    tl.set([full, ...icons], { clearProps: 'opacity,visibility,transform' });
  }, { dependencies: [collapsed], revertOnUpdate: false });

  return (
    <>
      {open && (
        <button type="button" aria-label="Close conversations" onClick={onClose}
          className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-[2px] lg:hidden" />
      )}
      <aside
        ref={aside}
        aria-label="Conversation history"
        style={{ '--sidebar-w': `${rail ? RAIL : FULL}px` }}
        className={`fixed inset-y-0 left-0 z-40 w-68 shrink-0 overflow-hidden border-r border-line bg-raised text-ink transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:static lg:visible lg:w-(--sidebar-w) lg:translate-x-0 ${
          open ? 'translate-x-0 shadow-[var(--shadow-lift)]' : 'max-lg:invisible -translate-x-full'
        }`}
      >
        {/* Expanded layout (always used for the mobile drawer). */}
        <div
          data-sb="full"
          inert={rail}
          aria-hidden={rail || undefined}
          className={`absolute inset-y-0 left-0 flex w-68 flex-col ${rail ? 'invisible opacity-0' : ''}`}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <Wordmark to="/chat" size="sm" />
            <button type="button" onClick={onToggleCollapsed} aria-label="Collapse sidebar" title="Collapse sidebar"
              className="hidden size-9 items-center justify-center rounded-full text-faint transition-colors hover:bg-canvas/70 hover:text-ink lg:flex">
              <PanelLeftClose size={18} strokeWidth={1.6} />
            </button>
            <button type="button" onClick={onClose} aria-label="Close sidebar"
              className="flex size-10 items-center justify-center rounded-full text-faint hover:bg-canvas/70 hover:text-ink lg:hidden">
              <X size={18} />
            </button>
          </div>

          <div className="px-4 pb-6">
            <button type="button" onClick={startNew} className="btn-primary group min-h-11 w-full gap-2 text-[14px]">
              <Plus size={16} strokeWidth={2} /> New chat
            </button>
          </div>

          <nav aria-label="Conversations" className="flex-1 overflow-y-auto px-2.5 pb-4">
            <ConversationList onSelect={select} />
          </nav>

          <div className="border-t border-line p-3">
            {account.error && <p role="alert" className="mb-2 px-2 text-xs leading-5 text-error">{account.error}</p>}
            <div className="flex items-center gap-1">
              <Link to="/account" className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors hover:bg-canvas/70">
                <Avatar name={account.name} />
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[14px] font-medium">{account.name}</span>
                  <span className="block truncate text-[12px] text-faint">{account.email}</span>
                </span>
              </Link>
              <ThemeToggle className="size-10 border-transparent bg-transparent" />
              <SignOutButton account={account} />
            </div>
          </div>
        </div>

        {/* Collapsed rail (large screens only). */}
        <div
          data-sb="rail"
          inert={!rail}
          aria-hidden={!rail || undefined}
          className={`absolute inset-y-0 left-0 hidden w-[68px] flex-col items-center gap-3 py-5 lg:flex ${rail ? '' : 'invisible opacity-0'}`}
        >
          <RailTip text="Home"><Link to="/chat" aria-label="Milo home" className="flex size-10 items-center justify-center rounded-full"><LogoMark className="size-8" /></Link></RailTip>
          <RailTip text="Open sidebar">
            <button type="button" onClick={onToggleCollapsed} aria-label="Expand sidebar"
              className="flex size-10 items-center justify-center rounded-full text-faint transition-colors hover:bg-canvas/70 hover:text-ink">
              <PanelLeftOpen size={18} strokeWidth={1.6} />
            </button>
          </RailTip>
          <RailTip text="New chat">
            <button type="button" onClick={startNew} aria-label="New chat"
              className="group flex size-11 items-center justify-center rounded-full btn-sun text-on-primary active:scale-95">
              <Plus size={18} strokeWidth={2} />
            </button>
          </RailTip>
          <div className="flex-1" />
          <RailTip text="Theme"><ThemeToggle className="border-transparent bg-transparent" /></RailTip>
          <RailTip text="Your account"><Link to="/account" aria-label="Your account"><Avatar name={account.name} /></Link></RailTip>
          <RailTip text="Sign out"><SignOutButton account={account} /></RailTip>
        </div>
      </aside>
    </>
  );
});
