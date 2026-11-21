import { ConversationModel } from '../models/conversation.model.js';

/**
 * @param {{user: string | import('mongoose').Types.ObjectId, title?: string}} input Conversation owner and title.
 * @returns {Promise<import('../types/conversation.js').Conversation>} Persisted conversation.
 */
export async function createConversation(input) {
  return ConversationModel.create(input);
}

/**
 * @param {string | import('mongoose').Types.ObjectId} id Conversation identifier.
 * @param {string | import('mongoose').Types.ObjectId} userId Owner identifier.
 * @returns {Promise<import('../types/conversation.js').Conversation | null>} Owned conversation or null.
 */
export async function findConversationByIdAndUser(id, userId) {
  return ConversationModel.findOne({ _id: id, user: userId });
}

/**
 * @param {string | import('mongoose').Types.ObjectId} userId Owner identifier.
 * @returns {Promise<import('../types/conversation.js').Conversation[]>} List of conversations owned by the user.
 */
export async function findConversationsByUser(userId) {
  // Newest activity first (uses the { user: 1, lastMessage: -1 } index).
  return ConversationModel.find({ user: userId }).sort({ lastMessage: -1 });
}

/**
 * Marks a conversation as active now, so it moves to the top of the sidebar.
 * @param {string | import('mongoose').Types.ObjectId} id Conversation identifier.
 * @returns {Promise<void>}
 */
export async function updateLastMessage(id) {
  await ConversationModel.updateOne({ _id: id }, { lastMessage: new Date() });
}