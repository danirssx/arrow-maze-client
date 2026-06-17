# AI Usage Log: AM-020 Level Template Method Hierarchy

## Task / Problem

Resolve MAZ-91 / AM-020 by defining the base lifecycle of a playable level and its
normal/timed specializations, with victory/defeat evaluation and movement constraints
backed by the directed `BoardGraph` from AM-018 and the `CellFactory` from AM-019.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to implement MAZ-91 while following `AGENTS.md` in both repositories,
`MEMORY.md`, `Linear_MCP_Guideline.md`, AI usage logging, validation, commit, push, PR,
and Linear update rules.

## Result Obtained

Added a pure domain Template Method hierarchy under `src/domain/level`:

- `BaseLevel`: abstract Template Method. Its `evaluate()` defines the invariant outcome
  algorithm (defeat hook first, then victory by reaching the exit, then still playing) and
  defers the defeat condition to the protected `evaluateDefeat` hook. It builds the board
  through `CellFactory` (Factory Method, AM-019) and derives movement from
  `BoardGraphBuilder` (Graph pattern, AM-018). `move()` is constrained exclusively by
  `BoardGraph.canMove`, so an unconnected destination fails with `IllegalMoveError` and
  leaves state untouched.
- `NormalLevel`: untimed concrete level; never loses on its own.
- `TimedLevel`: concrete level lost by time once the elapsed time reaches the limit. Time is
  read through an injectable `Clock` port so the rule is deterministic and never couples to a
  device clock.
- `LevelResult` / `LevelStatus` / `DefeatReason` value objects for the evaluation outcome.
- `level/errors.ts`: `IllegalMoveError`, `InvalidLevelStartError`, `MissingExitError`,
  `InvalidTimeLimitError`, all extending the existing domain `DomainError`.

`BaseLevel` knows nothing about UI, ViewModels, navigation, persistence, or the backend, per
the Definition of Done.

## Verification

- `npm test -- --runInBand tests/domain/level` (12 tests: normal flow, timed defeat, win
  before time, and graph movement constraints).
- `npm run verify` (lint + typecheck + coverage): 56 tests passing across 12 suites,
  0 lint errors. Remaining lint output is pre-existing warnings only (useless-constructor on
  thin domain error subclasses and no-redeclare on const-map value objects), matching the
  conventions already established for `board`, `factory`, and `value-objects`.
- `domain/level` coverage: 100% lines. The only uncovered branch is `systemClock` (the real
  `Date.now` default), intentionally untested because timed tests inject a deterministic clock.

## Team Modifications Pending Human Review

- Confirm whether victory should also require collecting all `CollectableCellDecorator`
  items (AM-019) before reaching the exit, or remain exit-only until scoring (AM-024).
- Confirm whether a move-limited defeat reason should be added to `DefeatReason` in a later
  ticket; the `afterMove` hook is already in place to support it.
- Confirm whether `BaseLevel` should expose `PathfindingService.optimalMoves` for star/score
  thresholds, or keep that in the application layer.

## Lessons / Limitations

The Template Method skeleton lets `NormalLevel` and `TimedLevel` differ only in the single
`evaluateDefeat` step, keeping the move/graph/victory logic in one place. Injecting `Clock`
instead of reading `Date.now` was necessary to keep the timed rule deterministic under test
while staying domain-pure. Overridable hooks are never called from the constructor to avoid
subclass field-initialization ordering issues under TypeScript.
