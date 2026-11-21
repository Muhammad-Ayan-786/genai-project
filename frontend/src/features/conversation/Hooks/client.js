import { store } from '../../../app/store.js';
import { authApi } from '../../auth/Hooks/session.js';
import { sessionCleared } from '../../auth/State/auth.slice.js';
import { createConversationApi } from '../API/conversation.api.js';

/** The one conversation client for the app. It shares the auth client's single-flight refresh. */
export const conversationApi = createConversationApi({
  getAccessToken: () => store.getState().auth.accessToken,
  refresh: () => authApi.refresh(),
  onExpired: (message) => store.dispatch(sessionCleared(message)),
});
