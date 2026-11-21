# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Downbot** — a multi-model Generative AI chat app, being built on top of a finished
authentication starter. Auth (register/login/refresh/logout/me) is complete and tested.
The **conversation/chat feature is in progress**: the backend `POST /api/v1/conversation`
(SSE streaming) works; tests, list endpoints and the frontend are not built yet.

The design sketch in `00018-genai-project.excalidraw` defines the conversation/message
schemas and the `POST /api/v1/conversation` flow (no `conversation` id → create a new
conversation; otherwise continue it).

## Stack

- npm workspaces monorepo: `backend/`, `frontend/`. Plain **JavaScript ES modules** — no TypeScript. Types are JSDoc.
- Node `>=22.22`.
- **Backend:** Express 5, Mongoose 8 (MongoDB), jsonwebtoken, bcryptjs, express-validator, express-rate-limit, cookie-parser, morgan.
- **Frontend:** React 19, Vite 7, Redux Toolkit, react-router v8, Axios, react-hook-form, react-hot-toast (custom-styled), GSAP + @gsap/react, Tailwind CSS v4, lucide-react, self-hosted fonts (@fontsource).
- **Tests:** backend `node:test` + supertest + mongodb-memory-server; frontend Vitest + Testing Library + jsdom + axios-mock-adapter.

## Commands (run from repo root)

```sh
npm install                 # installs both workspaces
npm run dev                 # backend (node --watch) + frontend (vite on 127.0.0.1:5173) via concurrently
npm run lint                # eslint . (flat config in eslint.config.js)
npm test                    # backend tests then frontend tests
npm run build               # frontend production build -> frontend/dist
npm test -w backend         # backend only (node --test --test-concurrency=1)
npm test -w frontend        # frontend only (vitest run)
npm test -w backend -- test/auth.test.js                    # single backend test file
npm test -w frontend -- src/features/auth/UI/auth.test.jsx  # single frontend test file
```

Backend reads `backend/.env` via `node --env-file=.env`. Required: `MONGODB_URI`,
`ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` (≥32 chars, must differ). `config/env.js`
throws at import time if anything is missing/invalid. Never read, print, or commit `.env`.

### Port
The API runs on **3000** (`PORT` in `backend/.env`, default in `config/env.js`).
`frontend/vite.config.js` proxies `/api` → `http://127.0.0.1:3000`. Keep these in sync.

## Backend architecture (`backend/src/`)

Strict layering: **routes → (validators + validate middleware) → controller → DAO → models**.

- `routes/` — `index.routes.js` mounts `/auth` (with `Cache-Control: no-store`) and `/conversation` under `/api/v1`. Wrap async handlers with `asyncHandler`.
- `controller/` — owns business/auth decisions. Uses `sendSuccess` and throws `AppError`.
- `DAO/` — **the only layer that imports Mongoose models.** Controllers never touch models directly.
- `models/` — `user`, `conversation`, `message`. Mongoose schemas exported alongside models (used for JSDoc `InferSchemaType`).
- `validators/` — express-validator chains; `validate` turns failures into `422` with field errors. Login uses `validateLogin` (generic `401`, to avoid leaking which field was wrong).
- `middleware/` — `requireAuth` (Bearer access JWT → `req.user`), `errorHandler` (central; maps AppError, Mongo 11000, CastError, JWT errors, body-parse errors), `notFound`.
- `utils/` — `AppError(statusCode, message, errors=[])`, `sendSuccess(res, status, message, data)`, `asyncHandler`, `jwt.js`.
- `types/` — JSDoc typedefs only (`export {}`).
- `services/` — empty, **reserved for third-party integrations** → this is where LLM provider clients belong.
- `config/` — `env.js` (validated, frozen `env` object; import config from here, not `process.env`), `db.js` (`connectDB` awaits model index init).

### API response envelope (always)
- Success: `{ success: true, message, data }`
- Error: `{ success: false, message, errors: [{ field, message }], stack? }` (stack only outside production)

### Auth model (don't weaken)
- Access JWT: 15 min, kept **only in Redux memory** (never localStorage/sessionStorage).
- Refresh JWT: 7 days, HTTP-only cookie `refreshToken`, `SameSite=Strict`, path `/api/v1/auth`, `Secure` in production.
- One refresh session per user, rotated via atomic compare-and-swap in `updateRefreshToken`; unique `jti`, distinct issuer/audience per token type.
- Login uses a dummy bcrypt hash for timing equalization. Credential endpoints are rate limited (30 failures / 15 min / IP, in-memory).
- `toPublicUser` is the allowlist for user fields returned in JSON: `id, name, email, createdAt`.
- Body limit 16 KB (`app.js`) — revisit if chat messages/prompts need to be larger.

## Frontend architecture (`frontend/src/`)

- `app/` — `routes.jsx` (data router: `SessionGate` → `GuestRoute` / `ProtectedRoute`), `store.js` (Redux store), `NotFoundPage.jsx`.
- `features/<feature>/` with four layers — **every new feature (e.g. chat) should mirror this:**
  - `API/` — Axios clients. Receives session callbacks (`getAccessToken`, `onSession`, `onExpired`) instead of importing the store. `protectedClient` adds the Bearer header and does single-flight refresh + retry on 401.
  - `State/` — Redux Toolkit slices.
  - `Hooks/` — glue between API and State (form state, validation, orchestration). `Hooks/session.js` creates the shared `authApi` instance.
  - `UI/` — `pages/` and `components/`. **UI never calls Axios or dispatches Redux directly**; it goes through hooks.
- `shared/` — cross-feature building blocks (not tied to one feature):
  - `animations/` — `gsap.js` (registers `useGSAP`; **always import gsap/useGSAP from here**), `motion.js` (motion tokens: eases, durations, stagger + `prefersReducedMotion()`), `useReveal` (staggered fade-up entrance, targets `[data-reveal]` or a selector), `useFloat` (slow decorative drift). Every animation must no-op under reduced motion; jsdom (tests) counts as reduced, so tests never see hidden content. Keep motion subtle.
  - `toast/` — `notify.success|error|info(title, message, { id })` is the **only** way to show a toast; call it from Hooks, not UI. `ToastCard.jsx` is the custom design (GSAP enter/exit + countdown bar), `AppToaster.jsx` is mounted once in `main.jsx` (position `bottom-right`, user's choice). Do **not** call `useToasterStore()` in toast components: in react-hot-toast 2.6 a second subscriber's cleanup unsubscribes the Toaster and freezes all toasts.
- Forms use **react-hook-form** (`useForm` inside the feature hook). `useAuthForm` exposes `field(name)` (spread onto `<FormField>`, which forwards `ref` via React 19 ref-as-prop), `submit`, `pending`, `error`, `fieldErrors`. Server errors → `setError('root.server')` + per-field `setError`.
- All requests use relative `/api/v1/...` URLs through the Vite proxy. **No CORS** is configured, by design (same-origin in production).
- Styling: `src/styles/theme.css` is the **single source of truth** for colors, fonts and shadows. Each token is defined once as `--color-x: light-dark(LIGHT, DARK)`; Tailwind turns it into `bg-x`/`text-x`/etc. Theme follows the OS by default; `document.documentElement.dataset.theme = 'light' | 'dark'` forces one (ready for a future toggle). `src/styles/index.css` holds base styles and component classes (`.button-primary`, `.form-input`, ...). Never hard-code hex colors in components. Full UI redesign (colors/typography/animation) is planned after core features.
- `src/main.jsx` calls `initializeSession()` before render to restore a session from the refresh cookie.

## Current state of the conversation feature (WIP)

- `models/conversation.model.js` — `user`, `title` (default "New conversation"), `lastMessage`; timestamps `createdAt` / `lastUpdate`; index `{ user: 1, lastMessage: -1 }`.
- `models/message.model.js` — `role` ∈ `user | assistant | tool`, `content`, `conversation`; index `{ conversation: 1, createdAt: 1 }`.
- `validators/conversation.validator.js` — `content` (required non-blank string), `conversation` (optional MongoId). The body field is **`conversation`**, not `conversationId`.
- `routes/conversation.routes.js` — `POST /` → `requireAuth, sendMessageValidator, validate, asyncHandler(handleMessage)`.
- `controller/conversation.controller.js` — `handleMessage` works and **streams the reply over SSE** (`text/event-stream`, events are `data: {json}\n\n`):
  - New conversation: `generateTitle` (wrapped in try/catch → falls back to "New Conversation"). Existing one: `findConversationByIdAndUser` → `404` if not owned.
  - Loads history (`findMessagesByConversation`, sorted `createdAt: 1`), maps to LangChain `HumanMessage`/`AIMessage`, appends the new message, saves the user message, then `updateLastMessage`.
  - SSE events: first `{ conversationId, title }`, then `{ chunk }` per piece, `{ error }` if the stream fails midway. `res.end()` in `finally`. The assistant message is saved only if the stream finished and isn't empty.
- `middleware/error.middleware.js` — if `res.headersSent` (e.g. mid-SSE), it logs and calls `next(error)` instead of sending JSON.
- `DAO/conversation.dao.js` — `createConversation`, `findConversationByIdAndUser`, `findConversationsByUser` (sorted `lastMessage: -1`), `updateLastMessage`. `DAO/message.dao.js` — `createMessage`, `findMessagesByConversation`.
- `services/ai/` — LangChain: `ai-title.service.js` (Groq, structured `{ title }` ≤50 chars, user text wrapped in `<message>` tags, truncated to 2000 chars) and `main.service.js` (chat model). Needs `GROQ_API_KEY` in env.
- `requireAuth` must keep loading the user from the DB (`req.user` is a Mongoose doc with `_id`). The JWT payload only has `id`/`email`; using it directly breaks `/me` tests and `user._id` in the conversation controller.
- Missing: conversation backend tests, list-conversations / get-messages endpoints, and the frontend `features/chat/` slice (POST + SSE means `fetch` stream reading, not `EventSource`).
- `AccountPage` mentions AI model names as future direction only — no integrations exist yet.

## Working agreements (for Claude)

- After any significant change (new library, folder, convention, decision, gotcha), update this file, the auto-memory, and claude-mem **without being asked**.
- The user is building the conversation feature themselves. Don't edit their WIP files unless asked.
- Explain things in simple English; the user is learning.

## Conventions

- ESM everywhere (`import`/`export`, include `.js`/`.jsx` extensions in relative imports).
- Style: 2-space indent, single quotes, semicolons, trailing commas in multiline literals (match surrounding code; a few WIP files use double quotes).
- ESLint: unused vars are errors unless they start with uppercase/`_` (vars) or `_` (args). React hooks rules apply under `frontend/src`.
- Add JSDoc to exported backend functions (`@param`, `@returns`, `@throws`) like existing code.
- New backend behavior → add integration tests in `backend/test/` (pattern: set env vars + `MongoMemoryServer` in `before`, then dynamic-import `app.js`).
- Git remote: `origin` → GitHub `Muhammad-Ayan-786/genai-project`, branch `main`. Commit/push only when asked.
