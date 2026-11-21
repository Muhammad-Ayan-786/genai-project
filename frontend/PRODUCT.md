# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Right now: the builder (a student) and the people who review the work (instructor, portfolio viewers).
It is a course and portfolio project, used as a general-purpose AI assistant.

## Product Purpose
Milo (formerly Downbot) is a calm, multi-model generative-AI chat app. A signed-in user starts a conversation,
gets a streamed AI reply rendered as Markdown, and comes back to past conversations from a sidebar.
Success: chatting feels fast, readable and trustworthy, and the code shows clean layering.

## Positioning
"A little less noise. A lot more possibility." A quieter place to think with AI. Multiple models
(Gemini, ChatGPT, Claude) are future direction only; today a single Groq-hosted model answers.

## Capabilities and Constraints
- Auth: register, login, refresh-cookie session, logout, account page.
- Conversations: create on first message (server generates a title), continue, list (newest activity first), load messages.
- Replies stream over SSE (`POST /api/v1/conversation`), read with `fetch` streams.
- AI output is Markdown (GitHub-flavored). Raw HTML from the model must never render.
- No conversation rename/delete, no model picker, no file upload yet. Do not show these as working.

## Brand Commitments
- Name: Milo (wordmark lowercase "milo"; renamed from Downbot on 2026-11-22). Name lives in `src/shared/brand.js`. Logo mark in `Brand.jsx` / `MiloMark.jsx` is temporary until the planned redesign.
- Forest green + sage palette in `src/styles/theme.css`, light and dark via `light-dark()`, following the OS.
- Voice: calm, warm, short. Taglines: "A little less noise. A lot more possibility.", "Your space to think".
- Chat redesign (Nov 2026) keeps this brand; login/register/account visuals are out of scope for it.

## Evidence on Hand
No testimonials, users, metrics or benchmarks exist. Do not invent any.

## Product Principles
1. Reading comes first: AI answers must be comfortable to read at length.
2. Calm over flashy: motion is subtle and always respects reduced-motion.
3. Honest UI: never show controls for features that don't exist yet.
4. Security is not weakened for looks (access token in memory only, no raw HTML).

## Accessibility & Inclusion
Keyboard reachable, visible focus, 44px touch targets, reduced-motion respected, WCAG AA contrast in both themes.
