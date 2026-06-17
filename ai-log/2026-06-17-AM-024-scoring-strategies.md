# AI Usage Log: AM-024 Scoring Strategies

## Task / Problem

Resolve MAZ-95 / AM-024 by computing the level score through interchangeable, approved
strategies (Strategy pattern). The score must be deterministic, consume the `optimalMoves`
computed by `PathfindingService`, and never produce an invalid high score on defeat or time
expiry.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to implement MAZ-95 while following `AGENTS.md` in both repositories,
`MEMORY.md`, `Linear_MCP_Guideline.md`, AI usage logging, validation, checking whether
`MEMORY.md`/`AGENTS.md` need updates, commit, push, PR, and Linear update rules.

## Result Obtained

Added a pure-domain Strategy module under `src/domain/scoring` plus a `Score` value object:

- `value-objects/Score`: immutable non-negative integer score with `of`/`zero`/`add`,
  validated through `InvalidScoreError`, so an invalid (negative/non-integer) high score
  cannot be constructed.
- `IScoringStrategy`: `score(context: ScoreContext): Score` contract; implementations must be
  pure and must never return a positive score for a non-won result.
- `ScoreContext`: validated inputs — `result` (`LevelResult`), `moves`, `optimalMoves`
  (from pathfinding / template), and `remainingMs`. Helpers `isScorable`, `isEfficient`,
  `extraMoves`, `remainingSeconds`.
- `StandardScoringStrategy`: flat base points for a win, zero otherwise.
- `EfficiencyScoringStrategy`: base + flat bonus when moves ≤ optimal, minus a per-extra-move
  penalty, clamped at zero.
- `TimeBonusScoringStrategy`: base + points per whole remaining second on a win.

All three return `Score.zero()` when the level was not won, satisfying the "no invalid high
score on defeat/time" criterion. `optimalMoves` is consumed as a number; the efficiency test
derives it from a real `BoardGraph` via `PathfindingService.calculateOptimalMoves` to prove
the integration without coupling the strategy to the board layer.

`LevelTemplate`/board sources were not modified beyond adding the `Score` value object and its
export. Leaderboard backend and persistence were left out of scope.

## Verification

- `npm test -- --runInBand tests/domain/scoring` (17 tests across the three strategies and
  the context, including pathfinding-derived optimal moves and defeat edge cases).
- `npm run verify` (lint + typecheck + coverage): 100 tests across 21 suites passing,
  0 lint errors. Remaining lint output is pre-existing warnings only (no-redeclare on
  const-map value objects, useless-constructor on thin domain error subclasses).
- `domain/scoring` coverage: 100% across statements, branches, functions, and lines.

## Team Modifications Pending Human Review

- Confirm the scoring constants (base 1000, efficiency bonus 500, penalty 50,
  time 10 pts/sec) match the intended game balance, or move them to a shared config.
- Confirm whether a composite strategy (efficiency + time together) is wanted, or whether the
  application layer selects a single strategy per level kind.
- Confirm whether collectables (AM-019 `CollectableCellDecorator`) should feed into scoring
  here or in a later ticket.

## Lessons / Limitations

Modeling the final score as a `Score` value object centralizes the non-negative-integer
invariant, so each strategy clamps once and can never emit an invalid high score. Keeping
`optimalMoves` as a plain context input (rather than having strategies call
`PathfindingService` themselves) keeps the strategies pure and trivially deterministic, while
the integration test still exercises the real pathfinding path end to end.
