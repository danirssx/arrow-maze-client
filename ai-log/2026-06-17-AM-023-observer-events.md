# AI Usage Log: AM-023 Domain Observer Events

## Task / Problem

Resolve MAZ-94 / AM-023 by emitting domain game events so the domain stays decoupled from
UI and audio. Add the Observer-pattern contracts and a level-driven subject that emits
`MoveExecuted`, `CellEscaped`, and `LevelFinished` events, with registration/unregistration.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to implement MAZ-94 while following `AGENTS.md` in both repositories,
`MEMORY.md`, `Linear_MCP_Guideline.md`, AI usage logging, validation, checking whether
`MEMORY.md`/`AGENTS.md` need updates, commit, push, PR, and Linear update rules.

## Result Obtained

Added a pure-domain Observer module under `src/domain/observer`:

- `IObservable` (subject contract: `register` / `unregister`) and `IGameObserver`
  (`onGameEvent`).
- `GameEvent` discriminated union: `MoveExecutedEvent` (from, to, moves), `CellEscapedEvent`
  (from), `LevelFinishedEvent` (carries `LevelResult`), with a `GameEventType` const-map
  discriminator.
- `GameEventEmitter`: reusable subject backed by a `Set` (idempotent register, safe
  unregister, snapshot iteration so an observer can unregister itself mid-notification).

Integrated the subject into `BaseLevel` (`src/domain/level/BaseLevel.ts`):

- `BaseLevel implements IObservable`, delegating to an internal `GameEventEmitter`.
- `move()` emits `CellEscapedEvent` then `MoveExecutedEvent` after a successful move.
- `evaluate()` emits `LevelFinishedEvent` once when the outcome first becomes terminal
  (won/lost); the result computation was extracted to a private `computeResult` helper.
- `restoreProgress()` resets the finished guard so a command undo keeps event emission
  consistent.

No changes were needed in the State layer: `PlayingState` already calls `level.move` and
`level.evaluate`, so events flow when an observer is registered on the active level. This
kept the change inside the ticket's touch paths (`src/domain/observer`, `src/domain/level`).

`AudioManager` and concrete ViewModels were intentionally not added (out of scope); the
domain depends only on the `IGameObserver` interface.

## Verification

- `npm test -- --runInBand tests/domain/observer` (11 tests: emitter registration/
  notification/self-removal, plus level integration covering both acceptance criteria).
- `npm run verify` (lint + typecheck + coverage): 79 tests across 16 suites passing,
  0 lint errors. Remaining lint output is pre-existing warnings only (no-redeclare on
  const-map value objects, useless-constructor on thin domain error subclasses).
- `domain/observer` coverage: 100% across statements, branches, functions, and lines.

## Team Modifications Pending Human Review

- Confirm whether `LevelFinished` should also be emitted directly from the State layer
  (e.g. when `PlayingState` transitions to Victory/GameOver) or remain level-driven.
- Confirm whether a dedicated `CellEntered` event is wanted alongside `CellEscaped`, or
  whether `MoveExecuted.to` already covers the "entered" case for AM-024 scoring/audio.
- Confirm the concrete `AudioManager` observer lands in AM-024/AM-025 as planned.

## Lessons / Limitations

Composition (a `GameEventEmitter` field) was preferred over making `BaseLevel` extend a
subject base class, since `BaseLevel` already sits in the Template Method hierarchy and the
emitter is independently unit-testable. Emitting `LevelFinished` from `evaluate` required a
one-shot guard so repeated evaluations (the State layer evaluates on every move) do not spam
observers; the guard resets on `restoreProgress` to stay correct under command undo.
