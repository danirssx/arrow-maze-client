# AI Usage Log: MAZ-183 — Guarantee a UUID levelId reaches submit & leaderboard

## Task / Problem

The backend requires a v4 **UUID** `levelId` and returns **422** otherwise. The client's offline
fallback catalog (`manualLevels.ts`) used **slug** ids (`"manual-001-first-knot"`). The `levelId`
sent to the three network sinks is the raw route param (`app/game.tsx:31`), equal to the selected
`LevelListItem.id` — a slug whenever the remote catalog is not the active source (initial render
before `loadLevels()` resolves, or any `.catch()` offline fallback). So winning a level offline
POSTed a slug to `POST /progress/levels/<slug>/complete` and `POST /leaderboard/scores` and read
`GET /leaderboard/<slug>` — all 422. The breakage was invisible because every test used slug ids.
There was no UUID validation and no `LevelId` value object anywhere.

## Tool and Model

Claude Opus 4.8 (1M context) via Claude Code CLI.

## Prompt Used

User requested starting MAZ-183 following the team workflow (review both AGENTS.md, new worktree,
root MEMORY.md + Linear_MCP_Guideline.md, register AI usage, run all checks, update MEMORY/AGENTS,
commit/push/PR/Linear). The `.feature` (@s1..@s8) plus the 3 decisions (adopt the 15 backend seed
UUIDs as fixture ids; add an `isUuid` guard at the application boundary; migrate slug-id tests to
UUIDs) were approved by the human (Daniel) before any TDD.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | Followed the role discipline from AGENTS.md §0.2 (no separate `.agents/` session). A read-only sub-agent mapped the full levelId data flow with file:line; distilled into the CA spec. | `specs/uuid-levelid-MAZ-183.spec.md` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Authored 8 `@s` scenarios (fixtures-are-UUIDs, isUuid, the 2 facade guards × on/off, the VM guard × on/off); presented for the single human gate. | `specs/uuid-levelid-MAZ-183.feature` |
| TDD Implementer (`.agents/tdd-implementer.md`) | Referenced | Red→Green→Refactor in batches: isUuid (red→green), facade/VM guard tests (red→green), then fixtures→UUIDs, then slug-id test migration. | tests, src, this entry |
| Judge (`.agents/judge.md`) | Referenced | Self-review vs `docs/reglas_clean_arch.md`: `isUuid` is a leaf util (no new cross-layer edges); facades keep orchestration-only (format guard, not a business rule); VM stays presentation-only; domain untouched; `@s → test` complete. Verdict: PASS. | this entry, spec CA block |
| Mutation Tester (`.agents/mutation.md`) | Referenced | Stryker scoped to the 4 changed files. First run 91.55% (6 survivors). Killed the 3 in the new logic (2 isUuid anchors + the guard `??` branch). Second run **95.77%**; isUuid + LeaderboardFacade **100%**. | `reports/mutation/index.html` |

## Scenario Coverage (@s ↔ test)

| Scenario | Test | File |
|----------|------|------|
| @s1 — fixtures expose only UUID ids | `should_expose_only_uuid_level_ids` | `tests/presentation/view-models/LevelSelectViewModel.test.ts` |
| @s2 — isUuid true/false | `should_return_true_when_value_is_a_v4_uuid` (+ slug/empty/non-v4/prefix/suffix) | `tests/shared/isUuid.test.ts` |
| @s3 — submit no-op on non-UUID | `should_not_submit_score_when_level_id_is_not_a_uuid` | `tests/application/facades/LeaderboardFacade.test.ts` |
| @s4 — submit delegates on UUID | `should_delegate_submit_score_to_repository_when_level_id_is_a_uuid` | `tests/application/facades/LeaderboardFacade.test.ts` |
| @s5 — read Empty without request on non-UUID | `should_expose_empty_without_requesting_when_level_id_is_not_a_uuid` | `tests/presentation/view-models/LeaderboardViewModel.test.ts` |
| @s6 — read fetches on UUID | `should_expose_loaded_when_entries_exist` | `tests/presentation/view-models/LeaderboardViewModel.test.ts` |
| @s7 — completeLevel no-op on non-UUID | `should_not_write_progress_when_level_id_is_not_a_uuid` (+ `should_return_existing_progress_without_writing...`) | `tests/application/facades/ProgressFacade.test.ts` |
| @s8 — completeLevel persists+syncs on UUID | `should_complete_level_remotely_and_cache_latest_progress` | `tests/application/facades/ProgressFacade.test.ts` |

## Result Obtained

**New files:**
- `src/shared/isUuid.ts` — pure v4-UUID validator (parallel to `createUuid.ts`).
- `specs/uuid-levelid-MAZ-183.{spec.md,feature}`.
- `tests/shared/isUuid.test.ts`.

**Modified source:**
- `src/application/level-build/fixtures/manualLevels.ts` — the 15 fixture ids now carry the canonical backend seed UUIDs (orders 1-15, `…440010`..`…440024`); propagates to `manualLevels[].id` and `definition.id`. Names/order/difficulty unchanged.
- `src/application/facades/LeaderboardFacade.ts` — `submitScore` no-ops when `!isUuid(input.levelId)`.
- `src/application/facades/ProgressFacade.ts` — `completeLevel` skips local+remote and returns current/empty progress when `!isUuid(completedLevel.levelId)`.
- `src/presentation/view-models/LeaderboardViewModel.ts` — `load` sets `Empty` without a request when `!isUuid(levelId)`.

**Migrated tests to UUID levelIds (AC3):** `LeaderboardFacade`, `ProgressFacade`, `LeaderboardViewModel`, `LevelSelectViewModel`, `HttpLeaderboardRepository`, `HttpProgressRepository`, `LocalProgressRepository`, `ProgressMergePolicy`, `ProgressViewModel`, and the leaderboard/progress contract tests.

No facade signatures changed. No new entity/use-case/pattern (only a `src/shared` util + format guards). `app/game.tsx` needed no change — the guards live in the facades it calls.

## Verification

- `npm run verify` — lint 0, typecheck 0, **60 suites / 305 tests** passing.
- Scoped Stryker mutation on the 4 changed files: **95.77%**; `isUuid.ts` and `LeaderboardFacade.ts` **100%**.
  - 3 remaining survivors are **pre-existing**, untouched by this ticket: `ProgressFacade.ts:67/76` (`pendingSync: true` in `emptyProgress`/`mergeCompletion`, overwritten downstream → equivalent mutants) and `LeaderboardViewModel.ts:27` (transient `Loading` setState, not asserted by design). All mutants in the new logic are killed.

## Team Modifications Pending Human Review

1. **Offline fixture ids are now the real backend UUIDs.** Offline play of "level N" now references backend level N, so offline-completed progress/scores align and can sync. The offline fixture **geometry** may still differ from what the backend serves for the same UUID — pre-existing degraded-offline caveat; catalog source-of-truth is `MAZ-168/169`, out of scope here.
2. **Guards are silent no-ops** (matches the existing best-effort victory writes). User-visible leaderboard/replay UX is `MAZ-184`.

## Lessons / Limitations

- The network `levelId` is the route param, never re-derived from the loaded definition — so the fix had to make the *id source* (fixtures) emit UUIDs, plus guard the application boundary, rather than touch `app/game.tsx`.
- Stryker's anchor mutations (`^`/`$` removal on the UUID regex) are real: a validator without prefix/suffix tests passes embedded-junk strings. Added leading/trailing-junk cases to kill them.
- New git worktree: `npm ci` inside it (don't symlink `node_modules`); jest runs via `--experimental-vm-modules`.
