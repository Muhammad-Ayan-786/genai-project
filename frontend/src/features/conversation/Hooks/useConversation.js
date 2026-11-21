import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';
import { conversationApi } from './client.js';
import { getConversationError } from '../API/conversation.api.js';
import {
  NEW_CONVERSATION_KEY, aiMessageCompleted, aiMessageFailed, aiMessageStopped, aiTokenReceived,
  conversationStarted, conversationsLoaded, messagesLoaded, selectCanSend, selectConversationList,
  selectCurrentConversationId, selectCurrentMessages, userMessageSent,
} from '../State/conversation.slice.js';

// ── Thunks: async work that talks to the API and then updates the store ──────────

let listRequest = null;
const messageRequests = new Map();
/** The reply currently streaming: `{ controller, requestId }`. */
let activeStream = null;

const currentUserId = (getState) => getState().auth.user?.id ?? null;

/** Loads the sidebar list. Parallel calls share one request. */
export const loadConversations = () => (dispatch, getState) => {
  if (!listRequest) {
    const userId = currentUserId(getState);
    listRequest = conversationApi.list()
      // Drop late responses that belong to a session that has since signed out.
      .then((list) => { if (currentUserId(getState) === userId) dispatch(conversationsLoaded(list)); })
      .finally(() => { listRequest = null; });
  }
  return listRequest;
};

/** Loads one conversation's messages. Parallel calls for the same id share one request. */
export const loadMessages = (conversationId) => (dispatch, getState) => {
  if (!messageRequests.has(conversationId)) {
    const userId = currentUserId(getState);
    messageRequests.set(conversationId, conversationApi.messages(conversationId)
      .then((messages) => {
        if (currentUserId(getState) === userId) dispatch(messagesLoaded({ conversationId, messages }));
      })
      .finally(() => messageRequests.delete(conversationId)));
  }
  return messageRequests.get(conversationId);
};

/**
 * Sends a message in the open conversation and streams the reply into the store.
 * @param {string} content
 * @returns {Promise<boolean>} `false` if nothing was sent (empty text or a reply is still streaming).
 */
export const sendMessage = (content) => async (dispatch, getState) => {
  const text = content.trim();
  if (!text || !selectCanSend(getState())) return false;
  const conversationId = getState().conversation.currentConversation;
  const requestId = nanoid();
  const controller = new AbortController();
  activeStream = { controller, requestId };
  dispatch(userMessageSent({ requestId, conversationId: conversationId ?? NEW_CONVERSATION_KEY, content: text }));
  try {
    await conversationApi.send({
      content: text,
      conversationId,
      signal: controller.signal,
      onConversation: (conversation) => dispatch(conversationStarted({ requestId, ...conversation })),
      onToken: (token) => dispatch(aiTokenReceived({ requestId, token })),
    });
    dispatch(aiMessageCompleted({ requestId }));
  } catch (error) {
    // Stopping on purpose is not an error; the stop thunk already saved the partial reply.
    if (!controller.signal.aborted) dispatch(aiMessageFailed({ requestId, error: getConversationError(error) }));
  } finally {
    if (activeStream?.requestId === requestId) activeStream = null;
  }
  return true;
};

/** Stops the streaming reply and keeps what has arrived so far. */
export const stopReply = () => (dispatch) => {
  if (!activeStream) return;
  const { controller, requestId } = activeStream;
  activeStream = null;
  dispatch(aiMessageStopped({ requestId }));
  controller.abort();
};

// ── Hooks used by the UI ──────────────────────────────────────────────────────────

const DAY = 24 * 60 * 60 * 1000;
const GROUPS = [
  { label: 'Today', maxDays: 0 },
  { label: 'Yesterday', maxDays: 1 },
  { label: 'Previous 7 days', maxDays: 7 },
  { label: 'Previous 30 days', maxDays: 30 },
  { label: 'Older', maxDays: Infinity },
];

/**
 * Splits conversations (already newest first) into "Today", "Yesterday", ... groups.
 * @param {{ id: string, title: string, lastMessage: string | null }[]} conversations
 * @param {Date} [today]
 */
export function groupByRecency(conversations, today = new Date()) {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const groups = GROUPS.map(({ label }) => ({ label, items: [] }));
  for (const conversation of conversations) {
    const at = Date.parse(conversation.lastMessage) || 0;
    const daysAgo = at >= startOfToday ? 0 : Math.ceil((startOfToday - at) / DAY);
    groups[GROUPS.findIndex(({ maxDays }) => daysAgo <= maxDays)].items.push(conversation);
  }
  return groups.filter(({ items }) => items.length > 0);
}

/** The sidebar list: loads once, exposes loading/error state and recency groups. */
export function useConversationList() {
  const dispatch = useDispatch();
  const conversations = useSelector(selectConversationList);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    dispatch(loadConversations())
      .then(() => { if (active) setStatus('ready'); })
      .catch((failure) => {
        if (!active) return;
        setStatus('error');
        setError(getConversationError(failure));
      });
    return () => { active = false; };
  }, [dispatch, attempt]);

  const retry = useCallback(() => {
    setStatus('loading');
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  const groups = useMemo(() => groupByRecency(conversations), [conversations]);
  return { groups, isEmpty: conversations.length === 0, status, error, retry };
}

/** Subscribes only to the open conversation's messages, fetching them on first view. */
export function useCurrentMessages() {
  const dispatch = useDispatch();
  const conversationId = useSelector(selectCurrentConversationId);
  const messages = useSelector(selectCurrentMessages);
  const [failure, setFailure] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const needsFetch = conversationId !== null && messages === undefined;

  useEffect(() => {
    if (!needsFetch) return undefined;
    let active = true;
    dispatch(loadMessages(conversationId)).catch((error) => {
      if (active) setFailure({ conversationId, message: getConversationError(error) });
    });
    return () => { active = false; };
  }, [dispatch, conversationId, needsFetch, attempt]);

  const error = needsFetch && failure?.conversationId === conversationId ? failure.message : null;
  return {
    conversationId,
    messages: messages ?? [],
    loading: needsFetch && !error,
    error,
    retry: () => {
      setFailure(null);
      setAttempt((value) => value + 1);
    },
  };
}
