import { createSlice, nanoid } from '@reduxjs/toolkit';
import { sessionCleared } from '../../auth/State/auth.slice.js';

// Messages for a conversation the server has not created yet live under this key.
export const NEW_CONVERSATION_KEY = '__new__';

const initialState = {
  /** Sidebar list: `{ id, title, createdAt, lastMessage }`, most recent activity first. */
  conversation: [],
  /** Open conversation id, or `null` for a brand-new chat. */
  currentConversation: null,
  /** Loaded messages per conversation id. `undefined` means "not fetched yet". */
  messages: {},
  /**
   * The reply being streamed right now (only one at a time):
   * `{ requestId, conversationId, content, status: 'pending' | 'streaming' | 'error', error }`.
   * Kept apart from `messages` so each token only re-renders the streaming bubble.
   */
  aiLatestMessage: null,
};

const time = (value) => Date.parse(value) || 0;
const byRecentActivity = (a, b) => time(b.lastMessage) - time(a.lastMessage);
const now = () => new Date().toISOString();

// Stream actions carry the requestId of the send that started them; stale ones are ignored.
const activeReply = (state, requestId) => {
  const latest = state.aiLatestMessage;
  return latest && latest.requestId === requestId ? latest : null;
};

const commitReply = (state, latest, extra = {}) => {
  (state.messages[latest.conversationId] ??= []).push({
    id: nanoid(), role: 'assistant', content: latest.content, createdAt: now(), ...extra,
  });
};

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    conversationsLoaded(state, { payload }) {
      const known = new Set(payload.map(({ id }) => id));
      // Keep conversations created locally while the list request was in flight.
      const local = state.conversation.filter(({ id }) => !known.has(id));
      state.conversation = [...local, ...payload].sort(byRecentActivity);
    },
    conversationSelected(state, { payload }) {
      state.currentConversation = payload;
      if (state.aiLatestMessage?.status === 'error') state.aiLatestMessage = null;
    },
    newConversationOpened(state) {
      state.currentConversation = null;
      if (state.aiLatestMessage?.conversationId !== NEW_CONVERSATION_KEY) {
        delete state.messages[NEW_CONVERSATION_KEY];
      }
      if (state.aiLatestMessage?.status === 'error') state.aiLatestMessage = null;
    },
    messagesLoaded(state, { payload: { conversationId, messages } }) {
      if (!state.messages[conversationId]) state.messages[conversationId] = messages;
    },
    userMessageSent: {
      reducer(state, { payload: { requestId, conversationId, message } }) {
        (state.messages[conversationId] ??= []).push(message);
        state.aiLatestMessage = { requestId, conversationId, content: '', status: 'pending', error: null };
        // Continuing an older chat moves it to the top of the sidebar, like the server does.
        const item = state.conversation.find(({ id }) => id === conversationId);
        if (item) {
          item.lastMessage = message.createdAt;
          state.conversation.sort(byRecentActivity);
        }
      },
      prepare: ({ requestId, conversationId, content }) => ({
        payload: {
          requestId,
          conversationId,
          message: { id: nanoid(), role: 'user', content, createdAt: now() },
        },
      }),
    },
    conversationStarted(state, { payload: { requestId, id, title } }) {
      const latest = activeReply(state, requestId);
      if (!latest) return;
      if (!state.conversation.some((item) => item.id === id)) {
        const at = now();
        state.conversation.unshift({ id, title, createdAt: at, lastMessage: at });
      }
      if (latest.conversationId === NEW_CONVERSATION_KEY) {
        if (state.messages[NEW_CONVERSATION_KEY]) {
          state.messages[id] = [...(state.messages[id] ?? []), ...state.messages[NEW_CONVERSATION_KEY]];
          delete state.messages[NEW_CONVERSATION_KEY];
        }
        latest.conversationId = id;
        // Only follow the new chat if the user is still looking at the "new chat" screen.
        if (state.currentConversation === null) state.currentConversation = id;
      }
    },
    aiTokenReceived(state, { payload: { requestId, token } }) {
      const latest = activeReply(state, requestId);
      if (!latest) return;
      latest.content += token;
      latest.status = 'streaming';
    },
    aiMessageCompleted(state, { payload: { requestId } }) {
      const latest = activeReply(state, requestId);
      if (!latest) return;
      if (latest.content) commitReply(state, latest);
      state.aiLatestMessage = null;
    },
    /** The user pressed Stop (or left the page): keep whatever arrived so far. */
    aiMessageStopped(state, { payload: { requestId } }) {
      const latest = activeReply(state, requestId);
      if (!latest) return;
      if (latest.content) commitReply(state, latest, { stopped: true });
      state.aiLatestMessage = null;
    },
    aiMessageFailed(state, { payload: { requestId, error } }) {
      const latest = activeReply(state, requestId);
      if (!latest) return;
      latest.status = 'error';
      latest.error = error;
    },
  },
  extraReducers: (builder) => {
    // Never leak one account's conversations into the next session.
    builder.addCase(sessionCleared, () => initialState);
  },
});

export const {
  conversationsLoaded, conversationSelected, newConversationOpened, messagesLoaded,
  userMessageSent, conversationStarted, aiTokenReceived, aiMessageCompleted, aiMessageStopped, aiMessageFailed,
} = conversationSlice.actions;
export default conversationSlice.reducer;

// Narrow selectors: each returns a primitive or a reference that only changes when its own data does.
export const selectConversationList = (state) => state.conversation.conversation;
export const selectCurrentConversationId = (state) => state.conversation.currentConversation;
export const selectCurrentKey = (state) => state.conversation.currentConversation ?? NEW_CONVERSATION_KEY;
export const selectIsCurrent = (id) => (state) => state.conversation.currentConversation === id;
export const selectCurrentMessages = (state) => state.conversation.messages[selectCurrentKey(state)];
export const selectCurrentTitle = (state) => {
  const id = state.conversation.currentConversation;
  return id ? state.conversation.conversation.find((item) => item.id === id)?.title ?? 'Conversation' : 'New chat';
};
export const selectCurrentAiMessage = (state) => {
  const latest = state.conversation.aiLatestMessage;
  return latest && latest.conversationId === selectCurrentKey(state) ? latest : null;
};
export const selectHasCurrentAiMessage = (state) => selectCurrentAiMessage(state) !== null;
export const selectIsStreaming = (state) => {
  const status = state.conversation.aiLatestMessage?.status;
  return status === 'pending' || status === 'streaming';
};
/** Is the reply for the conversation on screen still being written? */
export const selectIsCurrentStreaming = (state) => {
  const status = selectCurrentAiMessage(state)?.status;
  return status === 'pending' || status === 'streaming';
};
export const selectCanSend = (state) => !selectIsStreaming(state)
  && (state.conversation.currentConversation === null || selectCurrentMessages(state) !== undefined);
