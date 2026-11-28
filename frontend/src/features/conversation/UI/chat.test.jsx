import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../../../app/routes.jsx';
import authReducer, { sessionCleared, sessionReceived } from '../../auth/State/auth.slice.js';
import conversationReducer from '../State/conversation.slice.js';
import { groupByRecency } from '../Hooks/useConversation.js';
import { conversationApi } from '../Hooks/client.js';

vi.mock('../../auth/Hooks/session.js', () => ({
  initializeSession: vi.fn(),
  authApi: { logout: vi.fn() },
}));
vi.mock('../Hooks/client.js', () => ({
  conversationApi: { list: vi.fn(), messages: vi.fn(), send: vi.fn() },
}));

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

function setup(path = '/chat') {
  const store = configureStore({ reducer: { auth: authReducer, conversation: conversationReducer } });
  store.dispatch(sessionReceived({ accessToken: 't', user: { id: 'u1', name: 'Alex Morgan', email: 'a@b.co' } }));
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<Provider store={store}><RouterProvider router={router} /></Provider>);
  return { user: userEvent.setup(), store, router };
}

// Lets the test drive the SSE stream event by event.
function controllableSend() {
  const stream = {};
  conversationApi.send.mockImplementation((args) => new Promise((resolve, reject) => {
    Object.assign(stream, args, { finish: resolve, fail: reject });
  }));
  return stream;
}

const history = () => screen.findByRole('navigation', { name: 'Conversations' });

beforeEach(() => {
  conversationApi.list.mockResolvedValue([
    { id: 'c2', title: 'Newest chat', createdAt: daysAgo(3), lastMessage: daysAgo(0) },
    { id: 'c1', title: 'Older chat', createdAt: daysAgo(40), lastMessage: daysAgo(40) },
  ]);
});

describe('chat page', () => {
  it('groups conversations by recency and opens one from the sidebar and the URL', async () => {
    const { user, store, router } = setup();
    const nav = await history();
    expect(within(nav).getByRole('list', { name: 'Today' })).toHaveTextContent('Newest chat');
    expect(within(nav).getByRole('list', { name: 'Older' })).toHaveTextContent('Older chat');
    expect(screen.getByRole('heading', { name: /, Alex\.$/ })).toBeVisible();

    conversationApi.messages.mockResolvedValue([
      { id: 'm1', role: 'user', content: 'Hello there' },
      { id: 'm2', role: 'assistant', content: 'Hi! How can I help?' },
    ]);
    await user.click(within(nav).getByRole('button', { name: 'Older chat' }));
    expect(await screen.findByText('Hi! How can I help?')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Older chat');
    expect(within(nav).getByRole('button', { name: 'Older chat' })).toHaveAttribute('aria-current', 'page');
    expect(router.state.location.pathname).toBe('/chat/c1');
    expect(conversationApi.messages).toHaveBeenCalledWith('c1');
    expect(store.getState().conversation.messages.c1).toHaveLength(2);

    await user.click(screen.getAllByRole('button', { name: 'New chat' })[0]);
    expect(router.state.location.pathname).toBe('/chat');
    expect(store.getState().conversation.currentConversation).toBeNull();
  });

  it('streams a new conversation, puts its id in the URL, then commits the reply', async () => {
    const { user, store, router } = setup();
    await history();
    const stream = controllableSend();
    await user.type(screen.getByLabelText('Message Milo'), 'Explain SSE{Enter}');
    expect(screen.getByText('Explain SSE')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Thinking');
    expect(screen.getByRole('button', { name: 'Stop reply' })).toBeVisible();
    expect(stream.conversationId).toBeNull();

    act(() => {
      stream.onConversation({ id: 'c3', title: 'Server-sent events' });
      stream.onToken('Server ');
      stream.onToken('push.');
    });
    let state = store.getState().conversation;
    expect(state.currentConversation).toBe('c3');
    expect(state.aiLatestMessage).toMatchObject({ conversationId: 'c3', content: 'Server push.', status: 'streaming' });
    expect(state.messages.c3).toEqual([expect.objectContaining({ role: 'user', content: 'Explain SSE' })]);
    expect(screen.getByRole('button', { name: 'Server-sent events' })).toHaveAttribute('aria-current', 'page');
    expect(router.state.location.pathname).toBe('/chat/c3');
    expect(screen.getByText('Server push.')).toBeVisible();

    await act(async () => stream.finish());
    state = store.getState().conversation;
    expect(state.aiLatestMessage).toBeNull();
    expect(state.messages.c3.map((m) => [m.role, m.content])).toEqual([['user', 'Explain SSE'], ['assistant', 'Server push.']]);
    expect(screen.getByRole('button', { name: 'Copy reply' })).toBeVisible();
  });

  it('stops a reply on request and keeps what arrived so far', async () => {
    const { user, store } = setup();
    await history();
    const stream = controllableSend();
    await user.type(screen.getByLabelText('Message Milo'), 'Long answer please{Enter}');
    act(() => {
      stream.onConversation({ id: 'c3', title: 'Long answer' });
      stream.onToken('First part');
    });
    await user.click(screen.getByRole('button', { name: 'Stop reply' }));
    expect(stream.signal.aborted).toBe(true);
    expect(screen.getByText('Stopped early')).toBeVisible();
    act(() => stream.onToken(' (late token)'));
    await act(async () => stream.fail(new DOMException('Aborted', 'AbortError')));
    const state = store.getState().conversation;
    expect(state.aiLatestMessage).toBeNull();
    expect(state.messages.c3.at(-1)).toMatchObject({ role: 'assistant', content: 'First part', stopped: true });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('renders AI replies as GitHub-flavored Markdown with code blocks, and never raw HTML', async () => {
    const { user } = setup();
    conversationApi.messages.mockResolvedValue([
      { id: 'm1', role: 'user', content: 'Compare **them**' },
      { id: 'm2', role: 'assistant', content: 'Here is **bold** text.\n\n| Model | Speed |\n| --- | --- |\n| Fast | High |\n\n```js\nconst a = 1;\n```\n\n<script>alert(1)</script>' },
    ]);
    await user.click(await screen.findByRole('button', { name: 'Older chat' }));
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['Model', 'Speed']);
    expect(within(table).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['Fast', 'High']);
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByText('Compare **them**')).toBeVisible();
    expect(screen.getByText('js')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeVisible();
    expect(document.querySelector('script')).toBeNull();
  });

  it('shows stream failures in place and clears all conversation state on sign out', async () => {
    const { user, store } = setup();
    await history();
    conversationApi.send.mockRejectedValue(new TypeError('Failed to fetch'));
    await user.type(screen.getByLabelText('Message Milo'), 'Hi{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('could not reach Milo');
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    await user.type(screen.getByLabelText('Message Milo'), 'Again');
    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();

    act(() => { store.dispatch(sessionCleared()); });
    expect(store.getState().conversation).toEqual({
      conversation: [], currentConversation: null, messages: {}, aiLatestMessage: null,
    });
  });

  it('shows a retryable error when a conversation link is wrong', async () => {
    conversationApi.messages.mockRejectedValueOnce(Object.assign(new Error('nope'), { name: 'X' }));
    setup('/chat/does-not-exist');
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Start a new chat' })).toBeVisible();
  });
});

describe('groupByRecency', () => {
  it('puts conversations into Today / Yesterday / 7 / 30 day / Older groups', () => {
    const today = new Date(2026, 10, 21, 15, 0);
    const at = (d, h) => new Date(2026, 10, d, h).toISOString();
    const groups = groupByRecency([
      { id: 'a', lastMessage: at(21, 9) },
      { id: 'b', lastMessage: at(20, 23) },
      { id: 'c', lastMessage: at(16, 12) },
      { id: 'd', lastMessage: at(1, 12) },
      { id: 'e', lastMessage: null },
    ], today);
    expect(groups.map(({ label, items }) => [label, items.map(({ id }) => id)])).toEqual([
      ['Today', ['a']], ['Yesterday', ['b']], ['Previous 7 days', ['c']], ['Previous 30 days', ['d']], ['Older', ['e']],
    ]);
  });

  describe('on a large screen', () => {
    beforeEach(() => {
      window.localStorage.clear();
      // Every media query "matches": a desktop screen that also prefers reduced motion.
      vi.stubGlobal('matchMedia', (query) => ({
        matches: true, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
      }));
    });
    afterEach(() => vi.unstubAllGlobals());

    it('collapses the sidebar to an icon rail and remembers the choice', async () => {
      const { user } = setup();
      await history();
      await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
      expect(screen.queryByRole('navigation', { name: 'Conversations' })).toBeNull();
      const sidebar = screen.getByRole('complementary', { name: 'Conversation history' });
      expect(within(sidebar).getByRole('button', { name: 'New chat' })).toBeVisible();
      expect(window.localStorage.getItem('milo-sidebar')).toBe('collapsed');

      await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));
      expect(await history()).toBeVisible();
      expect(window.localStorage.getItem('milo-sidebar')).toBe('expanded');
    });
  });
});
