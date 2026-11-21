import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { sendMessageValidator } from '../validators/conversation.validator.js';
import { getAllConversations, handleMessage, getAllMessagesByConversation } from '../controller/conversation.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Define your conversation routes here

/**
 * @POST 
 * @route /api/v1/conversation
 * @desc handle the user message
 * req.body should contain the user message and conversation ID (conversationId is optional)
 */
router.post("/", requireAuth, sendMessageValidator, validate, asyncHandler(handleMessage));


/**
 * @GET
 * @route /api/v1/conversation
 * @desc get all the conversations of the user
 * req.user should contain the user ID
 */
router.get("/", requireAuth, asyncHandler(getAllConversations));


/**
 * @GET
 * @route /api/v1/conversation/messages/:conversationId
 * @desc get all the messages of a specific conversation
 * req.params should contain the conversation ID
 */
router.get("/messages/:conversationId", requireAuth, asyncHandler(getAllMessagesByConversation));



export default router;