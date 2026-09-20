# Architecture

How MyGPT is put together, and why some of the less obvious code exists.
Read this before touching `lib/useLocalAI.ts`, `lib/persistence.ts`, or
`lib/theme.ts` — most of the subtlety in this codebase lives there.

## The core idea

```
Browser JavaScript  →  Chrome Prompt API (window.LanguageModel)  →  local model  →  response
```

There is no backend. `app/` has no API routes for chat. Every file under
`components/` and `lib/` runs in the browser and talks directly to
`window.LanguageModel`. Next.js here is used purely as a static/SSR shell —
routing, metadata, and the initial HTML — not as an application server.

This one decision drives most of the "unusual" code in this repo: anything
that reads `window`, `navigator`, or `LanguageModel` has to be written
carefully so it doesn't run during server rendering, and doesn't produce
different output on the server vs. the client's first render.

## State management: `useLocalAI`

`lib/useLocalAI.ts` is the app's single state machine. Every component that
needs model state, chat messages, or session controls takes the return value
of this hook as a prop (see `MyGptApp.tsx`) rather than each maintaining its
own slice of state. There's no context provider — the tree is shallow enough
that prop-drilling one object is simpler than the alternative.

Key pieces:

- **`state: LocalAIState`** — status (`checking` → `unsupported` /
  `unavailable` / `downloadable` / `downloading` / `available` / `error`),
  download progress, context usage/window, last inference time, last error.
- **`messages: ChatMessage[]`** — the visible conversation.
- **`sessionRef`** — the live `LanguageModel` session object. Not React
  state, because it's an imperative handle to an external object, not
  something that should trigger re-renders on its own.
- **`sessionMode` / `idleExpiresAt`** — see "Session retention" below.

`sendMessage` estimates whether a prompt would overflow the context window
(via `session.measureContextUsage`, when supported) *before* sending, so the
UI can warn and ask for confirmation instead of just failing. `runSend` does
the actual work: creates a session lazily on first use (`ensureSession`),
streams the response token-by-token if `promptStreaming` is available, and
falls back to `prompt()` otherwise.

## Session retention (temporary vs. permanent)

Two independent things are tracked in `lib/persistence.ts`:

1. **`sessionMode`**: `"temporary"` (default) or `"permanent"`, stored under
   `mygpt.session.mode`.
2. **`lastInteractionAt`** and the **message list**, stored under
   `mygpt.session.lastInteractionAt` / `mygpt.session.messages`.

On every send, `touchInteraction()` in `useLocalAI.ts` updates
`lastInteractionAt` and — if the mode is temporary — (re)arms a `setTimeout`
for 20 minutes out (`scheduleIdleTimer`). If that timer fires,
`handleIdleExpiry()` destroys the session, clears messages, and wipes
persisted storage. This covers both "idle in an open tab" and "closed the
tab and came back later," because on mount the hook re-derives whether the
stored session is still within the 20-minute window
(`Date.now() - storedLastInteraction <= RETENTION_MS`) before deciding
whether to restore it.

Permanent mode skips the timer entirely and just persists indefinitely,
subject to whatever Chrome's own storage eviction policy does — this app
makes no stronger guarantee than that, and the UI copy says so.

## Hydration gotchas (read this before editing `useLocalAI.ts`)

This app is server-rendered, then hydrated in the browser. Anything that
reads browser-only state (`localStorage`, `navigator.onLine`,
`navigator.deviceMemory`, `Date.now()`-based session hydration) has to
produce the **same output on the server render and the client's first
render**, or React throws a hydration mismatch and re-renders that subtree
from scratch.

We hit this twice while building the app, and both times the fix was the
same shape:

1. Initialize the relevant `useState` with an SSR-safe default (`null`,
   `true`, `"temporary"`, `[]` — whatever the server would render).
2. Read the real browser value inside a `useEffect` (runs post-mount, so it's
   fine to touch `window`/`navigator`/`localStorage` there), and `setState`
   with the real value.

Don't "fix" the resulting `react-hooks/set-state-in-effect` lint warning by
moving the read into a `useState(() => ...)` lazy initializer — that
reintroduces the mismatch, because lazy initializers run on the client's
*first* render (during hydration), before the effect would have run. It's
the exact bug that shipped once already (see git history around
`deviceInfo`/`isOnline` in `useLocalAI.ts`). Only disable the lint rule with
an inline comment explaining why, when the effect-based pattern is
genuinely correct.

The theme system uses a different, complementary technique: an inline
`<script>` in `app/layout.tsx`'s `<head>` sets `data-theme` on `<html>`
*before* React hydrates at all, so there's no flash of the wrong theme. This
is why `<html>` has `suppressHydrationWarning` — that script mutates an
attribute on `<html>` outside of React's control, and we're explicitly
telling React "don't compare this one element's attributes between server
and client." It's scoped to just that element, not the whole tree.

## Theming

`lib/theme.ts` defines `Theme = "system" | "light" | "dark"`. CSS lives in
`app/globals.css`:

```css
:root { /* light values */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* dark values */ }
}

:root[data-theme="dark"] { /* dark values, explicit override */ }
```

No `data-theme` attribute = follow the OS. `data-theme="light"` blocks the
media-query dark rule even if the OS is dark. `data-theme="dark"` applies
unconditionally (it has equal CSS specificity to the media-query rule and
comes later in source order, so it wins). `ThemeToggle.tsx` just flips that
attribute and persists the choice to `localStorage`.

## Offline support

`public/sw.js` is a hand-written service worker (no `next-pwa` or similar) —
stale-while-revalidate for same-origin GET requests, with a small precache
list (`/`, `/offline`, `/how-it-works`, manifest, icon) populated on
`install`. It only registers in production (`ServiceWorkerRegister.tsx`
checks `NODE_ENV`), because Next's dev server's own HMR doesn't play well
with a service worker intercepting requests.

This is entirely separate from the model's own offline behavior: once
Chrome has downloaded the on-device model, `window.LanguageModel` keeps
working without a network connection regardless of what the service worker
does. The service worker only caches the app's static shell so the *page
itself* can reload while offline.

## Security headers

`next.config.ts` sets `Permissions-Policy: language-model=(self)` always,
and a `Content-Security-Policy` (with `connect-src 'self'`, among others)
**only in production** — the dev server needs `eval` for Fast Refresh, which
a strict `script-src` would break. The CSP's `connect-src 'self'` is a
deliberate enforcement mechanism for the "nothing is sent to a server" claim,
not just documentation of it: if a future change accidentally introduced a
`fetch()` to a third party, the CSP would block it in production and show up
as a console error, not just a code review miss.

## Where things live

See the [README's project structure](README.md#project-structure) for the
file-by-file map. The short version: `app/` is routing and shell only,
`components/` is all client-side UI, `lib/` is everything that isn't a React
component — the Prompt API wrapper, the state machine hook, persistence,
theming, and shared types.
