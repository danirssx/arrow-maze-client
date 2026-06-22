# Spec — Game result metrics out of the ViewModel (Client / Mobile)

Date: 2026-06-21
Ticket: `MAZ-160` (temporary id `CA-007`)
Source: `Clean_Architecture_Fix_Tickets_Proposal.md` (Area 4 — scoring/result), report `C-R2`.
Status: scope already approved by the human (Linear `MAZ-160` is in **Todo**). The `@s`
scenarios in `game-result-metrics.feature` are the executable contract for this slice.

## Purpose

`GameViewModel` currently measures wall-clock time with `Date.now()` and counts moves
on a private stack, then `app/game.tsx` rebuilds a `ScoreContext` and runs
`TimeScoringStrategy` to submit the victory. That puts result/scoring rules in the
presentation layer, violating the clean-architecture dependency rule and MVVM ("the
ViewModel only maps the model to a view state, it does not calculate business results").

This slice moves time/moves measurement and score calculation **out of presentation**
into the application `GameSession` + a use case, exposes them as plain numbers on the
application snapshot, and leaves the ViewModel a pure snapshot → `GameUiState` mapper.

## Architecture placement (domain → application → presentation; inward-only deps)

- **Domain**: reuse the existing `Clock` port (`src/domain/level/Clock.ts`) and the
  existing scoring strategy/`ScoreContext`/`Score`. No new domain rules, no formula
  change (out of scope).
- **Application**:
  - `GameSession` owns the elapsed-time measurement (via an injected `Clock`) and the
    moves count (from the existing `CommandHistory.size`). It freezes the elapsed time
    the first time the level result is terminal, so victory time is deterministic.
  - `GameSnapshotDto` gains two plain fields: `elapsedMs`, `movesCount`.
  - A new `ResolveLevelOutcomeUseCase` runs the scoring strategy and returns a plain
    `LevelOutcomeDto` (`status`, `won`, `score`, `timeSeconds`, `movesCount`) — the
    "already-calculated result" the victory submit consumes.
  - `GameFacade.getLevelOutcome()` exposes that DTO; the facade owns the scoring
    strategy and the session clock by injection (defaults kept for now; the full
    composition root is `CA-008`).
- **Presentation**:
  - `GameViewModel` drops `startedAtMs`/`finishedAtMs`/`elapsedMs()`/`movesCount()` and
    any `Date.now()`. It keeps the extracted-arrow list purely for the exit animation
    and undo mapping (UI state), never as a scoring source.
  - `app/game.tsx` reads the already-calculated `LevelOutcomeDto` from the facade and
    forwards `score`/`timeSeconds`/`movesCount` to the progress + leaderboard facades.
    No `ScoreContext`, `TimeScoringStrategy`, or `Date.now()` for domain metrics in the
    route.

## Out of scope

- Changing the score formula or the leaderboard/progress transport contracts.
- Redesigning the victory UI.
- Removing `GameFacade.createDefault()` / building the gameplay composition root
  (that is `CA-008` / a separate ticket).

## Acceptance criteria (from the ticket)

1. `GameViewModel` no longer uses `Date.now()` for domain metrics.
2. `GameViewModel` no longer exposes `elapsedMs()` / `movesCount()` as a scoring/progress
   source.
3. When a game ends in victory, the application snapshot carries plain metrics
   sufficient for score/progress.
4. Scoring is computed outside presentation.
5. `npm run verify` is green and no result/scoring rule lives in `presentation`.
