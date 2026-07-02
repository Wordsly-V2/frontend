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

- **TanStack React Query** (`queries/*`, hooks in `hooks/*`) — ALL server data. Global defaults in `lib/queryClient.ts` set `staleTime: 60s`; query keys that contain id arrays must use a **sorted copy** of the array or the cache fragments.
- **Redux Toolkit** (`store/`) — only auth/user profile and the global loading overlay.
- **nuqs** — URL search params as state (practice session params, course search, word selection).

## API layer

`lib/axios.ts` is the single axios instance: injects the Bearer token from localStorage, and its response interceptor does 401 → refresh-token → retry with a queue that dedupes concurrent refreshes (supports cookie and body refresh delivery modes). API functions live in `apis/*.api.ts` (one file per domain), consumed only through React Query hooks in `queries/`.

## The practice engine (the core of the app)

Flow: course page builds a URL via `lib/practice-session.ts` → `app/learn/practice/page.tsx` fetches words + progress and builds a plan (`hooks/usePracticeSessionPlan.hook.ts`, `lib/word-progress-stage.ts`) → `components/features/vocabulary/vocabulary-practice.tsx` runs the session.

Rules that are easy to break — understand before touching:

- **Mode selection is pedagogy-driven** (`lib/learning-pedagogy.ts`): new words get multiple interleaved rounds (recognition round 1, production later); leech words become flashcards. Answer quality (0–5 scale, `lib/answer-quality.ts`) is derived from correctness + hints + response time and maps to FSRS grades on the backend.
- **Wrong answers re-queue the word until correct**, but session results merge **worst-attempt-wins** (`mergeWorstResult` in `vocabulary-practice.tsx`): a word's recorded quality is its lowest across all appearances. Never switch this back to last-write-wins — accuracy inflates to 100% and failed words sync to FSRS as remembered.
- **Persistence is optimistic + offline-safe** (`hooks/usePracticeSessionPersistence.hook.ts`): React Query cache is updated optimistically, the summary shows immediately, and the bulk save runs in the background; failures queue to localStorage (`lib/practice-pending-saves.ts`) and flush on next mount/online.
- Keyboard shortcuts (1–4 flashcard grades, a–d choices, Enter) are wired in the engine with a visible legend (`practice-shortcuts-hint.tsx`) — keep them working.

## Design system ("Aurora")

All color comes from OKLCH CSS variables in `app/globals.css` (`:root` and `.dark`) — never hardcode colors in components. Gradients, mesh backgrounds, and glows derive from `--brand-*` via relative color syntax, so swapping the palette re-themes the app (how-to in `COLORS.md`, written in Vietnamese). Utility classes to reuse: `.glass-surface`, `.glow-primary`, `.text-gradient-brand`, `.gradient-hero`, `.gradient-brand/-accent/-warm/-fun`, `.mesh-page-bg`, `.shadow-pressable` (3D buttons). Respect `prefers-reduced-motion` (existing utilities already do; use motion's `useReducedMotion` for JS-driven animation).

## Component conventions (from .cursorrules — reusability is the top priority)

- `components/ui` = base primitives (shadcn/ui, new-york style) · `components/common` = shared app-level · `components/features/<domain>` = feature components · `hooks/` = reusable hooks · `lib/` = utilities.
- Pages/route files compose components; no business logic or copy-pasted JSX in pages. Before writing a new component, check if one exists; extend via props/variants (cva) rather than duplicating.
- Path alias `@/*` → repo root. Use `cn()` for class merging.

## Gotchas

- `next.config.ts` sets `images.unoptimized: true` — `next/image` gives layout benefits only.
- Auth is client-side (`AuthGuard` component); there is no server-side route protection.
- Heavy chart components on the progress page are loaded with `next/dynamic` (`ssr: false`) — keep new recharts usage code-split.
