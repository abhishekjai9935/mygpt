# Contributing to MyGPT

Thanks for considering a contribution. MyGPT is a small, focused project —
read this before opening a PR so your change lands smoothly.

## Before you start

- Skim [ARCHITECTURE.md](ARCHITECTURE.md) to see how the pieces fit together.
- For anything beyond a small fix (new feature, behavior change, UI redesign),
  open an issue first to discuss the approach before writing code. It saves
  you from a big PR that goes a different direction than the maintainers want.
- Check open issues and PRs to avoid duplicating work.

## Local setup

```bash
git clone https://github.com/abhishekjai9935/mygpt.git
cd mygpt
npm install
npm run dev
```

Open http://localhost:3000 in a recent **desktop Chrome**. To actually
exercise the AI features locally:

1. `chrome://flags/#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**
2. `chrome://flags/#prompt-api-for-gemini-nano` → **Enabled**
3. Relaunch Chrome, then visit `chrome://components`, find **Optimization
   Guide On Device Model**, and click "Check for update" to download it.

Without this, the app still runs and correctly shows an "unsupported" /
"unavailable" state — you don't need it for UI-only changes.

## Before opening a PR

```bash
npm run lint
npm run build
```

Both must pass clean. `npm run build` also runs the TypeScript check — fix
type errors rather than widening types or adding `any` to silence them.

If your change touches the chat flow, model lifecycle, session retention, or
offline behavior, walk through the relevant cases in the [manual test
checklist](README.md#manual-test-checklist) in a real Chrome build — none of
that is covered by automated tests today.

## Code style

- TypeScript, strict mode. No `any` unless there's genuinely no better option
  (and if so, leave a comment saying why).
- Client-only browser APIs (`window`, `navigator`, `localStorage`,
  `LanguageModel`) must be guarded — this app is server-rendered, and browser
  globals don't exist during that render. See the "Hydration gotchas" section
  in [ARCHITECTURE.md](ARCHITECTURE.md) before touching `lib/useLocalAI.ts`
  or anything that reads browser state on mount — it's easy to reintroduce a
  hydration mismatch here.
- Match the existing component style: small, single-purpose components in
  `components/`, shared logic in `lib/`, Tailwind utility classes (no CSS
  modules or styled-components).
- No new runtime dependencies without a good reason — this app intentionally
  ships with almost no third-party JS, which matters for its offline and
  privacy story. Build-time/dev dependencies are more negotiable.
- Comments explain *why*, not *what*. Skip comments that just restate the
  code.

## Commit messages & PRs

- Keep commits focused; don't bundle unrelated changes.
- PR description: what changed and why, plus how you tested it (screenshots
  welcome for UI changes).
- Be ready to explain any trade-off you made — this project cares about
  keeping the "what's exact vs. approximate vs. unavailable" claims honest,
  so if your change touches a displayed metric, make sure the copy stays
  accurate.

## Reporting bugs / requesting features

Open a GitHub issue with:
- What you expected vs. what happened.
- Chrome version and OS (relevant for anything Prompt-API-related).
- Steps to reproduce.

## Code of conduct

Be respectful and constructive. Disagreements about approach are fine and
expected — personal attacks aren't.
