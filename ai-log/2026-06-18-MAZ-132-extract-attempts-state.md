# AI Usage Log: MAZ-132 Arrow Extraction, Attempts/Defeat, Win Condition (gameplay domain)

## Task / Problem

Resolve `MAZ-132` (Refactor T3) of the Arrow Untangle pivot: migrate the gameplay domain off the deleted maze engine. Replace player movement with arrow extraction, add the limited-attempts soft-defeat system (with per-arrow dedup), and make victory "empty board". Stacked on `MAZ-131`.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to implement `MAZ-132` following both repos' `AGENTS.md`, the team `MEMORY.md`, `Linear_MCP_Guideline.md`, prior ticket state, AI usage logging, validation, MEMORY/AGENTS update checks, commit/push/PR, and Linear updates, noting the refactor requires reviewing all affected tickets.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | The mechanic (Model B extraction, attempts/dedup, soft defeat, empty-board victory) was already sealed in the refactor docs and MAZ-132; no new interview. | `Refactor_Arrow_Untangle_Tickets.md` (T3), MAZ-132 |
| Planner/Slicer | Used | Re-sliced T3 to the gameplay domain core (command/level/state) and deferred the application use-cases + GameFacade to T4 because they are inseparable from the level-build Builder. | this log, MEMORY re-slice note |
| TDD Implementer | Used | Wrote AAA `should_*_when_*` tests for ExtractArrowCommand, NormalLevel, TimedLevel, GameContext, then implemented to green. | `tests/domain/{command,level,state}`, this branch |
| Judge | Referenced | Pre-PR self-audit: scoped eslint, dangling maze-ref grep, layer boundaries (domain imports no RN/Expo/HTTP). | scoped `eslint` (exit 0), `grep` clean |
| Mutation Tester | Not used | StrykerJS is not configured. | N/A |

## Result Obtained

- Domain `command`: removed `MoveCommand`; added `ExtractArrowCommand` — captures a `GameContext` snapshot, delegates extraction, and on `undo` re-places the arrow and restores the prior phase/result. `CommandHistory`/`ICommand` unchanged.
- Domain `level`: rewrote `BaseLevel` over `BoardGroup` + `CollisionService` with `attemptsRemaining` + `penalizedFailures: Set` (dedup), `extractArrow`/`restoreArrow`/`registerFailedAttempt`/`canExtract`; victory = empty board; defeat = out-of-attempts (`DefeatReason.OutOfAttempts`) plus the subclass hook (`TimedLevel` time). Dropped player/move/graph/template; kept `Clock`; emits `LevelFinished` only. `NormalLevel`/`TimedLevel` re-based on `(id, board, attempts, ...)`.
- Domain `state`: `IGameState`/`BaseGameState` now expose `extract`/`failAttempt` instead of `move`; `PlayingState` extract→`VictoryState`, failAttempt→`GameOverState`; `GameContext` exposes `extract`/`failAttempt` and snapshot/restore.
- Errors: `level/errors` now `InvalidTimeLimitError`, `InvalidAttemptsError`, `ArrowNotExtractableError` (dropped maze errors); barrels updated.

## Verification

- `npx jest tests/domain/level tests/domain/command tests/domain/state` → 4 suites, 17 tests passing.
- `npx eslint src/domain/{level,command,state} tests/domain/{level,command,state}` → exit 0 (clean).
- `grep` for maze refs (`BoardGraph`, `PathfindingService`, `CellFactory`, `LevelTemplate`, `MoveCommand`, `.move(`, `playerPosition`) in the touched layer → clean.
- Full `npm run verify` is **intentionally red** (big-bang) until the application layer migrates (T4) and UI/levels land.

## Team Modifications Pending Human Review

- **Re-slice (please confirm):** the application `use-cases/game` + `GameFacade` migration moved to **T4 (MAZ-133)**, because `GameSession`/`StartLevelUseCase`/`GameFacade` construct levels via the `level-build` Builder (T4) and emit via the `dto` `GameEventBridge` (T6). `BaseLevel` is now constructed from a `BoardGroup` + attempts, which the Builder will supply.
- The `observer`/`dto` event chain still references the old move/cell events; it compiles but is semantically stale and should be revised when the UI lands (T6).

## Lessons / Limitations

Re-slicing T3 to the domain core keeps the slice coherent and green-in-isolation, mirroring how MAZ-131 was a clean board/value-objects slice. The application/facade is inseparable from the T4 builder, so migrating it there avoids pulling T4/T6 scope into T3. Keeping arrow removal as an `ArrowEntity` state flip made `ExtractArrowCommand.undo` a one-liner (`restoreArrow` + context restore).
