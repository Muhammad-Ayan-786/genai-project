# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Milo** (renamed from Downbot on 2026-11-22) — a multi-model Generative AI chat app, being built on top of a finished
authentication starter. Auth (register/login/refresh/logout/me) is complete and tested.
The **conversation/chat feature works end to end**: backend (`POST` SSE streaming, list
conversations, list messages) and frontend (`features/conversation/`, route `/chat/:conversationId?`).

The design sketch in `genai-project.excalidraw` defines the conversation/message
schemas and the `POST /api/v1/conversation` flow (no `conversation` id → create a new
conversation; otherwise continue it).

## Stack

- npm workspaces monorepo: `backend/`, `frontend/`. Plain **JavaScript ES modules** — no TypeScript. Types are JSDoc.
- Node `>=22.22`.
- **Backend:** Express 5, Mongoose 8 (MongoDB), jsonwebtoken, bcryptjs, express-validator, express-rate-limit, cookie-parser, morgan.
- **Frontend:** React 19, Vite 7, Redux Toolkit, react-router v8, Axios, react-hook-form, react-hot-toast (custom-styled), GSAP (+ ScrollTrigger) + @gsap/react, Tailwind CSS v4, lucide-react, react-markdown + remark-gfm (AI replies), self-hosted fonts (@fontsource: Newsreader Variable serif, Hanken Grotesk, Geist Mono, JetBrains Mono).
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

- `app/` — `routes.jsx` (data router: `SessionGate` → `GuestRoute` / `ProtectedRoute`; `/` is the public **landing page** (`features/landing/`) for guests, signed-in users on `/`, `/login`, `/register` go to `/chat`), `store.js` (Redux store: `auth` + `conversation`), `NotFoundPage.jsx`.
- `features/<feature>/` with four layers — **every new feature (e.g. chat) should mirror this:**
  - `API/` — Axios clients. Receives session callbacks (`getAccessToken`, `onSession`, `onExpired`) instead of importing the store. `protectedClient` adds the Bearer header and does single-flight refresh + retry on 401.
  - `State/` — Redux Toolkit slices.
  - `Hooks/` — glue between API and State (form state, validation, orchestration). `Hooks/session.js` creates the shared `authApi` instance.
  - `UI/` — `pages/` and `components/`. **UI never calls Axios or dispatches Redux directly**; it goes through hooks.
- `shared/` — cross-feature building blocks (not tied to one feature):
  - `animations/` — `gsap.js` (registers `useGSAP`; **always import gsap/useGSAP from here**), `motion.js` (motion tokens: eases, durations, stagger + `prefersReducedMotion()`), `useReveal` (staggered fade-up entrance, targets `[data-reveal]` or a selector), `useFloat` (slow decorative drift). Every animation must no-op under reduced motion; jsdom (tests) counts as reduced, so tests never see hidden content. Keep motion subtle.
  - `toast/` — `notify.success|error|info(title, message, { id })` is the **only** way to show a toast; call it from Hooks, not UI. `ToastCard.jsx` is the custom design (GSAP enter/exit + countdown ring), `AppToaster.jsx` is mounted once in `main.jsx` (position **top-center**, user's request 2026-11-28; was bottom-right). Toasts are a compact pill (mascot icon inside a countdown ring, one short line: title + optional "· message"); keep toast text short, usually title only. Do **not** call `useToasterStore()` in toast components: in react-hot-toast 2.6 a second subscriber's cleanup unsubscribes the Toaster and freezes all toasts.
- Forms use **react-hook-form** (`useForm` inside the feature hook). `useAuthForm` exposes `field(name)` (spread onto `<FormField>`, which forwards `ref` via React 19 ref-as-prop), `submit`, `pending`, `error`, `fieldErrors`. Server errors → `setError('root.server')` + per-field `setError`.
- All requests use relative `/api/v1/...` URLs through the Vite proxy. **No CORS** is configured, by design (same-origin in production).
- **UI redesign "Milo Honey" (Nov 2026, in progress, one page at a time).** Designs live in Google Stitch project `3190999616478995679` (light + dark of every page). Done: theme + fonts + theme toggle + custom scrollbar + **Landing page** + **Login/Register** (`AuthShowcase`: looping GSAP demo conversation, drifting prompt chips with pointer parallax, tilt card). + **Chat** (sidebar expanded 272px ↔ 68px icon rail, GSAP tweens the `--sidebar-w` CSS var while the two layouts cross-fade; choice in localStorage `milo-sidebar`; `Hooks/useSidebar.js` has `useSidebarCollapsed` + `useIsDesktop`; mobile stays a drawer). + **Account page** (`/account`: "Back to chats" via `Hooks/useGoBack.js` = `navigate(-1)` or `/chat` fallback; profile, Appearance theme picker, Session card with Sign out; the old "On the horizon: Gemini/ChatGPT/Claude" card was removed as not-yet-real). Next: NotFound/SessionGate screens (still old token aliases). Palette: ivory/roast ground, espresso/cream ink, brand yellow: light **"saffron" `#f2b233`** (2026-11-28; user rejected pale `#e6c77c` and `#f4bf4f` as too lemony/plain, wants "premium, bright, warm, not hurting the eyes"); `honey-soft` is now a see-through saffron wash (focus rings/selection only); **your chat bubbles use the `bubble-sun` utility** (rich saffron gradient by day like the Log in button, roast in dark), never a pale cream/lemon fill; dark brand `#e9cf86`. Primary buttons use the `btn-sun` Tailwind `@utility` (gradient `--color-primary-top` → `--color-primary-bottom` + top highlight + warm under-glow) with dark text in both themes, rare **clay** accent. Italic accent words use `<em className="accent">` (ink in light, gold in dark, with a thin saffron underline that `splitReveal` draws in); **keep italics rare** (hero, closing, auth title, account, chat greeting only). The user disliked dark-gold italic text.
- **Nothing moves on hover** (user request 2026-11-28): no magnetic buttons, no hover lift/scale/rotate, no nudging arrows. Hover = color/border/shadow/filter only. `btn-sun` must not transition `transform` (it fought GSAP).
- Landing: floating pill nav (`LandingNav`: `md:grid-cols-[1fr_auto_1fr]` with symmetric padding so the links sit exactly in the centre; section links from `features/landing/sections.js` with a GSAP-sliding marker via `Hooks/useActiveSection.js`, saffron scroll-progress line), `LandingFooter` (about, Explore/Account links, Appearance switch, back to top, giant wordmark the mascot peeks over). Feature cards use `.spotlight` = saffron edge light + pearly sheen (not a gold blob). The "Why Milo" statement is fully lit once the paragraph is on screen.
- **GSAP is expected on everything** (user request): `shared/animations/splitReveal.js` (SplitText line-mask headline reveal), `useGSAP` + `prefersReducedMotion()` guard in components, `motion.ease.reveal` (expo.out), scroll scrubs/parallax via ScrollTrigger, pointer `quickTo`. Never let GSAP and a CSS animation share `transform` on one element: nest wrappers (see landing Hero `sky` → `sun` → `.sun-glow`). Chrome automation tabs run rAF at ~2fps, so animations look frozen in screenshots; that's not a bug.
- Scrollbars: global `::-webkit-scrollbar` pill in `index.css` (Firefox gets `scrollbar-color` via `@supports not selector(::-webkit-scrollbar)`; don't set `scrollbar-color` elsewhere or Chromium drops the webkit styling). Newsreader light serif headlines with one *italic* word in `text-honey-deep`; Hanken Grotesk UI; Geist Mono `.label`s. Soft shadows (`--shadow-soft`/`--shadow-lift`), hairlines, pill buttons (`.btn-primary`, `.btn-ghost`, `.btn-sm`), `.sun-glow`, `.grain`, `.stream-caret`. **Only show features that exist or will be built** (no pricing, social login, uploads, fake stats). Old token names (`forest`, `shell`, `mint`...) are temporary aliases in theme.css until their screens are redesigned.
- Theme switching: `shared/theme/` (`theme.js`, `useTheme`, `ThemeToggle`). Choice saved in localStorage `milo-theme` (display preference only), applied pre-paint by an inline script in `index.html`. `color-scheme` on any element forces its subtree (used by the landing light/dark previews). **Logo ("the mascot", 2026-11-28):** the user's favourite first mark (a dome with a sharp bottom-left speech-bubble corner and two round-topped tunnels cut up through the base, which make a lowercase "m") made glossy (radial gold gradient + shade + top-left shine) with two blinking espresso eyes above the tunnels, so the "m" reads as a little character on three legs. Rejected along the way: the bloom flower and a plain speech-bubble body ("not WOW"). Same colors in both themes (`--color-mascot-*` tokens). Geometry in `shared/ui/logoGeometry.js`, component `shared/ui/Logo.jsx` (`LogoMark` props: `animate` = pop-in + blink, `alive` = blinks every few seconds (only a few hero places: nav wordmark, hero, closing, footer, empty chat), `thinking` = eyes look around + bob (chat avatar while streaming)). Hovering the mark or a `.mascot-host` parent makes it blink (CSS). Static copies generated from the geometry: `public/favicon.svg` and `public/brand/` (`milo-mark.svg`, one-color `-ink`/`-cream` with tunnels + eyes cut out, `milo-app-icon.svg`). Keep them in sync. Chat avatar `MiloMark` = the mascot with `thinking` while Milo works. To screenshot scrolled sections headlessly, drive Chrome over the DevTools protocol (`--remote-debugging-port` + Node 22 global WebSocket: `Runtime.evaluate` to scroll, `Page.captureScreenshot`). To compare design options, render a scratch HTML page and screenshot it with headless Chrome (`chrome --headless=new --screenshot`) when the Chrome extension isn't connected.
- ScrollTrigger + SplitText are only registered when `window.matchMedia` exists (jsdom lacks it). `useReveal({ onScroll: true })` reveals on scroll.
- Styling: `src/styles/theme.css` is the **single source of truth** for colors, fonts and shadows. Each token is defined once as `--color-x: light-dark(LIGHT, DARK)`; Tailwind turns it into `bg-x`/`text-x`/etc. Theme follows the OS by default; `document.documentElement.dataset.theme = 'light' | 'dark'` forces one (ready for a future toggle). `src/styles/index.css` holds base styles and component classes (`.button-primary`, `.form-input`, ...). Never hard-code hex colors in components. 
- Chat look: Milo's answers in the Newsreader serif (`.markdown` in `index.css`, serif headings, clay list markers, honey links/caret), your messages in `bg-honey-soft` bubbles, no bubble for Milo (sun dot + `MILO` label).
- **App name lives in one place per side:** `frontend/src/shared/brand.js` (`BRAND.name` "Milo", `BRAND.wordmark` "milo") and `backend/src/config/app.js` (`APP_NAME`, `APP_ID`). Never hard-code the name. Changing `APP_ID` changes the JWT issuer/audience (`milo`, `milo:access`, `milo:refresh`) and signs everyone out once. Workspace packages are `milo`, `@milo/backend`, `@milo/frontend`.
- The MongoDB database is named `milo` (the user switched their `.env` from `downbot` on 2026-11-22; the old DB was empty).
- `src/main.jsx` calls `initializeSession()` before render to restore a session from the refresh cookie.

## Current state of the conversation feature (WIP)

- `models/conversation.model.js` — `user`, `title` (default "New conversation"), `lastMessage`; timestamps `createdAt` / `lastUpdate`; index `{ user: 1, lastMessage: -1 }`.
- `models/message.model.js` — `role` ∈ `user | assistant | tool`, `content`, `conversation`; index `{ conversation: 1, createdAt: 1 }`.
- `validators/conversation.validator.js` — `sendMessageValidator`: `content` (required non-blank string), `conversation` (optional MongoId); the body field is **`conversation`**, not `conversationId`. `conversationIdParamValidator`: URL param `:conversationId` must be a MongoId.
- `routes/conversation.routes.js` — `POST /` → `requireAuth, sendMessageValidator, validate, asyncHandler(handleMessage)`.
- `controller/conversation.controller.js` — `handleMessage` works and **streams the reply over SSE** (`text/event-stream`, events are `data: {json}\n\n`):
  - New conversation: `generateTitle` (wrapped in try/catch → falls back to "New Conversation"). Existing one: `findConversationByIdAndUser` → `404` if not owned.
  - Loads history (`findMessagesByConversation`, sorted `createdAt: 1`), maps to LangChain `HumanMessage`/`AIMessage`, appends the new message, saves the user message, then `updateLastMessage`.
  - SSE events: first `{ conversationId, title }`, then `{ chunk }` per piece, `{ error }` if the stream fails midway. `res.end()` in `finally`. The assistant message is saved only if the stream finished and isn't empty.
- `middleware/error.middleware.js` — if `res.headersSent` (e.g. mid-SSE), it logs and calls `next(error)` instead of sending JSON.
- `DAO/conversation.dao.js` — `createConversation`, `findConversationByIdAndUser`, `findConversationsByUser` (sorted `lastMessage: -1`), `updateLastMessage`. `DAO/message.dao.js` — `createMessage`, `findMessagesByConversation`.
- `services/ai/` — LangChain: `ai-title.service.js` (Groq, structured `{ title }` ≤50 chars, user text wrapped in `<message>` tags, truncated to 2000 chars) and `main.service.js` (chat model). Needs `GROQ_API_KEY` in env.
- `requireAuth` must keep loading the user from the DB (`req.user` is a Mongoose doc with `_id`). The JWT payload only has `id`/`email`; using it directly breaks `/me` tests and `user._id` in the conversation controller.
- `GET /` → `getAllConversations` (user's conversations, newest `lastMessage` first). `GET /messages/:conversationId` → `getAllMessagesByConversation` (ownership-checked, `404` if not owned/missing; malformed id → `422` via `conversationIdParamValidator` + `validate`). Both `requireAuth` + `asyncHandler`.
- Tests: `backend/test/conversation.test.js` covers the two GET endpoints (sets a fake `GROQ_API_KEY`; never calls Groq). The streaming POST is not tested yet (would need a mocked model).
- Missing: backend POST/SSE tests (would need a mocked model).

### Frontend conversation feature (`frontend/src/features/conversation/`)
- `API/conversation.api.js` — `fetch`-based client (streaming needs `fetch`, not Axios/EventSource). Shares auth's single-flight `refresh`, retries once on 401. `readServerSentEvents` buffers events split across chunks. A mid-stream `{ error }` event makes `send` reject. Conversations normalize to `{ id, title, createdAt, lastMessage }`.
- `State/conversation.slice.js` — `conversation` (sidebar list sorted by `lastMessage`), `currentConversation`, `messages` per id (`__new__` key until the server assigns an id), `aiLatestMessage` (the one streaming reply, kept apart so tokens only re-render that bubble). Every stream action carries a `requestId`; stale ones are ignored. `aiMessageStopped` keeps partial text (`stopped: true`). Reset on `sessionCleared`.
- `Hooks/` — `client.js` (API instance), `useConversation.js` (thunks `loadConversations` / `loadMessages` / `sendMessage` / `stopReply`, `groupByRecency`, list + messages hooks), `useChat.js` (URL ↔ store sync in `useChatRoute`, composer, copy, account, greeting). Leaving the chat page stops the stream.
- `UI/` — `pages/ChatPage.jsx`; components `ConversationSidebar` (expanded panel + rail; the hidden one is `inert` + `aria-hidden`), `ChatHeader` (model name hard-coded to match `main.service.js`), `MessageThread` (skeleton, error, empty state with greeting + suggestion pills, thread; GSAP: opening a chat staggers the last 6 messages, a new message glides in), `Composer` (send ↔ stop with a spin-pop), `MarkdownMessage` (GFM, no raw HTML, dark code blocks with copy), `MiloMark` (honey sun dot; `thinking` = `.sun-ripple`), `CopyButton` (`tone="code"` for code headers).
- Tests: `API/conversation.api.test.js`, `UI/chat.test.jsx` (mock `Hooks/client.js`). `auth.test.jsx` also mocks the conversation client because login now lands on `/chat`.
- Gotcha: on Windows `npm test -w frontend` can fail with "Vitest failed to find the current suite" (drive-letter casing of the cwd). Run `npx vitest run` inside `frontend/` instead.
- Production bundle is ~745 KB because of react-markdown; lazy-loading `ChatPage` would split it if needed.
- `AccountPage` mentions AI model names as future direction only — no integrations exist yet.

## Working agreements (for Claude)

- After any significant change (new library, folder, convention, decision, gotcha), update this file, the auto-memory, and claude-mem **without being asked**.
- The user builds the backend conversation feature themselves; don't edit their backend WIP files unless asked. The frontend conversation feature was built by Claude on request (Nov 2026).
- Explain things in simple English; the user is learning.

## Conventions

- ESM everywhere (`import`/`export`, include `.js`/`.jsx` extensions in relative imports).
- Style: 2-space indent, single quotes, semicolons, trailing commas in multiline literals (match surrounding code; a few WIP files use double quotes).
- ESLint: unused vars are errors unless they start with uppercase/`_` (vars) or `_` (args). React hooks rules apply under `frontend/src`.
- Add JSDoc to exported backend functions (`@param`, `@returns`, `@throws`) like existing code.
- New backend behavior → add integration tests in `backend/test/` (pattern: set env vars + `MongoMemoryServer` in `before`, then dynamic-import `app.js`).
- Git remote: `origin` → GitHub `Muhammad-Ayan-786/genai-project`, branch `main`. Commit/push only when asked.
