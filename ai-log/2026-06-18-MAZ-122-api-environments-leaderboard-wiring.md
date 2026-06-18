# AI Usage Log: MAZ-122 (AM-051) Configure mobile API environments + finish leaderboard wiring

## Task / Problem

Resolve `MAZ-122` (AM-051): configure the mobile `API_BASE_URL` per environment (local/dev/prod) with docs, and — per the user's explicit request — finish the backend↔mobile connection for the leaderboard, which existed as units (adapter/repo/facade/ViewModel) but was never composed or reached by the app. Based on `develop` (full client refactor T2→T6 already merged).

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to do `MAZ-122`, first checking its spec did not conflict with the Arrow Untangle refactor, and to finish the backend↔mobile connection (leaderboard: API_BASE_URL, adapter, repository, facade, ViewModel, real levelId, navigation), following both repos' `AGENTS.md`, `MEMORY.md`, `Linear_MCP_Guideline.md`, AI logging, validation, MEMORY/AGENTS updates, commit/push/PR, Linear.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Used | Reviewed MAZ-122 vs the refactor: it is a framework/env-config chore, no conflict. Confirmed the leaderboard adapter/repo/facade/VM + backend `/leaderboard/:levelId` already exist and match. | MAZ-122 description, route/contract grep |
| Planner/Slicer | Used | Scoped to env config + the genuine gap (composition root + screen wiring + levelId + nav); kept backend untouched (out of scope). | this log |
| TDD Implementer | Used | Added env-resolution tests and a composition smoke test, then implemented to green. | `tests/framework/config/*` |
| Judge | Referenced | Pre-PR self-audit: full `npm run verify`, layer boundaries (composition in framework, not presentation; no business rules in views). | `npm run verify` |
| Mutation Tester | Not used | StrykerJS is not configured. | N/A |

## Result Obtained

- **Env (MAZ-122):** `.env.example` now sets `EXPO_PUBLIC_API_BASE_URL`; `src/framework/config/env.ts` resolves it with a local default (`http://localhost:3000`); README "Environment variables" documents local (simulator + LAN device) / dev / production-demo and the CORS note.
- **Composition root (framework):** `createHttpClient()` builds the Axios adapter at `API_BASE_URL`; `createLeaderboardViewModel()` wires HTTP → `HttpLeaderboardRepository` → `LeaderboardFacade` → `LeaderboardViewModel`.
- **Screen wiring:** `app/leaderboard.tsx` now builds the real ViewModel and reads `levelId` from the route (`/leaderboard?levelId=…`) with a temporary default to the first manual level, so the screen actually fetches from the backend (no longer the null/empty placeholder).
- **Navigation:** a "View leaderboard" action on the victory overlay (`VictoryScreen` → `GameScreen` → `app/game.tsx`) navigates to `/leaderboard?levelId=<current level>` with a real id; i18n keys added (en/es).

## Verification

- `npm run verify` (lint + typecheck + test:coverage) → **49 suites / 227 tests passing**, 0 lint errors. Base `develop` typechecked clean before changes.
- Contract check: client calls `GET /leaderboard/:levelId` + `POST /leaderboard/scores`; backend `leaderboardRoutes` exposes exactly those (mounted in `framework/app.ts`).

## Team Modifications Pending Human Review

- **Backend status:** the backend leaderboard endpoint is mounted and the level-catalog already uses `ArrowSpec` (no `CellSpec`/`BoardSize`), so T1/MAZ-130 appears already applied there. I did not deep-audit the backend (out of MAZ-122 scope).
- **Score submission not wired:** the leaderboard *read* path is connected. Posting a score on victory (`submitScore`) still needs an authenticated session + a game-end hook — a follow-up integration ticket (depends on auth wiring).
- `movesCount` in the leaderboard contract equals the arrow count in the untangle game; contract unchanged.

## Lessons / Limitations

The HTTP adapters/repos existed but nothing composed them — the missing piece was a framework composition root + a route that asks for a ready ViewModel. Keeping `createLeaderboardViewModel()` in `framework/` (not a presentation hook) preserves the inward dependency rule while letting `app/` (router/framework) consume it.
