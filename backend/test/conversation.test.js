import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { after, before, test } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

let database;
let app;
let disconnectDB;
let conversationDao;
let messageDao;
let sequence = 0;
const path = '/api/v1/conversation';

before(async () => {
  database = await MongoMemoryServer.create();
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = database.getUri('downbot_conversation_test');
  process.env.ACCESS_TOKEN_SECRET = randomBytes(48).toString('hex');
  process.env.REFRESH_TOKEN_SECRET = randomBytes(48).toString('hex');
  // Fake key: these tests never call Groq, they only read from the database.
  process.env.GROQ_API_KEY = 'test-groq-key';
  ({ default: app } = await import('../src/app.js'));
  const db = await import('../src/config/db.js');
  disconnectDB = db.disconnectDB;
  await db.connectDB();
  conversationDao = await import('../src/DAO/conversation.dao.js');
  messageDao = await import('../src/DAO/message.dao.js');
});

after(async () => {
  if (disconnectDB) await disconnectDB();
  if (database) await database.stop();
});

/** Registers a fresh user and returns their id and access token. */
async function signUp() {
  const response = await request(app).post('/api/v1/auth/register').send({
    name: 'Chat Tester',
    email: `chatter${++sequence}@example.com`,
    password: 'a-valid-password1',
  }).expect(201);
  return { id: response.body.data.user.id, token: response.body.data.accessToken };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

test('conversation list and messages require authentication', async () => {
  await request(app).get(path).expect(401);
  await request(app).get(`${path}/messages/507f1f77bcf86cd799439011`).expect(401);
});

test('lists only the user\'s own conversations, most recent activity first', async () => {
  const alice = await signUp();
  const bob = await signUp();

  const older = await conversationDao.createConversation({ user: alice.id, title: 'Older Chat' });
  const newer = await conversationDao.createConversation({ user: alice.id, title: 'Newer Chat' });
  await conversationDao.createConversation({ user: bob.id, title: 'Bob Chat' });

  await conversationDao.updateLastMessage(older._id);
  await new Promise((resolve) => setTimeout(resolve, 5));
  await conversationDao.updateLastMessage(newer._id);

  const response = await request(app).get(path).set(auth(alice.token)).expect(200);
  assert.equal(response.body.success, true);
  const titles = response.body.data.conversations.map((c) => c.title);
  assert.deepEqual(titles, ['Newer Chat', 'Older Chat']);
});

test('a user with no conversations gets an empty list', async () => {
  const user = await signUp();
  const response = await request(app).get(path).set(auth(user.token)).expect(200);
  assert.deepEqual(response.body.data.conversations, []);
});

test('returns a conversation\'s messages oldest first', async () => {
  const user = await signUp();
  const conversation = await conversationDao.createConversation({ user: user.id });
  await messageDao.createMessage({ role: 'user', content: 'Hello', conversation: conversation._id });
  await messageDao.createMessage({ role: 'assistant', content: 'Hi there', conversation: conversation._id });
  await messageDao.createMessage({ role: 'user', content: 'Thanks', conversation: conversation._id });

  const response = await request(app)
    .get(`${path}/messages/${conversation._id}`)
    .set(auth(user.token))
    .expect(200);
  assert.equal(response.body.success, true);
  const messages = response.body.data.messages;
  assert.deepEqual(messages.map((m) => m.content), ['Hello', 'Hi there', 'Thanks']);
  assert.deepEqual(messages.map((m) => m.role), ['user', 'assistant', 'user']);
});

test('cannot read messages of another user\'s conversation', async () => {
  const owner = await signUp();
  const stranger = await signUp();
  const conversation = await conversationDao.createConversation({ user: owner.id });
  await messageDao.createMessage({ role: 'user', content: 'Private', conversation: conversation._id });

  const response = await request(app)
    .get(`${path}/messages/${conversation._id}`)
    .set(auth(stranger.token))
    .expect(404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, 'Conversation not found');
});

test('unknown or malformed conversation ids fail cleanly', async () => {
  const user = await signUp();
  await request(app)
    .get(`${path}/messages/507f1f77bcf86cd799439011`)
    .set(auth(user.token))
    .expect(404);
  const response = await request(app)
    .get(`${path}/messages/not-an-id`)
    .set(auth(user.token))
    .expect(422);
  assert.equal(response.body.success, false);
  assert.deepEqual(response.body.errors, [
    { field: 'conversationId', message: 'Conversation must be a valid id' },
  ]);
});
