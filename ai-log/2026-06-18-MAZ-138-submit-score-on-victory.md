# AI Usage Log: MAZ-138 Submit score to leaderboard on victory (write path)

## Task / Problem

Resolve `MAZ-138`: wire the leaderboard **write** path. MAZ-122 connected the read path; on victory the run was never POSTed to `/leaderboard/scores`. Stacked on the MAZ-122 branch (it reuses `createHttpClient` + the leaderboard composition).

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to create the Linear ticket for the missing `submitScore` wiring and then implement it, following both repos' `AGENTS.md`, `MEMORY.md`, `Linear_MCP_Guideline.md`, AI logging, validation, MEMORY/AGENTS updates, commit/push/PR, Linear.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Used | Created MAZ-138 from the discovered reality: backend `POST /leaderboard/scores` (userId from token) + client facade/repo already match; the gap is orchestration + auth/time dependencies. | MAZ-138 |
| Planner/Slicer | Used | Scoped to a testable application use case + composition + a graceful on-victory trigger; flagged auth-login + live-timer as dependencies (no-op until present). | this log |
| TDD Implementer | Used | Wrote `SubmitScoreUseCase` tests (submits/skips/score-mapping/clamping) then implemented to green. | `tests/application/game/SubmitScoreUseCase.test.ts` |
| Judge | Referenced | Pre-PR self-audit: full `npm run verify`; the use case stays pure (no infra/native), composition isolates AsyncStorage to framework. | `npm run verify` |
| Mutation Tester | Not used | StrykerJS is not configured. | N/A |

## Result Obtained

- **`SubmitScoreUseCase`** (application): reads the session via `GetCurrentSessionUseCase`; if authenticated, scores the run with `TimeScoringStrategy`, builds a `SubmitScoreInput` (client-generated UUID `leaderboardId`/`entryId`, `usernameSnapshot` from session, `timeSeconds`/`movesCount` clamped to the backend's positive minimums) and POSTs via `LeaderboardFacade.submitScore(input, accessToken)`. No-op (`{ submitted: false }`) when unauthenticated.
- **Composition** `createSubmitScoreUseCase()` (framework): wires `SessionManager` (AsyncStorage) + `GetCurrentSessionUseCase` + `LeaderboardFacade(HttpLeaderboardRepository(createHttpClient()))`.
- **On-victory trigger**: `GameViewModel` tracks `startedAtMs` and exposes `elapsedMs()`; `app/game.tsx` fires the submit once when the overlay becomes Victory, best-effort, with `{ levelId, elapsedMs, arrowCount }`.

## Verification

- `npx jest tests/application/game/SubmitScoreUseCase.test.ts` → 3 passing.
- `npm run verify` (lint + typecheck + coverage) → **50 suites / 230 tests passing**.

## Team Modifications Pending Human Review

- **No-op until auth login is wired:** no `AuthSession` is populated in the app yet, so submissions skip. Once a login flow stores a session in `SessionManager`, submissions become live with no further change here.
- **Elapsed time** comes from the ViewModel wall-clock (`Date.now()` since level start), a stand-in until the real in-game timer lands (T8 follow-up).
- `leaderboardId`/`entryId` are client-generated UUID v4; the backend finds-or-creates the leaderboard by `levelId` and derives `userId` from the token.

## Lessons / Limitations

Keeping `SubmitScoreUseCase` dependent only on `GetCurrentSessionUseCase` + `LeaderboardFacade` (interfaces/facades) made it fully unit-testable with fakes and kept AsyncStorage/native out of the test path — the native wiring lives only in the framework composition. The write path is now complete end-to-end except for a populated session.
