import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import { useAccount } from '../../auth/Hooks/useAuth.js';
import { notify } from '../../../shared/toast/notify.js';
import { sendMessage, stopReply } from './useConversation.js';
import {
  conversationSelected, newConversationOpened, selectCanSend, selectCurrentAiMessage,
  selectCurrentConversationId, selectCurrentTitle, selectHasCurrentAiMessage, selectIsCurrent,
  selectIsCurrentStreaming,
} from '../State/conversation.slice.js';

/** Longest message the composer accepts (the API body limit is 16 KB). */
export const MAX_MESSAGE_LENGTH = 12000;

/**
 * Keeps the URL (`/chat` or `/chat/:conversationId`) and the open conversation in sync,
 * so refresh, back/forward and shared links all land on the right chat.
 * Also stops a streaming reply when the chat page is left (e.g. on sign out).
 */
export function useChatRoute() {
  const { conversationId: param = null } = useParams();
  const dispatch = useDispatch();
  const store = useStore();
  const navigate = useNavigate();
  const current = useSelector(selectCurrentConversationId);

  // URL changed (click, back button, typed link) -> open that conversation.
  useEffect(() => {
    if (store.getState().conversation.currentConversation === param) return;
    dispatch(param ? conversationSelected(param) : newConversationOpened());
  }, [dispatch, store, param]);

  // A new chat got its id from the server -> put it in the URL.
  useEffect(() => {
    const open = store.getState().conversation.currentConversation;
    if (open && open !== param) navigate(`/chat/${open}`, { replace: true });
  }, [store, navigate, current, param]);

  useEffect(() => () => dispatch(stopReply()), [dispatch]);
}

/** Navigation actions for the sidebar and header. */
export function useChatNavigation() {
  const navigate = useNavigate();
  const openConversation = useCallback((id) => navigate(`/chat/${id}`), [navigate]);
  const startNewChat = useCallback(() => navigate('/chat'), [navigate]);
  return { openConversation, startNewChat };
}

/** Is this sidebar item the open conversation? Re-renders only that item when it changes. */
export function useIsCurrentConversation(id) {
  return useSelector(useMemo(() => selectIsCurrent(id), [id]));
}

export function useChatTitle() {
  return useSelector(selectCurrentTitle);
}

/** The reply being streamed in the open conversation, or `null`. */
export function useStreamingReply() {
  return useSelector(selectCurrentAiMessage);
}

export function useHasStreamingReply() {
  return useSelector(selectHasCurrentAiMessage);
}

/** State and actions for the message box. */
export function useComposer() {
  const dispatch = useDispatch();
  const canSend = useSelector(selectCanSend);
  const streaming = useSelector(selectIsCurrentStreaming);
  const conversationId = useSelector(selectCurrentConversationId);
  const [value, setValue] = useState('');
  const ready = canSend && value.trim().length > 0;

  const submit = useCallback((event) => {
    event?.preventDefault();
    if (!ready) return;
    dispatch(sendMessage(value));
    setValue('');
  }, [dispatch, ready, value]);

  const stop = useCallback(() => dispatch(stopReply()), [dispatch]);

  return {
    value, setValue, ready, streaming, submit, stop, conversationId,
    nearLimit: value.length > MAX_MESSAGE_LENGTH * 0.9,
  };
}

/** Sends a starter prompt straight away (used by the empty-state suggestions). */
export function useSendPrompt() {
  const dispatch = useDispatch();
  const canSend = useSelector(selectCanSend);
  const send = useCallback((prompt) => dispatch(sendMessage(prompt)), [dispatch]);
  return { canSend, send };
}

/** Copies text and briefly reports `copied: true` for the button's check mark. */
export function useCopy() {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      notify.error('Could not copy', 'Your browser blocked clipboard access. Select the text and copy it instead.', { id: 'copy' });
    }
  }, []);

  return { copied, copy };
}

/** The signed-in person, for the sidebar footer and the greeting. */
export function useChatAccount() {
  const { user, pending, error, logout } = useAccount();
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    signingOut: pending === 'logout',
    error,
    signOut: logout,
  };
}

/** "Good morning, Ayan." based on the local time. */
export function useGreeting() {
  const name = useSelector((state) => state.auth.user?.name ?? '');
  const firstName = name.trim().split(/\s+/)[0];
  const hour = new Date().getHours();
  const part = hour < 5 ? 'Still up' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return firstName ? `${part}, ${firstName}.` : `${part}.`;
}
