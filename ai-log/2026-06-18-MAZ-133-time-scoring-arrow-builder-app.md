# AI Usage Log: MAZ-133 Time Scoring, Arrow Level Builder, Application Gameplay

## Task / Problem

Resolve `MAZ-133` (Refactor T4) of the Arrow Untangle pivot: replace pathfinding-based scoring with time-based scoring, rebuild the level-build Builder/Director/strategies over `ArrowSpec`, and (absorbed from the T3 re-slice) migrate the application `use-cases/game` + `GameFacade` to the new domain. Stacked on `MAZ-132`.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user approved the T3 re-slice and asked to implement `MAZ-133` (T4) absorbing the deferred application/facade migration, following both repos' `AGENTS.md`, the team `MEMORY.md`, `Linear_MCP_Guideline.md`, prior ticket state, AI usage logging, validation, MEMORY/AGENTS update checks, commit/push/PR, and Linear updates.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Time scoring (`max(0, base − elapsedSeconds·k)`), ArrowSpec contract, and attempts were already sealed in the refactor docs; no new interview. | `Refactor_Arrow_Untangle_Tickets.md` (T4, §1.1) |
| Planner/Slicer | Used | Absorbed the T3 re-slice (application use-cases + GameFacade) into T4; scoped GameFacade's board-snapshot/event-DTO board mapping out to T6. | this log, MEMORY note |
| TDD Implementer | Used | Wrote AAA tests for TimeScoring/ScoreContext, the arrow Builder/Director/Json strategy, and a GameFacade play→win→undo flow, then implemented to green. | `tests/domain/scoring`, `tests/application/{level-build,game}`, this branch |
| Judge | Referenced | Pre-PR self-audit: scoped eslint (T4 files clean), dangling-ref grep, layer boundaries (no React/Expo/HTTP). | scoped `eslint`, `grep` |
| Mutation Tester | Not used | StrykerJS is not configured. | N/A |

## Result Obtained

- Domain `scoring`: removed `EfficiencyScoringStrategy` and `TimeBonusScoringStrategy`; added `TimeScoringStrategy` (`score = max(0, base − elapsedSeconds·pointsPerSecond)`, higher = better, zero when not won); simplified `ScoreContext` to `{ result, elapsedMs }` (dropped moves/optimalMoves/remainingMs); kept `StandardScoringStrategy`; updated barrel.
- Application `level-build`: `LevelDefinition` is now `{ id, difficulty, arrows: ArrowSpec[], attempts?, kind, timeLimitSeconds? }` (+ `DEFAULT_ATTEMPTS = 5`); `BuiltLevel = { level }` (no optimalMoves); `ILevelBuilder`/`ConcreteLevelBuilder` build a `BoardGroup` of `ArrowEntity` and instantiate `NormalLevel`/`TimedLevel` with attempts (no graph/pathfinding/solvability — backend owns solvability via the DAG check); `LevelDirector`, `TutorialLevelStrategy` (a 2-arrow dependency puzzle), and `JsonLevelStrategy` (parses arrows) rewritten.
- Application `use-cases/game`: `GameSession` drops optimalMoves; `PlayTurnUseCase` → `TapArrowUseCase(arrowId)` (extract if the ray is clear, else a deduped failed attempt); `GameSnapshotDto`/mapper now expose `arrowsRemaining`/`attemptsRemaining`/`canUndo` (no position/moves/optimalMoves); `StartLevelUseCase`/`Undo`/`Pause`/`Resume` adapted.
- `GameFacade`: gameplay orchestration (`startLevel`/`tapArrow`/`undo`/`pause`/`resume`/`restart`/`getSnapshot`) + the domain→DTO event bridge. `getBoardSnapshot` (static board rendering) was removed and deferred to the mobile UI ticket (T6).

## Verification

- `npx jest tests/domain/scoring tests/application/level-build/{ConcreteLevelBuilder,LevelDirector,JsonLevelStrategy}.test.ts tests/application/game/GameFacade.test.ts` → 7 suites, 26 tests passing (incl. a start→blocked-tap→clear→win→undo flow through the real `GameFacade`).
- `npx eslint` on the touched scoring/level-build/use-cases/facade files + tests → clean. (The only eslint errors are in `level-build/fixtures/manualLevels.ts`, which belongs to T5 and was already red.)
- Full `npm run verify` is **intentionally red** (big-bang) until T5 (manual levels) and T6 (UI) land.

## Team Modifications Pending Human Review

- `GameFacade.getBoardSnapshot` + `dto/BoardSnapshotMapper` (static board rendering) deferred to **T6 (MAZ-135, UI)** — they map a level definition to UI cells, a presentation concern.
- `level-build/fixtures/manualLevels.ts` and the manual-level tests still reference the deleted cell model — owned by **T5 (MAZ-134)**.
- Application/UI event/contract tests (`GameEventContract`, the old `GameplayApplicationFlow`) belong to **T6/T7** and were left/removed accordingly.

## Lessons / Limitations

Modeling level construction as "arrows → `ArrowEntity` → `BoardGroup` → level" let the Builder stay a thin, dependency-free assembler now that solvability lives in the backend. Taps are addressed by arrow id (the UI disambiguates overlaps from rendered geometry), which keeps the application layer free of pixel/geometry concerns. Keeping the event bridge while dropping the board snapshot was the clean cut that let `GameFacade` compile without pulling in the T6 rendering mapper.
