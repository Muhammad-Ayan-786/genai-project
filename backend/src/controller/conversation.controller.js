import { AppError } from '../utils/AppError.js';
import { generateTitle } from '../services/ai/ai-title.service.js';
import { createConversation, findConversationByIdAndUser, updateLastMessage } from '../DAO/conversation.dao.js';
import model from '../services/ai/main.service.js';
import { createMessage, findMessagesByConversation } from '../DAO/message.dao.js';
import { AIMessage, HumanMessage } from 'langchain';


/**
 * @POST 
 * @route /api/v1/conversation
 * @desc handle the user message
 * req.body should contain the user message and conversation ID (conversationId is optional)
 */
export async function handleMessage(req, res, next) {

    const { content, conversation: conversationId } = req.body;
    const user = req.user

    let conversation = null;

    if (!conversationId) {
        // The title is a nice extra. If Groq fails, keep a default title
        // instead of failing the whole chat request.
        let title = 'New Conversation';
        try {
            ({ title } = await generateTitle(content));
        } catch {
            // Ignore the error and keep the default title.
        }

        conversation = await createConversation({
            user: user._id,
            title,
        });

    } else {
        conversation = await findConversationByIdAndUser(conversationId, user._id);

        if (!conversation) {
            return next(new AppError(404, 'Conversation not found'));
        }
    }


    const messages = (await findMessagesByConversation(conversation._id))
        .map(msg => {
            if (msg.role === 'user') {
                return new HumanMessage(msg.content);
            }
            else if (msg.role === 'assistant') {
                return new AIMessage(msg.content);
            }

            return null;
        }).filter(Boolean);

    messages.push(new HumanMessage(content));

    await createMessage({
        role: 'user',
        content: content,
        conversation: conversation._id,
    });

    // Move this conversation to the top of the sidebar.
    await updateLastMessage(conversation._id);

    const stream = await model.stream(messages)


    // --------------------- Set header for SSE ---------------------
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // --------------------- Send conversation details via SSE ---------------------
    res.write(`data: ${JSON.stringify({
        conversationId: conversation._id,
        title: conversation.title
    })}\n\n`);

    let aiChunk = null;
    let streamFailed = false;

    // Headers are already sent at this point, so errors can't go to errorHandler
    // as JSON anymore. Instead we send the error as one more SSE event.
    try {
        for await (const chunk of stream) {
            if (aiChunk === null) aiChunk = chunk;
            else aiChunk = aiChunk.concat(chunk);

            res.write(`data: ${JSON.stringify({ chunk: chunk.content })}\n\n`);
        }
    } catch (error) {
        streamFailed = true;
        console.error('AI stream failed:', error);
        res.write(`data: ${JSON.stringify({ error: 'The AI failed to respond. Please try again.' })}\n\n`);
    } finally {
        // --------------------- End of SSE ---------------------
        // Runs in both cases (success or error), so the connection always closes.
        res.end();
    }

    // Save the AI answer only if it finished and is not empty.
    // A half answer would confuse the AI next time it reads the history.
    if (!streamFailed && aiChunk?.content) {
        await createMessage({
            role: 'assistant',
            content: aiChunk.content,
            conversation: conversation._id,
        });
    }
}