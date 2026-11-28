import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../../../app/routes.jsx';
import authReducer, { sessionCleared, sessionReceived } from '../../auth/State/auth.slice.js';
import conversationReducer from '../../conversation/State/conversation.slice.js';
import { conversationApi } from '../../conversation/Hooks/client.js';

vi.mock('../../auth/Hooks/session.js', () => ({
  initializeSession: vi.fn(),
  authApi: { login: vi.fn(), register: vi.fn(), logout: vi.fn(), me: vi.fn() },
}));
vi.mock('../../conversation/Hooks/client.js', () => ({
  conversationApi: { list: vi.fn(), messages: vi.fn(), send: vi.fn() },
}));

function setup(authenticated = false) {
  const store = configureStore({ reducer: { auth: authReducer, conversation: conversationReducer } });
  store.dispatch(authenticated
    ? sessionReceived({ accessToken: 't', user: { id: '1', name: 'Alex', email: 'a@b.co', createdAt: '2026-01-01T00:00:00.000Z' } })
    : sessionCleared());
  const router = createMemoryRouter(routes, { initialEntries: ['/'] });
  render(<Provider store={store}><RouterProvider router={router} /></Provider>);
  return { user: userEvent.setup(), router };
}

beforeEach(() => {
  vi.resetAllMocks();
  conversationApi.list.mockResolvedValue([]);
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('landing page', () => {
  it('welcomes guests with the full pitch and the ways in', () => {
    setup();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Think out loud. Milo listens.');
    const nav = within(screen.getByRole('navigation', { name: 'Main' }));
    expect(nav.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(nav.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/register');
    expect(nav.getByRole('link', { name: 'Features' })).toHaveAttribute('href', '#features');
    expect(document.getElementById('features')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Start a conversation/ })).toHaveAttribute('href', '/register');
    // Reduced motion (jsdom): the demo answer is shown in full right away.
    expect(screen.getByText(/Thirty minutes around the block/)).toBeVisible();
  });

  it('sends signed-in people straight to their chats', async () => {
    const { router } = setup(true);
    expect(await screen.findByRole('textbox')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/chat');
  });

  it('switches and remembers the theme', async () => {
    const { user } = setup();
    const showcase = within(screen.getByRole('radiogroup', { name: 'Theme' }));
    await user.click(showcase.getByRole('radio', { name: /Candlelight/ }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('milo-theme')).toBe('dark');
    expect(showcase.getByRole('radio', { name: /Candlelight/ })).toHaveAttribute('aria-checked', 'true');
    // The footer switch shows the same choice and can change it too.
    const footer = within(screen.getByRole('radiogroup', { name: 'Appearance' }));
    expect(footer.getByRole('radio', { name: /Candlelight/ })).toHaveAttribute('aria-checked', 'true');
    await user.click(footer.getByRole('radio', { name: /Daylight/ }));
    expect(document.documentElement.dataset.theme).toBe('light');

    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('lets the visitor stop and replay the demo answer', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Replay' }));
    expect(screen.getByText(/Ten pages of a paper book/)).toBeVisible();
  });
});
