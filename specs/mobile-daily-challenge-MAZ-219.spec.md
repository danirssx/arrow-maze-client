# Spec — Mobile Daily Challenge entrypoint & consumption (MAZ-219 / M12-06B)

Owner: danielross5018
Repo: arrow-maze-client
Branch: feat/mobile-daily-challenge-MAZ-219
Depends on: MAZ-218 (M12-06A backend daily challenge) — backend endpoint `GET /daily-challenge`.

## Problem

The backend (MAZ-218) exposes a validated, once-per-UTC-day Arrow Untangle puzzle at
`GET /daily-challenge`. The mobile client has no way to reach it. MAZ-219 adds a
Daily Challenge **entrypoint** on the client and consumes that endpoint, loading the
returned level into the existing gameplay flow — **without the client knowing anything
about Gemini, prompts, or secrets** (generation and secret handling stay 100% backend).

## Backend contract (from MAZ-218, source of truth)

`GET /daily-challenge` — **public** (no bearer required), no path/query params. Deterministic per UTC day.

Success `200` envelope:

```jsonc
{
  "status": "success",
  "data": {
    "challenge": {
      "date": "2026-07-10",                       // UTC date key ^\d{4}-\d{2}-\d{2}$
      "seed": "daily-2026-07-10",                 // "daily-<date>"
      "targetDifficulty": "EASY|MEDIUM|HARD",
      "source": "gemini|fallback",
      "generatedAt": "2026-07-10T04:00:00.000Z",
      "expiresAt": "2026-07-11T00:00:00.000Z",
      "validation": { "solvable": true, "difficultyMatched": true, "fallbackUsed": false },
      "level": {
        "name": "Daily Challenge 2026-07-10",
        "description": "A validated daily Arrow Untangle puzzle.",
        "difficulty": "EASY|MEDIUM|HARD",
        "definition": {
          "attempts": 5,
          "arrows": [ { "id": "arrow-0", "color": "#4B6BFB",
                        "path": [ { "row": 0, "col": 0 } ], "direction": "UP|DOWN|LEFT|RIGHT" } ],
          "boardShape": { "type": "CELL_MASK", "cells": [ { "row": 0, "col": 0 } ] } // OPTIONAL, omitted when absent
        },
        "timeLimitSeconds": 120                    // OPTIONAL, omitted when absent
      }
    }
  }
}
```

Errors: `503 { status:"error", error:{ code:"DAILY_CHALLENGE_UNAVAILABLE", message } }` when
generation fails; `500 INTERNAL_SERVER_ERROR` otherwise. No 4xx from this route.

**Key contract facts that shape the design:**

- The daily `level` has **no `levelId`/UUID** (no `id`, `status`, `version`, `createdAt`). It is
  anonymous — not a catalog level. The only stable key is `seed` (`daily-<date>`).
- The board frame is always `definition.boardShape` (`CELL_MASK`); there is never a `boardSize`.
- `difficulty`/`direction` are uppercase enums; `source` is lowercase.

## Clean Architecture contract

Mirrors the existing level-catalog vertical slice (Adapter + Repository + Facade + MVVM).

| Layer | Element | Responsibility |
| --- | --- | --- |
| `application/ports` | `IDailyChallengeRepository` (new port) | `getDailyChallenge(): Promise<DailyChallenge>`; boundary the app/VM depends on. No HTTP knowledge. |
| `application/daily-challenge` | `DailyChallenge` type | `{ definition: LevelDefinition; meta: DailyChallengeMeta }` where `meta = { date, difficulty, source, fallbackUsed }`. Reuses the existing `LevelDefinition` (application DTO). |
| `application/facades` | `DailyChallengeFacade` | Thin pass-through to the port (matches `LeaderboardFacade` style). VMs never touch HTTP. |
| `infrastructure/repositories` | `HttpDailyChallengeRepository` | Adapter: `IHttpClient.get("/daily-challenge")`, delegates mapping. `// Pattern: Adapter, Repository`. |
| `infrastructure/mappers/daily-challenge` | `DailyChallengeDtos` + `DailyChallengeMapper` | DTOs for the `{status,data:{challenge}}` envelope; maps `challenge.level.definition` → `LevelDefinition`. **Synthesizes `id = seed`** (anonymous level, deliberately NOT a UUID). Reuses the same arrow/boardShape mapping logic as `LevelCatalogMapper.toDefinition`. |
| `presentation/view-models` | `DailyChallengeViewModel` | MVVM. `extends ObservableViewModel<AsyncUiState<DailyChallenge>>`; `load()` → `Loading` → `Loaded(challenge)` / `Error`. No business/game rules. |
| `presentation/screens` | `DailyChallengeScreen` | Dumb View: renders Loading / Error(retry) / Loaded(meta card + Play). On Play, hosts gameplay via `useGameSession(dailyId, definition)` + existing `GameScreen`. |
| `app/` | `app/daily-challenge.tsx` | Expo-router route; obtains VM via `createDailyChallengeViewModel()` in `useMemo`, wires nav. |
| `presentation/screens` | `HomeScreen` (edit) | Add `onDailyChallenge` prop + `home-card-daily` InfoCard. Stays a dumb MVVM View. |
| `app/index.tsx` (edit) | Home route | Wire `onDailyChallenge` → `/daily-challenge`. |
| `framework/config` | `dailyChallenge.ts` (new) | Composition root: `createDailyChallengeRepository()` / `createDailyChallengeFacade()` / `createDailyChallengeViewModel()`. Uses `createHttpClient()`. |
| `framework/i18n` | `en.json` / `es.json` (edit) | Keys for the Home card + Daily Challenge screen (loading/error/retry/play/meta). |

### Design decisions (for the human gate)

1. **Dedicated screen, not a `source` param on `/game`.** A standalone `DailyChallengeScreen`
   owns the fetch + loading/error/fallback UI and then hosts `GameScreen`. This keeps the daily
   flow isolated and fully testable, touches **zero** existing production files except `HomeScreen`
   (add card) + `app/index.tsx` (wire) + i18n, and avoids passing a big `LevelDefinition` object
   through expo-router params.
2. **Daily play does not write leaderboard or progress.** The daily level is anonymous (no catalog
   UUID). Leaderboard would auto-skip anyway (`isUuid` guard), and writing a synthetic `daily-<date>`
   id into progress would pollute catalog progress. So daily play omits both, matching the
   ticket's out-of-scope ("do not change scoring for Daily Challenge"). Victory overlay offers
   replay/home only (no next-level, no leaderboard link).
3. **Client-side auth gating.** The endpoint is public, but the acceptance criterion says "given an
   authenticated user". Since MAZ-179 made auth mandatory to reach Home, the entrypoint lives on the
   authenticated Home; the VM does not require a token but the flow is reached only when signed in.
4. **No secrets.** The client only knows the string `"/daily-challenge"`. No `GEMINI_API_KEY`,
   prompt, or `gemini` reference exists anywhere in mobile code or public env.

## Out of scope

- Generating levels on mobile.
- Storing `GEMINI_API_KEY`, prompts, or secrets on mobile.
- Changing scoring / leaderboard / progress rules for the Daily Challenge.

## Acceptance criteria (from Linear)

- Authenticated user opens Daily Challenge ⇒ mobile requests the challenge from backend.
- Backend returns a valid `LevelDefinition` ⇒ starting the challenge opens gameplay with that level.
- Backend fails ⇒ UI shows a recoverable error without crashing.
- Inspecting mobile for Gemini secrets ⇒ none exist in code, public env, or logs.

## Tests

- Application/infrastructure adapter tests with a mocked `IHttpClient` (URL + mapped definition).
- Contract test pinning the `{status,data:{challenge}}` DTO shape against the backend envelope.
- ViewModel tests: loading, success, error.
- Presentation: Home exposes the entrypoint; screen renders loading/error/loaded.
- Composition test: factory wiring.

## `@s → intent` map

- `@s1` Adapter requests `GET /daily-challenge` on load.
- `@s2` Mapper turns the backend challenge into a `LevelDefinition` (id = seed, arrows/attempts/boardShape/timeLimit/difficulty).
- `@s3` ViewModel transitions Loading → Loaded on success, exposing definition + meta.
- `@s4` ViewModel transitions to Error on backend failure; screen shows a recoverable retry, no crash.
- `@s5` Loaded challenge starts gameplay with the daily level.
- `@s6` No Gemini secret/prompt/key anywhere in daily-challenge mobile code or public env.
- `@s7` Home exposes a Daily Challenge entrypoint that invokes the injected intent; Home stays a dumb View.
- `@s8` Fallback-sourced challenge still loads and plays; daily play makes no leaderboard/progress write.
