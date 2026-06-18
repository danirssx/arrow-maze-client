# AI Usage Log: AM-029 Complete Mobile Gameplay Application Tests

## Task / Problem

Resolve MAZ-100 / AM-029 by hardening the gameplay application test suite: exercise the
orchestration of use cases and the `GameFacade` (start, play turn, undo, pause/resume, level
building and graph solvability) without coupling to UI or infrastructure. Test-only ticket; no
production code changes.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to implement MAZ-100 following `AGENTS.md` in both repositories, `MEMORY.md`,
`Linear_MCP_Guideline.md`, AI usage logging (including the required agent-role table),
validation, checking whether `MEMORY.md`/`AGENTS.md` need updates, commit, push, PR, and
Linear update rules.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | The spec came from the Linear ticket AM-029; `.agents/spec-partner.md` conventions were followed, not re-run. | Linear MAZ-100 |
| Planner/Slicer | Referenced | Ticket was already planned/sliced in `ArrowMaze_Linear_Tickets_Plan.md`; no new slicing. | Linear MAZ-100 |
| TDD Implementer | Used | Wrote test-first/behavior tests driving the existing `GameFacade`/use cases and `LevelDirector` against manual level fixtures. | `tests/application/game/GameplayApplicationFlow.test.ts`, `tests/application/level-build/ManualLevelsDirector.test.ts`, PR #18 |
| Judge | Referenced | Self-review via the `.agents/judge.md` checklist and `npm run verify`; no separate review PR. | `npm run verify` output |
| Mutation Tester | Not used | No mutation run for this test-hardening ticket. | N/A |

## Result Obtained

Added application-layer tests (no production changes):

- `tests/application/game/GameplayApplicationFlow.test.ts`: for every one of the 15 manual
  level fixtures, derives the winning move sequence from the board graph
  (`PathfindingService.shortestPath`), plays it through the `GameFacade`, and asserts a
  `Victory`/`Won` snapshot whose `moves` and `optimalMoves` equal the fixture's
  `expectedOptimalMoves`; then composes an `EfficiencyScoringStrategy` over the snapshot to
  assert a positive score (and exactly 1500 for an optimal run). Error handling: play/pause
  before start → `GameplayStateError`; unsolvable strategy → `UnsolvableLevelError`; malformed
  JSON strategy → `InvalidLevelDefinitionError`; disconnected destination → `IllegalMoveError`.
- `tests/application/level-build/ManualLevelsDirector.test.ts`: drives `LevelDirector` over all
  15 fixtures, asserting computed `optimalMoves` matches `expectedOptimalMoves` and the
  concrete level kind (`NormalLevel`/`TimedLevel`) matches each definition.

The facade snapshot has no `score` field, so "victory with score" is satisfied at the
application boundary by feeding the snapshot (`result`, `moves`, `optimalMoves`) into the
scoring strategy — no production code was changed to add a field.

## Verification

- `npm test -- --runInBand tests/application/game/GameplayApplicationFlow.test.ts tests/application/level-build/ManualLevelsDirector.test.ts` (51 tests passing).
- `npm run verify` (lint + typecheck + coverage): 200 tests across 28 suites passing, 0 lint
  errors (remaining output is pre-existing warnings only).

## Team Modifications Pending Human Review

- Decide whether `GameSnapshotDto` should carry a `score` field directly (so ViewModels in
  AM-045 do not compose scoring themselves), or keep scoring as a separate application call.
- Confirm whether the winning-sequence helper should live as a shared test utility once more
  application/presentation tests need a "solve this level" helper.

## Lessons / Limitations

Deriving the winning path from `PathfindingService` (rather than hard-coding move lists) keeps
the tests robust to fixture edits and matches the acceptance criterion "winning sequence per
the graph". Using a tiny inline `ILevelStrategy` stub (an application port) avoided mocking any
domain object, satisfying "mocks only for external ports" — here there were no external ports
to mock at all, since the gameplay stack is pure.
