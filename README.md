# MyGPT

Your personal AI, running on your device.

No cloud AI API. No server-side conversation processing. Powered by Chrome's
built-in AI (the `LanguageModel` Prompt API / Gemini Nano).

```
Browser JavaScript  →  Chrome Prompt API  →  local model  →  response
```

Full write-up of the mechanism and its limits: the in-app "How it works"
page (`/how-it-works` on a running instance), source at
[`app/how-it-works/page.tsx`](app/how-it-works/page.tsx).

**Contributing?** See [CONTRIBUTING.md](CONTRIBUTING.md) to get set up, and
[ARCHITECTURE.md](ARCHITECTURE.md) for how the codebase fits together before
you dive in.

## Requirements

- A recent desktop Chrome build with the built-in AI / Prompt API available.
  If `LanguageModel` isn't on `globalThis`, the app shows an "unsupported"
  state instead of crashing — there is no cloud fallback in this build.
- Node.js 20+.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. On first use, click **Download and enable local
AI** — Chrome downloads the on-device model and reports progress; once ready,
prompts run entirely in the browser.

## Project structure

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full breakdown of how these
pieces fit together (state flow, why certain effects exist, hydration
gotchas). Short version:

```
app/
  layout.tsx               root layout, metadata, theme init script, SW registration
  page.tsx                  renders <MyGptApp />
  offline/page.tsx           offline fallback cached by the service worker
  how-it-works/page.tsx       full explanation, limits, and GitHub link
components/
  MyGptApp.tsx               top-level layout (header, chat, settings drawer)
  ChatWindow.tsx              message list, composer, streaming, stop/new/clear
  ChatMessage.tsx, Markdown.tsx  message bubble + rendered markdown responses
  SettingsDrawer.tsx          slide-over panel (push on desktop, overlay on mobile)
  StatusPanel.tsx             transparency dashboard (metrics + tooltips)
  ThemeToggle.tsx             light/dark/system appearance control
  SessionModeToggle.tsx       temporary vs. permanent session control
  DiagnosticsDrawer.tsx       raw developer diagnostics + event log
  InfoSections.tsx            links to /how-it-works, GitHub, attribution
  StatusPill.tsx, OfflineBanner.tsx, DesktopRecommendedBanner.tsx  header/status chrome
  MetricCard.tsx, InfoTooltip.tsx, icons.tsx   shared building blocks
  ServiceWorkerRegister.tsx   registers /sw.js in production only
lib/
  local-ai.ts                thin wrapper over window.LanguageModel
  useLocalAI.ts               the app's state machine (React hook)
  persistence.ts              localStorage-backed session persistence
  theme.ts                    light/dark/system theme helpers + init script
  telemetry.ts                navigator-derived device info
  types.ts, constants.ts      shared types and constants
types/language-model.d.ts     ambient types for the experimental Prompt API
public/sw.js                   app-shell service worker (stale-while-revalidate)
```

## Session retention

Chats are **temporary by default**: if you don't send a message for 20
minutes, the conversation (and the underlying model session) is cleared
automatically — both while the tab stays open and when you come back to it
after being away. The countdown resets on every message you send.

Toggle **Permanent session** (in the sidebar) to keep the chat saved in this
browser's `localStorage` across visits instead. This is still subject to
Chrome's own storage retention — it isn't a guarantee the data survives
forever (e.g. the user clearing site data, or the browser evicting storage
under pressure, will still remove it). Nothing is ever sent to a server
either way; both modes are entirely local to the browser.

## Appearance

Starts by following the OS light/dark preference. The sun/moon button in the
header (`ThemeToggleButton.tsx`) is a simple light/dark switch — click it to
override, which then sticks via `localStorage` until changed again. Applied
via a `data-theme` attribute on `<html>`, set by an inline script in `<head>`
before first paint so there's no flash of the wrong theme (see `lib/theme.ts`).

## What's exact vs. approximate vs. unavailable

| Metric | Status | Source |
|---|---|---|
| Local AI enabled / model status | Exact | `LanguageModel.availability()`, download `monitor` |
| Context used / window / remaining | Exact (session-level) | `session.contextUsage`, `session.contextWindow` |
| Last inference time | Exact (this tab's wall-clock) | `performance.now()` around `prompt()` |
| Network online/offline | Exact (browser-reported) | `navigator.onLine` |
| Device RAM | Approximate, bucketed | `navigator.deviceMemory` (not live free RAM) |
| CPU threads | Approximate, logical count | `navigator.hardwareConcurrency` (not live usage) |
| Exact model file size on disk | Unavailable | Not exposed to webpages — "Managed by Chrome" |
| Exact model/runtime RAM usage | Unavailable | Not exposed to webpages |
| Live system-wide CPU % | Unavailable | Not exposed to webpages |

## Privacy & security

- No server-side AI route; the client talks to `window.LanguageModel` directly.
- No analytics, no third-party scripts.
- `next.config.ts` sends `Permissions-Policy: language-model=(self)` and, in
  production only, a `Content-Security-Policy` with `connect-src 'self'` (the
  CSP is disabled in dev because Next's dev server needs `eval` for Fast
  Refresh).
- **Local Privacy Check** (in settings): a live count of `fetch`/`XHR` calls
  this page has made, from wrapping the real browser APIs
  (`lib/networkMonitor.ts`) — not a hardcoded "0". It never reads request or
  response bodies, only counts calls, and resets on New chat/Clear chat.
  This count includes ordinary same-app navigation (e.g. clicking "How it
  works" — internal `<Link>`s use `prefetch={false}` so it only moves on an
  actual click, not a hover/viewport prefetch), so it's deliberately *not*
  used to decide the "Cloud AI request" line — that one states a fact about
  the code (send/regenerate only ever call `session.prompt()` /
  `promptStreaming()`, never `fetch`/`XHR`) rather than inferring intent
  from the request count. The panel can't see Chrome's own model-download
  traffic or anything outside this page's JavaScript, which it says
  explicitly — it doesn't claim all browser network traffic is zero.

## Offline support

`public/sw.js` caches the app shell (stale-while-revalidate) so the interface
can reload while offline once it's been opened online at least once. This is
separate from model offline support: once Chrome has downloaded the model,
inference itself can continue without a network connection.

Manual test:
1. Open the site online; confirm model status reaches "Available".
2. Send a prompt successfully.
3. Enable DevTools "Offline" (or disconnect Wi-Fi).
4. Send another prompt — it should still work (local inference).
5. Reload the page while offline — the cached shell should load.
6. Start a new chat and confirm it still works offline.

## Manual test checklist

1. Unsupported browser (no `LanguageModel`) → shows the "not available" empty state.
2. Supported browser, model not yet downloaded → "Download required" / enable button.
3. Download in progress → percentage updates live via the `monitor` callback.
4. Model available → status turns green, chat unlocked.
5. Single prompt → response streams in, latency shown under the bubble.
6. Multi-turn chat → context used/window update after each turn.
7. Context nearing the limit → overflow warning offers "Send anyway" or cancel.
8. "New chat" → destroys the session, clears messages and persisted storage.
9. "Stop" mid-stream → aborts cleanly, shown as "Stopped by user."
10. Temporary session, idle 20+ minutes (or reload after 20+ minutes) → chat auto-clears.
11. Permanent session toggled on → chat survives a reload immediately.
12. Offline prompt after the model has downloaded once.
13. Offline reload after the service worker has installed once.
14. Mobile viewport → layout stacks, composer and buttons stay usable.
15. No network requests fire from the app on prompt submission (check the Network tab).
16. Keyboard: Tab through composer/buttons/tooltips; Enter sends, Shift+Enter inserts a newline.
17. "Copy" on the last assistant reply → copies its text, icon briefly swaps to a checkmark.
18. "Try again" on the last assistant reply → discards it and regenerates a new one for the same prompt.
19. Local Privacy Check count stays at 0 through a normal chat (sending prompts, receiving replies); open DevTools → Network → Fetch/XHR, send a prompt, and confirm no request appears there either.
20. Hover (don't click) "How it works" → the request count should not move (prefetch is disabled); actually clicking it does increment the count — that's expected page navigation, not an AI request.

## Naming & trademark note

"MyGPT" borrows the "GPT" term associated with OpenAI/ChatGPT, so this build
takes a few precautions while it stays a limited experiment:

- Branded as **"MyGPT by Ekya Tech"** in the header, page title, and manifest
  — not just "MyGPT" alone.
- A visible disclaimer ("not affiliated with, endorsed by, or a replacement
  for OpenAI or ChatGPT") is shown in the app (sidebar) and in metadata.
- No OpenAI/ChatGPT logos, marks, or "ChatGPT" wording are used anywhere in
  the domain, title, metadata, or UI copy.

This reduces confusion but does **not** eliminate trademark risk by itself.
Before any commercial launch, paid tier, or heavier marketing push: search
Indian and international trademark databases for "GPT"-adjacent marks, and
have an Indian trademark lawyer review the name before filing or launching
commercially.

## Deployment

Static/client-first Next.js app — deploys to Vercel like any other Next.js
project:

```bash
npm run build
```

Then import the repo in Vercel (or run `vercel`), attach whatever domain you
want, and confirm the Prompt API works on the deployed HTTPS URL — Chrome's
`Permissions-Policy` default only allows the top-level page and same-origin
iframes, so avoid embedding the chat in a cross-origin iframe without
explicitly granting it.
