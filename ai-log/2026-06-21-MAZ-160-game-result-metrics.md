# AI Usage Log: MAZ-160 Move scoring/progress metrics out of the GameViewModel

## Task / Problem

Clean Architecture remediation slice `CA-007` (Area 4, report `C-R2`). The
`GameViewModel` measured wall-clock time with `Date.now()` and counted moves on a
private stack, and `app/game.tsx` rebuilt a `ScoreContext` + ran `TimeScoringStrategy`
to submit a victory. That put result/scoring rules in the presentation layer,
breaking the dependency rule and MVVM (a ViewModel maps the model to a view state; it
does not calculate business results). This ticket moves time/moves measurement and
score calculation into the application `GameSession` + a use case, exposes plain
metrics on the application snapshot, and leaves the ViewModel a pure
snapshot → `GameUiState` mapper. No score-formula change. Covers `@s1..@s8` of
`specs/game-result-metrics.feature`.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

Work MAZ-160 end to end honoring both repos' `AGENTS.md`, root `MEMORY.md`,
`Linear_MCP_Guideline.md`; a new worktree per ticket; AI logging +
`compile-ai-usage.sh`; and commit/push/PR/Linear. As a refactor, review the whole
context and the affected tickets.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | Distilled the approved CA-007 scope from `Clean_Architecture_Fix_Tickets_Proposal.md` + Linear into a local spec; no separate session. | `specs/game-result-metrics.spec.md` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Authored the executable `.feature` (`@s1..@s8`) from the already-approved ticket ACs (Linear `MAZ-160` in Todo = human gate passed). | `specs/game-result-metrics.feature`, Linear MAZ-160 |
| TDD Implementer (`.agents/tdd-implementer.md`) | Used | Red→Green: session metrics (injected clock + freeze-at-victory), snapshot plain metrics, and the scoring use case; then stripped presentation metrics. | tests below + `@s → test` map |
| Judge (`.agents/judge.md`) | Referenced | Pre-PR self-audit: `npm run verify` green; `presentation` no longer imports scoring/`Date.now`; scoring computed in application only. | `npm run verify`, `app/game.tsx` diff |
| Mutation Tester (`.agents/mutation.md`) | Not used | StrykerJS is not configured in the client repo (same as MAZ-144/149). New logic is covered by explicit value/branch assertions (freeze, clamps, won/not-won). | N/A |

## Scenario Coverage (@s ↔ test)

- @s1 (zero elapsed before start) → `GameSessionMetrics.test should_report_zero_elapsed_when_no_level_started`.
- @s2 (elapsed from injected clock while playing) → `GameSessionMetrics.test should_measure_elapsed_from_the_injected_clock_while_playing`.
- @s3 (freeze elapsed at victory) → `GameSessionMetrics.test should_freeze_elapsed_time_at_the_moment_the_level_is_won`.
- @s4 (moves from command history) → `GameSessionMetrics.test should_count_moves_from_the_recorded_extractions`.
- @s5 (snapshot exposes plain metrics) → `GameSessionMetrics.test should_expose_plain_elapsed_and_moves_on_the_application_snapshot`.
- @s6 (won outcome: strategy score/time/moves) → `ResolveLevelOutcomeUseCase.test should_resolve_a_won_outcome_with_strategy_score_time_and_moves`.
- @s7 (not-won → zero score) → `ResolveLevelOutcomeUseCase.test should_resolve_a_zero_score_when_the_level_is_not_won`.
- @s8 (ViewModel only maps state) → `GameViewModel.test should_not_expose_scoring_or_progress_metric_sources` (+ existing victory/defeat mapping tests).

## Result Obtained

Application / domain:
- `application/use-cases/game/GameSession.ts`: constructor takes the domain `Clock`
  port (default `systemClock`); `start()` records `startedAtMs`; `elapsedMs()` freezes
  the first time `LevelResult` is terminal so victory time is deterministic;
  `movesCount()` returns `CommandHistory.size`. No `Date.now()`.
- `application/use-cases/game/GameSnapshotDto.ts` + `GameSnapshotMapper.ts`: snapshot
  now carries plain `elapsedMs` and `movesCount`.
- `application/use-cases/game/LevelOutcomeDto.ts` + `ResolveLevelOutcomeUseCase.ts`
  (new): runs the injected `IScoringStrategy` over a `ScoreContext` and returns the
  already-calculated `{ status, won, score, timeSeconds, movesCount }` (time/moves
  clamped to the persistence floor `>= 1`, identical to the old route behavior).
- `application/facades/GameFacade.ts`: injects `scoring`/`clock` (defaults kept),
  builds the session with the clock, and exposes `getLevelOutcome()`.

Presentation:
- `presentation/view-models/GameViewModel.ts`: dropped `startedAtMs`/`finishedAtMs`/
  `elapsedMs()`/`movesCount()`/`markFinishedIfTerminal()` and all `Date.now()`. The
  extracted-arrow stack is kept only to map the UI list on undo (animation state).
- `presentation/hooks/useGameSession.ts`: now also returns the composed `facade`.
- `app/game.tsx`: the victory effect reads `facade.getLevelOutcome()` and forwards
  `score`/`timeSeconds`/`movesCount`; no `ScoreContext`/`TimeScoringStrategy`/
  `Date.now()` for domain metrics in the route.

Validation: `npm run verify` GREEN (56 suites / 272 tests, lint + typecheck +
coverage). 2 new application test suites (7 tests) + 1 presentation guard test.

## Team modifications pending human review

- Application tests are subject to mandatory human review (AGENTS §5): the new
  `GameSession`/`ResolveLevelOutcomeUseCase` tests and the metric-source guard.
- Confirm the `timeSeconds`/`movesCount` `>= 1` clamp belongs in the application use
  case (kept identical to the prior route behavior; backend expects `>= 1`).

## Lessons / Limitations

- `Date.now()` already had a domain port (`domain/level/Clock`); reusing it kept the
  refactor inward-only and made victory timing deterministic under test.
- `GameFacade.createDefault()` is intentionally retained — removing it and assembling
  the gameplay composition root is the sibling ticket `CA-008`. Exposing `facade` from
  `useGameSession` is the seam `CA-008` will compose against.
- The leaderboard/progress transport contracts (MAZ-138/MAZ-141) are unchanged; only
  the source of the numbers moved from presentation to application.
