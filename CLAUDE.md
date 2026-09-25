# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Wordsly web UI — Next.js 16 (App Router) + React 19 + TypeScript strict. Talks only to the api-gateway (`NEXT_PUBLIC_API_URL`, default http://localhost:3000). The learners are non-native English speakers: UI copy must be short, friendly, motivating, simple verbs ("Practice", "Try again"), never shaming mistakes.

## Commands

```bash
npm run dev      # dev server on port 4000
npm run build    # production build (also the typecheck gate)
npm run lint     # eslint
npx tsc --noEmit # typecheck only
```

There are no tests in this repo.

## State management — three systems, don't mix them up

- **TanStack React Query** (`queries/*`) — ALL server data. Both queries AND mutations live in `queries/*.query.ts` (one file per domain); mutations carry their own `onSuccess` cache invalidation, so callers never invalidate manually. Global defaults in `lib/queryClient.ts` set `staleTime: 60s`. Query keys come from the central factory in **`lib/query-keys.ts`** (`queryKeys.<domain>.…`) — never hand-build a key array. Each domain exposes an `all` root for blanket invalidation; id arrays are sorted inside the factory so keys don't fragment.
- **Redux Toolkit** (`store/`) — only auth/user profile and the global loading overlay.
- **nuqs** — URL search params as state (practice session params, course search, word selection).

## API layer

`lib/axios.ts` is the single axios instance: injects the Bearer token from localStorage, and its response interceptor does 401 → refresh-token → retry with a queue that dedupes concurrent refreshes (supports cookie and body refresh delivery modes). Its `request<T>(fn, options?)` helper unwraps `response.data` and normalizes errors; pass `{ notFoundAsNull: true }` for endpoints where a 404 means "no result" (resolves to `null` instead of throwing). API functions live in `apis/*.api.ts` (one file per domain), consumed only through React Query hooks in `queries/`. Multi-argument endpoints/queries take a single **options object** (e.g. `getMyCourses({ itemsPerPage, currentPage, … })`), not long positional lists.

## The practice engine (the core of the app)

Flow: course page builds a URL via `lib/practice-session.ts` → `app/learn/practice/page.tsx` fetches words + progress and builds a plan (`hooks/usePracticeSessionPlan.hook.ts`, `lib/word-progress-stage.ts`) → `components/features/vocabulary/vocabulary-practice.tsx` runs the session.

Rules that are easy to break — understand before touching:

- **Mode selection is pedagogy-driven** (`lib/learning-pedagogy.ts`): new words get multiple interleaved rounds (recognition round 1, production later); leech words become flashcards. Answer quality (0–5 scale, `lib/answer-quality.ts`) is derived from correctness + hints + response time and maps to FSRS grades on the backend.
- **Embedded mode** (`embedded` prop, used by Wordsly Path lessons): no summary screen and no difficult-word flag; `onFinished` fires after `onSubmitResults`. `submittedRef` stops the unmount flush from submitting a finished session a second time, which matters when the host unmounts the engine in the same update that finished it.
- **Wrong answers re-queue the word until correct**, but session results merge **worst-attempt-wins** (`mergeWorstResult` in `vocabulary-practice.tsx`): a word's recorded quality is its lowest across all appearances. Never switch this back to last-write-wins — accuracy inflates to 100% and failed words sync to FSRS as remembered.
- **The daily goal is recorded by the persistence hook, not the engine.** `finalizeSession` still moves the streak optimistically with `recordPracticeWordsLocally`, but the server call runs after the answers save, from the `countedWordsByDate` the bulk-sync returns — a word counts toward the goal at most once a day, and only the server knows which of this session's words were already counted. The synced row comes back to the summary as the `syncedHabit` prop.
- **Persistence is optimistic + offline-safe** (`hooks/usePracticeSessionPersistence.hook.ts`): React Query cache is updated optimistically, the summary shows immediately, and the bulk save runs in the background; failures queue to localStorage (`lib/practice-pending-saves.ts`) and flush on next mount/online.
- Keyboard shortcuts (1–4 flashcard grades, a–d choices, Enter) are wired in the engine with a visible legend (`practice-shortcuts-hint.tsx`) — keep them working.

## Offline mode

Practice is the core loop and has to work with no connection — `lib/offline/*` owns that. The rules below are easy to break by accident:

- **Gate on data, never on fetch outcome.** Offline, a query with restored cache data reports `isError: true` *and* usable `data`. Every page gate must therefore be `!data && isFetching` for the spinner and `!data` for the empty state. `isLoading || isError` gates are what made the app unusable offline.
- **Persistence is an allowlist** (`lib/offline/persist-allowlist.ts`). Everything on disk is plaintext IndexedDB, so a query is *not* persisted unless it is opted in. Never persist tokens, dictionary lookups, reports, or XP. The cache is keyed `rq:<userLoginId>` and expires with the auth grace window.
- **Offline auth is a bounded grace period, not a bypass** (`lib/offline/auth-session.ts`, `hooks/useAuthSession.hook.ts`). A *network* failure may fall back to the cached profile for 7 days; a 401 never can. Only `online-verified` — a live 200 this session — may send data off the device. `canSync` is that gate; do not weaken it.
- **Writes go through the durable queue** (`lib/offline/sync-queue.ts` + `sync-flush.ts`), scoped per user, with a `clientRequestId` minted before the first attempt so a retry after a lost response cannot double-apply XP. Records are never silently dropped: permanent failures surface for retry/discard, and a signed-out account's work is *quarantined*, not deleted. `OfflineBootstrap` owns every flush trigger (reconnect, focus, service-worker wake-up, interval).
- **Only practice answers, daily habit and difficult-word flags are queued.** Every other write (course/word CRUD, preferences, goal changes) fails fast with "can't save while offline".
- **Answers carry `reviewedAt`,** stamped when the grade is given, so the backend schedules from when the learner answered rather than when the batch synced.
- **Never present local estimates as settled.** XP, streaks and offline-derived due counts are labelled provisional/"offline copy"; `selectDueWordIdsOffline` deliberately returns no `pacing` because there is no honest local approximation.
- **The service worker never caches the gateway.** The Cache API keys on URL and ignores `Authorization`, so caching authenticated JSON there leaks across accounts on a shared device (this was a real bug — see the `cross-origin` cleanup in `app/sw.ts`). It caches word media and the app shell only, and it never posts answers itself (no token access).
- Offline behaviour lives in the production build only (`next.config.ts` disables Serwist in dev), so test it with `npm run build && npm start`, not `npm run dev`.

## Cold starts (free-tier hosting)

The backend is suspended when idle, so the first load after a quiet spell hits
instances that do not exist yet and takes 30–60s to boot. `lib/service-warmup.ts`
owns this; the rules mirror offline mode's and are just as easy to break:

- **The browser nudges the services directly, the gateway reports readiness.**
  `NEXT_PUBLIC_BOOTSTRAP_SERVICE_URLS` lists the services' own public URLs, and a
  wake fires one opaque `no-cors` GET at each `/health` *without awaiting them*,
  so all four containers boot at once. Left to the gateway's `/wake` alone, its
  own cold start has to finish before it can even begin waking the three behind
  it — two boots end to end. The opaque response is unreadable by design (the
  services send no CORS headers for this origin); `/wake` remains the only thing
  that reports whether they are actually up.
- **A wake never blocks anything.** It is only an external call that starts the
  services booting; no request waits on it (there is no gate in `lib/axios.ts`).
  Gating the app on it meant one broken service kept every page on "Loading…".
  Requests on a booting instance are carried by the platform holding the
  connection and the cold-start query retry. One wake runs at a time, a partial
  answer (some services awake) ends it without retrying, and `markPossiblyCold`
  is ignored for `REWAKE_COOLDOWN_MS` after a wake so a broken service's 502s
  cannot start one after another.
- **Cold is not offline.** A failure *with* an HTTP status (502/503/504/408) means
  the platform answered while booting: `isColdStartError` in `lib/cold-start.ts`.
  A failure with *no* response is still the offline signal and must stay that way
  — never widen the cold-start check to cover it, or a learner with no connection
  sits through a retry storm instead of dropping to cached data.
- **`retry` in `lib/queryClient.ts` is for cold starts only.** 4 attempts,
  exponential backoff, and nothing else retries: a 4xx, a real 500 and an offline
  failure all still fail on the first attempt.
- **`ServiceHealthMonitor` owns every wake trigger** (boot, tab becoming visible
  after `isLikelyCold()`, and a 10-minute keep-alive ping while the tab is
  visible — under the ~15-minute suspend window). A hidden tab deliberately beats
  nothing. The keep-alive is the cheap `/health` ping, never a wake.
- `WakingBanner` names the wait for the learner; it holds back 2.5s so a warm
  load never flashes it.

## Wordsly Path

A public CEFR curriculum served by curriculum-service (tracker: `../../docs/wordsly-path/PROGRESS.md`). Routes live under `app/path/` (`/path` map, `/path/unit/[unitId]`, `/path/lesson/[lessonId]` player, `/path/checkpoint/[unitId]` unit test, `/path/review`), components in `components/features/path/`, data in `apis/path.api.ts` + `queries/path.query.ts` (keys under `queryKeys.path`), response types in `types/path/path.type.ts` (copied from the backend; keep them in step), pure helpers in `lib/path/path-tree.ts`.

- `GET /path` 404s until something is published: the API returns `null` and the page shows "on its way". Unit and lesson reads 403 while locked; the unit page tells locked (403) from missing (404) through `ApiError.status`.
- Progress writes (`enroll`, `complete`, checkpoint submit) return the new `me`: write it into the cache, then invalidate the rest of `path` (units carry lock state).
- `path.tree`, `path.me`, `path.unit` and `path.lesson` are on the offline persist allowlist.
- Content strings ending in `Vi` are Vietnamese (`titleVi`, `canDo`, `noteVi`…); the UI chrome stays English like the rest of the app.
- The lesson player (`components/features/path/lesson-player/`) runs `lesson.steps` in order; each step component calls `onDone` and is keyed by step id so its state resets. `playableSteps` resolves item ids against the lesson and drops empty steps; advancing is keyed to the step index, so a step that reports done twice can't skip the next one. The summary records the completion once, reusing one `clientRequestId` for retries. Sentences use browser TTS (`lib/path/speech.ts`); `EXPLAIN.bodyVi` renders through `MiniMarkdown` (React nodes, never HTML). Quiz grading is `lib/path/quiz.ts`.
- The question views in `lesson-player/quiz-questions.tsx` report the raw response (option index, typed text, words in order); the lesson quiz grades it with `lib/path/quiz.ts`, the checkpoint doesn't. The checkpoint (`components/features/path/checkpoint/`) has no answers on the client: it collects one response per question, submits once with the `releaseId` it was served (409 → reload the test) and one `clientRequestId` per attempt, and shows the server's results. The checkpoint query is online only (not persisted, `gcTime: 0`) and is left out of the submit's invalidation so the results screen keeps its questions.
- PRACTICE and WARMUP embed the practice engine (`VocabularyPractice` with `embedded`, `modes`, `introSeenWordIds`, `onFinished`) through `lib/path/item-to-word.ts`: only LEXICAL and PHRASE items are drilled, new items get 2 interleaved rounds, and `usePracticeSessionPersistence({ answerSource: 'path', celebrate: false })` stamps `source: 'path'` on every answer. WARMUP reviews due Path items (`due-word-ids` with `source: 'path'`, then `POST /path/items/hydrate`) and skips itself when nothing is due or offline.
- `/path/review` (`components/features/path/review/`) runs one session of due Path items (`PATH_REVIEW_SESSION_SIZE`, still capped by the shared `dailyReviewLimit`) through the same `PracticeStep`, then its own summary. It keeps the first query result as the session so a refetch can't swap items under the engine; "Review more" removes the query and remounts. Online only. The Review buttons (hero, `/learn` card) read `usePathDueCountQuery` (ids only, no hydrate), which the practice save invalidates.
- On mobile, Path took Manage's place in the bottom tab bar; Manage is still in the command palette (the header menu button).

## Design system ("Aurora")

All color comes from OKLCH CSS variables in `app/globals.css` (`:root` and `.dark`) — never hardcode colors in components. Gradients, mesh backgrounds, and glows derive from `--brand-*` via relative color syntax, so swapping the palette re-themes the app (how-to in `COLORS.md`, written in Vietnamese). Utility classes to reuse: `.glass-surface`, `.glow-primary`, `.text-gradient-brand`, `.gradient-hero`, `.gradient-brand/-accent/-warm/-fun`, `.mesh-page-bg`, `.shadow-pressable` (3D buttons). Respect `prefers-reduced-motion` (existing utilities already do; use motion's `useReducedMotion` for JS-driven animation).

## Component conventions (from .cursorrules — reusability is the top priority)

- `components/ui` = base primitives (shadcn/ui, new-york style) · `components/common` = shared app-level · `components/features/<domain>` = feature components · `hooks/` = reusable hooks · `lib/` = utilities.
- Pages/route files compose components; no business logic or copy-pasted JSX in pages. Before writing a new component, check if one exists; extend via props/variants (cva) rather than duplicating.
- Reusable pieces to prefer over re-rolling: `components/common/word-pill.tsx` (the `bg-primary/10` part-of-speech / count pill), `components/common/form-dialog.tsx` (Dialog + form + Cancel/Submit scaffold for CRUD dialogs). Manage form dialogs use **react-hook-form + zod** (schemas in `lib/schemas/`), not raw `useState` form state.
- The practice exercise modes live in `components/features/vocabulary/modes/` (`flashcard`, `context`, `listening`, and a shared `choice-mode` for cloze + word-bank); `vocabulary-practice.tsx` orchestrates state and renders them.
- Path alias `@/*` → repo root. Use `cn()` for class merging.

## Gotchas

- `next.config.ts` sets `images.unoptimized: true` — `next/image` gives layout benefits only.
- `additionalPrecacheEntries` in `next.config.ts` **replaces** Serwist's own glob of `public/`, so that list rebuilds the public-file entries by hand. Dropping them silently un-precaches the icons.
- Auth is client-side (`AuthGuard` component); there is no server-side route protection.
- Heavy chart components on the progress page are loaded with `next/dynamic` (`ssr: false`) — keep new recharts usage code-split.
