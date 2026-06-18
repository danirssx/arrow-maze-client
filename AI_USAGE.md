# AI Usage

This file compiles significant AI-assisted work for the Arrow Maze client.

## Tools Used

| Tool | Model/Version | Role |
| --- | --- | --- |
| Codex | GPT-5 | Project setup, configuration, documentation scaffolding |

## Task Log

Raw entries live in `ai-log/` and are compiled into this section before delivery.

<!-- AI_LOG_ENTRIES_START -->


---

# AI Usage Log: AM-017 Mobile Guardrails

## Task / Problem

Resolve AM-017 by hardening the mobile architecture and test setup without implementing gameplay. The user also pointed to the root `design/` folder as the visual reference for future mobile UI work.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to implement Linear ticket MAZ-88 / AM-017 and noted that the referenced design folder is `design/`.

## Result Obtained

- Removed `--passWithNoTests` from the mobile test script.
- Added `test:coverage` and `verify` scripts.
- Updated PR CI to run tests with coverage.
- Added a real Jest smoke test for i18n setup.
- Documented mobile architecture guardrails in `README.md` and `CONTRIBUTING.md`.
- Moved the design reference folder into `arrow-maze-client/design/`.
- Documented `design/` as the presentation design source of truth while keeping domain/application independent from design assets.
- Configured the approved ArrowMaze blue/lavender/reward palette in `tailwind.config.js`.
- Updated the PR template to require `npm run verify`.

## Team Modifications Pending Human Review

- Confirm which finalized assets from `design/` should be copied into `src/assets/` when UI tickets start consuming runtime images.
- Confirm whether mobile coverage thresholds should be enforced now or after AM-018/AM-029 add substantial domain/application code.

## Lessons / Limitations

AM-017 should enforce the development gates and architectural boundaries, but it should not implement gameplay or visual screens. The design folder is useful as a reference for future presentation tickets, not as a dependency for core layers. In Expo/React Native, `src/assets/` is the right default for runtime imports; `public/` should be reserved for web-only static files.


---

# AI Usage Log: AM-018 Board Value Objects and Composite Cells

## Task / Problem

Resolve AM-018 / MAZ-89: model the Arrow Maze board and its base cells as pure
domain (no React Native, Expo, HTTP, storage, or scoring), using Value Object
and Composite patterns.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked the agent to implement Linear ticket MAZ-89 following the Linear
MCP guideline and the client/backend/root guidelines to the letter.

## Result Obtained

Value objects in `src/domain/value-objects`:
- `Position` (non-negative integer coordinates, validated `of`, `translate`,
  `equals`, `toKey`).
- `Direction` (canonical UP/DOWN/LEFT/RIGHT with grid deltas, `opposite`,
  `fromName`).
- `CellType` and `Difficulty` as frozen const maps + union types.
- `CellSpec` (position + type + optional direction, with the invariant that a
  direction exists iff the cell is an arrow).
- `LevelTemplate` (grid dimensions, difficulty, cell specs; validates positive
  dimensions, in-bounds cells, and unique positions; `cellAt` rejects
  out-of-board queries).
- `errors.ts` with a `DomainError` base and typed errors for controlled failure.

Composite pattern in `src/domain/board`:
- `IBoardComponent` (Component) and `ICell` (Leaf contract, extends component).
- `Cell` abstract leaf base plus `ArrowCell`, `WallCell`, `EmptyCell`,
  `ExitCell` leaves with pure behavior (`isExit`, `isBlocking`).
- `BoardGroup` (Composite) delegating `size`/`has`/`find`/`toCells` to children,
  supporting nested groups, and rejecting duplicate cell positions.

Tests: 23 domain tests (value objects + composite) under
`tests/domain/value-objects` and `tests/domain/board`; full suite 29 passing.

## Team Modifications Pending Human Review

- Confirm placement of domain error classes inside `value-objects/errors.ts` and
  `board/errors.ts` (the ticket touch paths did not list a dedicated errors
  folder); a future ticket may centralize a shared domain error kernel.
- Confirm whether a `LevelTemplate -> BoardGroup` factory should live in the
  domain or in the application layer (left out to stay within AM-018 scope).
- Confirm the cell behavior surface (`isExit`, `isBlocking`) is the right
  contract before movement/scoring tickets (AM-019+) build on it.

## Lessons / Limitations

Making `ICell` extend `IBoardComponent` keeps leaves and groups
interchangeable, so callers traverse an arbitrarily nested board uniformly
without any UI knowledge. ESLint's `no-restricted-imports` for the domain layer
confirms the model stays free of React/React Native/Expo. Movement rules,
scoring, and persistence are intentionally out of scope.


---

# AI Usage Log: MAZ-123 Expo SDK 54 Upgrade

## Task / Problem

Resolve the Expo Go incompatibility reported in `MAZ-123` by upgrading the mobile client from Expo SDK 53 to SDK 54.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to resolve Linear issue `MAZ-123`, where Expo Go could not run the app because the project used an incompatible SDK version.

## Result Obtained

Updated Expo and related native/runtime packages to SDK 54-compatible versions, including React Native 0.81.5, React 19.1.0, Expo Router 6, React Native Reanimated 4, and required peer dependencies for Expo Router and Reanimated.

## Verification

- `npx expo install --check`
- `npx expo-doctor`
- `npm run verify`
- `npm run build`
- `npx expo config --type public`

## Team Modifications Pending Human Review

- Restart any running Expo CLI sessions before testing in Expo Go.
- Confirm the app opens from a clean `npx expo start --clear` session on the target device.
- Review the remaining moderate `npm audit` findings separately, because automatic force fixes may introduce unrelated dependency churn.

## Lessons / Limitations

Expo SDK upgrades must be validated with `expo-doctor`, not only by changing the `expo` package version. Expo Router and Reanimated require direct peer dependencies under SDK 54.


---

# AI Usage Log: Branch Workflow Setup

## Task / Problem

Configure the repository branch workflow after `main` and `develop` were created.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to configure branches for the client and backend repositories and clarify what must be set in GitHub before starting the workflow.

## Result Obtained

Updated worktree scripts and agent/contribution documentation so feature work starts from `origin/develop`, feature PRs target `develop`, and only human-approved release PRs target `main`.

## Team Modifications Pending Human Review

- Confirm whether the team wants `develop` or `main` as the GitHub default branch.
- Configure branch protection rules in GitHub for `main` and `develop`.

## Lessons / Limitations

When a project uses both `main` and `develop`, agent instructions must be explicit about PR targets to avoid accidental release-branch work.


---

# AI Usage Log: NativeWind and Zustand Setup

## Task / Problem

Configure NativeWind for the client Home screen and add Zustand only where useful for presentation state, while protecting game logic from UI-library dependencies.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked to add NativeWind to `arrow-maze-client`, use it in Home and future screens, ensure game logic cannot use NativeWind, and consider Zustand if useful. The user provided NativeWind docs and asked Codex to look up Zustand docs.

## Result Obtained

Added NativeWind/Tailwind/Babel/Metro setup, NativeWind TypeScript types, a global Tailwind CSS file, a styled Home screen, and a small Zustand presentation store for Home UI state. Updated architecture rules and lint restrictions so NativeWind and Zustand cannot be imported from domain/application layers.

## Team Modifications Pending Human Review

- Confirm the Home visual direction before expanding it into real screens.
- Confirm whether Zustand should remain limited to UI state or later receive approved application-facing adapters.
- Review dependency versions after Expo SDK upgrades.

## Lessons / Limitations

NativeWind is a presentation concern, not a game architecture concern. Zustand is useful for view-model/UI state but must not replace domain entities, value objects, use cases, or approved application ports.


---

# AI Usage Log: Project Setup

## Task / Problem

Create the initial client repository configuration and governance scaffolding based on the project build guideline.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to build the project setup following `Build Completo del proyecto.md`, `Config de Agentes completa.md`, and the documentation guidance, with emphasis on configuration, build, agents, Zed, and Git worktrees.

## Result Obtained

Generated initial Expo/TypeScript configuration, Clean Architecture folders, lint/typecheck/test scripts, GitHub Actions, Husky/Commitlint, AI usage templates, PR template, agent prompts, and worktree scripts.

## Team Modifications Pending Human Review

- Review dependency versions before freezing the baseline branch.
- Confirm whether optional client tools such as AsyncStorage, SQLite, Axios, or Expo AV should be added.
- Complete human modifications after reviewing this setup.

## Lessons / Limitations

The setup intentionally avoids domain entities, use cases, decorators, and game patterns because those require team approval under `AGENTS.md`.


---

# AI Usage Log: Section 6 and Section 7 Compliance

## Task / Problem

Add explicit project rules requiring README completeness and AI usage traceability according to Section 6 and Section 7 of the project statement.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user provided compliance text in Spanish and asked to add it to the guideline or `AGENTS.md`, emphasizing README completeness, AI documentation, critical review, tests, and team responsibility.

## Result Obtained

Updated `AGENTS.md` with a mandatory Section 6 and Section 7 compliance section, and added an Academic Compliance section to `README.md`.

## Team Modifications Pending Human Review

- Confirm the final wording matches the professor's statement.
- Expand README sections for SOLID, AOP strategy, and diagrams as the implementation decisions are approved.

## Lessons / Limitations

Compliance rules should live where agents cannot miss them: `AGENTS.md`, with a README summary for human contributors and evaluators.


---

# AI Usage Log: AM-018 Directed Board Graph

## Task / Problem

Extend AM-018 / MAZ-89 after the planning update that added directed graph and pathfinding logic to the mobile board domain.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to update Linear tickets with the new board graph scope and then continue implementing MAZ-89.

## Result Obtained

Added pure domain graph components in `src/domain/board`:

- `BoardGraph`, a directed movement graph over navigable board positions.
- `BoardGraphBuilder`, translating Composite board cells into directed edges.
- `PathfindingService`, providing BFS-based reachability, shortest path, and `optimalMoves` calculation.
- `PositionNotInGraphError` for controlled graph mutation failures.

Movement semantics implemented for AM-018:

- `WallCell` does not become a graph node.
- `ExitCell` is a terminal node.
- `ArrowCell` creates only one outgoing edge in its arrow direction.
- `EmptyCell` creates outgoing edges to navigable cardinal neighbors.

## Verification

- `npm test -- --runInBand tests/domain/board/BoardGraph.test.ts tests/domain/board/BoardGroup.test.ts`
- `npm run verify`

## Team Modifications Pending Human Review

- Confirm whether future level templates will introduce an explicit `StartCell`; AM-018 currently receives start and exit positions as pathfinding inputs.
- Confirm whether empty cells should remain four-directional or receive stricter movement rules in AM-020/AM-022.

## Lessons / Limitations

The graph belongs in `src/domain/board` because movement validity is a game-domain invariant. Application and presentation layers should consume graph-backed results through later builders/facades instead of inspecting graph internals directly.


---

# AI Usage Log: AM-019 Cell Factory and Decorators

## Task / Problem

Resolve MAZ-90 / AM-019 by adding domain-level cell decorators and a centralized cell factory after AM-018 introduced board value objects, Composite cells, and the directed graph.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to implement MAZ-90 while following `AGENTS.md` in both repositories, `MEMORY.md`, `Linear_MCP_Guideline.md`, AI usage logging, validation, commit, push, PR, and Linear update rules.

## Result Obtained

Added pure domain components:

- `CellDecorator` as the base Decorator wrapper for `ICell`.
- `LockedCellDecorator`, which blocks movement without modifying wrapped cell classes.
- `CollectableCellDecorator`, which adds deterministic collectable state.
- `ICellFactory` and `CellFactory`, centralizing `CellSpec` to concrete cell creation.

Adjusted the `ICell.direction` contract to be explicitly `Direction | undefined` and updated `Cell` / `ArrowCell` so decorators can preserve arrow directions under `exactOptionalPropertyTypes`.

## Verification

- `npm test -- --runInBand tests/domain/cells/CellFactory.test.ts tests/domain/cells/CellDecorator.test.ts`
- `npm test -- --runInBand tests/domain/cells/CellFactory.test.ts tests/domain/cells/CellDecorator.test.ts tests/domain/board/BoardGraph.test.ts`
- `npm run typecheck`

## Team Modifications Pending Human Review

- Confirm whether locked cells should always be graph-blocking or later support an unlock policy in AM-020/AM-022.
- Confirm whether collectables should have scoring value metadata in AM-024 or remain ID-only until scoring is implemented.

## Lessons / Limitations

The factory intentionally centralizes the only cell-type switch introduced by this ticket. Decorators remain domain-pure and can be used by `BoardGroup` / `BoardGraphBuilder` without presentation or storage dependencies.


---

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


---

# AI Usage Log: AM-021 Game Lifecycle State Pattern

## Task / Problem

Resolve MAZ-92 / AM-021 by separating the domain gameplay lifecycle from future MVVM UI state using the approved State pattern.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to implement MAZ-92 while reviewing both repository `AGENTS.md` files, `MEMORY.md`, `Linear_MCP_Guideline.md`, AI usage logging, validation, memory/agent updates, commit, push, PR, and Linear update rules.

## Result Obtained

Added pure domain lifecycle state components in `src/domain/state`:

- `GameContext`, the State pattern context.
- `IGameState` and `BaseGameState`.
- `MenuState`, `PlayingState`, `PausedState`, `GameOverState`, and `VictoryState`.
- `GamePhase`, `InvalidGameStateActionError`, and `MissingActiveLevelError`.

`PlayingState` is the only state that accepts movement. It delegates movement to the active `BaseLevel`, evaluates `LevelResult`, and transitions to `VictoryState` or `GameOverState` when appropriate. `PausedState` rejects movement through a controlled domain error.

## Verification

- `npm test -- --runInBand tests/domain/state/GameContext.test.ts`
- `npm run typecheck`
- `npm run verify`

## Team Modifications Pending Human Review

- Confirm whether a singleton-style `GameContext` provider should be introduced later at the application/framework wiring layer. This ticket intentionally avoids a domain global singleton.
- Confirm whether terminal states should support restarting directly or leave restart orchestration to application use cases in AM-026.

## Lessons / Limitations

The State pattern belongs in domain because it protects lifecycle invariants such as "paused games cannot move." It remains separate from MVVM UI state; presentation should later map `GamePhase` through a ViewModel instead of using these classes directly.


---

# AI Usage Log: AM-022 Command History and Undo

## Task / Problem

Resolve MAZ-93 / AM-022 by implementing the approved Command pattern for reversible gameplay moves in the mobile domain engine.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to implement MAZ-93 while reviewing both repository `AGENTS.md` files, `MEMORY.md`, `Linear_MCP_Guideline.md`, AI usage logging, validation, memory/agent updates, commit, push, PR, and Linear update rules.

## Result Obtained

Added pure domain command components in `src/domain/command`:

- `ICommand`, the reversible command contract.
- `MoveCommand`, which delegates movement validation to `GameContext`/`BaseLevel` and restores a deterministic snapshot on undo.
- `CommandHistory`, a LIFO history that records only successfully executed commands.
- Controlled command errors for empty history, undo-before-execute, and double execution.

Extended `BaseLevel` with graph-backed `canMoveTo` and validated `restoreProgress`, and extended `GameContext` with snapshot/restore support for phase and result. Added command tests covering valid moves, invalid graph moves, deterministic undo, winning-move undo, empty history, double execution, and undo-before-execute.

## Verification

- `npm test -- --runInBand tests/domain/command/MoveCommand.test.ts`
- `npm run verify`

## Team Modifications Pending Human Review

- Confirm whether AM-026 should wrap `CommandHistory` inside `GameFacade` as session state or instantiate it per active level.
- Confirm whether future collectable effects need command-specific effect snapshots when AM-024 scoring/AM-026 gameplay orchestration expands beyond position and lifecycle state.

## Lessons / Limitations

Undo belongs in the domain command layer because it must protect movement invariants and replay/rollback deterministically. Presentation should trigger undo through future application use cases, not by mutating `BaseLevel` or `GameContext` directly.


---

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


---

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


---

# AI Usage Log: AM-025 Level Builder, Director and Generation Strategies

## Task / Problem

Resolve MAZ-96 / AM-025 by building playable domain levels from JSON/API/local definitions in
the application layer, including the directed board graph and solvability validation. First
application-layer ticket: combine Builder, Director, Strategy, Factory Method, and
Graph/Pathfinding.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to implement MAZ-96 while following `AGENTS.md` in both repositories,
`MEMORY.md`, `Linear_MCP_Guideline.md`, AI usage logging, validation, checking whether
`MEMORY.md`/`AGENTS.md` need updates, commit, push, PR, and Linear update rules.

## Result Obtained

Added the application module `src/application/level-build`:

- `LevelDefinition` (DTO) + `LevelKind` (`NORMAL`/`TIMED`): source-agnostic description a
  strategy produces and the builder consumes (template, start, kind, optional time limit).
- `ILevelBuilder` / `ConcreteLevelBuilder` (Builder): fluent stepwise configuration; `build()`
  rebuilds the board via `CellFactory` (Factory Method) + `BoardGroup` (Composite) +
  `BoardGraphBuilder` (Graph), validates start/exit/solvability with `PathfindingService`,
  computes `optimalMoves`, then instantiates `NormalLevel` or `TimedLevel`.
- `LevelDirector` (Director): drives the builder through the fixed recipe from a strategy's
  definition.
- `ILevelStrategy` + `JsonLevelStrategy` (parses and validates raw JSON/API text) +
  `TutorialLevelStrategy` (fixed, always-solvable normal level).
- `errors.ts`: application-layer `ApplicationError` base with `InvalidLevelDefinitionError`,
  `UnsolvableLevelError`, `LevelBuildStateError`.

`RandomLevelStrategy` was intentionally NOT added — the ticket marks it optional "only if
already approved", and there is no approval on record. HTTP adapters and screens were left out
of scope; `JsonLevelStrategy` consumes already-fetched text, so the application layer stays
transport-free. The builder validates explicitly before constructing the level, so callers
only ever see controlled `ApplicationError`s, never raw parser or domain errors.

## Verification

- `npm test -- --runInBand tests/application` (15 directed/builder/json tests; grew to 20 with
  added edge cases).
- `npm run verify` (lint + typecheck + coverage): 120 tests across 24 suites passing,
  0 lint errors. Remaining lint output is pre-existing warnings only (no-redeclare on const-map
  value objects, useless-constructor on thin error subclasses).
- `application/level-build` coverage: 98% statements/lines (the only uncovered spots are
  deep defensive JSON validation branches; the type-only interface files report 0% because
  they have no runtime code).

## Team Modifications Pending Human Review

- Confirm whether `RandomLevelStrategy` is approved for a follow-up ticket (left out here).
- Confirm the `LevelDefinition` JSON schema (field names/shape) matches the planned backend
  level catalog / API contract before the HTTP adapter ticket.
- Confirm whether `optimalMoves` should be persisted on the template/definition instead of
  recomputed at build time for very large boards.

## Lessons / Limitations

Validating solvability in the builder (rebuilding the graph independently) keeps the change
inside the ticket's touch paths without modifying the domain `BaseLevel`, at the cost of
building the board graph twice (once to validate, once inside the level). For the small mobile
boards this is negligible and preserves a clean layer boundary. Pre-validating in the builder
also lets the application surface its own typed errors instead of leaking domain
`InvalidLevelStartError`/`MissingExitError`.


---

# AI Usage Log: AM-026 Gameplay Use Cases and GameFacade

## Task / Problem

Resolve MAZ-97 / AM-026 by adding application-layer gameplay orchestration for starting a level, playing graph-validated turns, undoing moves, pausing, resuming, restarting, and exposing observable snapshots through `GameFacade`.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to implement MAZ-97 while reviewing both repository `AGENTS.md` files, `MEMORY.md`, `Linear_MCP_Guideline.md`, previous ticket state, AI usage logging, validation, memory/agent updates, commit, push, PR, and Linear update rules.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Linear already contained the approved spec, scope, layers, patterns, dependencies, and acceptance criteria; no new design interview was needed. | MAZ-97 description |
| Planner/Slicer | Referenced | Linear already contained the AM-026 slice and dependencies; no new tickets were created or moved to Todo. | MAZ-97, MEMORY dependency check |
| TDD Implementer | Used | Wrote failing application tests first, then implemented use cases/facade and reran targeted plus full verification. | `tests/application/game/GameFacade.test.ts`, `npm test -- --runInBand tests/application/game/GameFacade.test.ts`, `npm run verify` |
| Judge | Referenced | Performed a pre-PR self-audit against layer boundaries, approved patterns, tests, conventional commit, and AI log presence. | `src/application/use-cases/game`, `src/application/facades`, this log |
| Mutation Tester | Not used | Mutation testing is not configured yet; no Stryker run was performed. | N/A |

## Result Obtained

Added application gameplay orchestration:

- `GameSession` to hold `GameContext`, `CommandHistory`, selected level strategy, and `optimalMoves`.
- `StartLevelUseCase`, `PlayTurnUseCase`, `UndoLastMoveUseCase`, `PauseGameUseCase`, and `ResumeGameUseCase`.
- `GameSnapshotDto` and mapper returning phase, result, position, move count, undo availability, and optimal moves.
- `GameFacade` as the Facade-pattern boundary for future ViewModels.
- Application tests covering start, graph-validated play turn, invalid graph move rejection, undo, undo after victory, pause/resume, restart, and controlled session errors.

## Verification

- `npm test -- --runInBand tests/application/game/GameFacade.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run verify`

## Team Modifications Pending Human Review

- Confirm whether `GameFacade.restartLevel()` should remain facade-level reuse of `StartLevelUseCase` or become a dedicated `RestartLevelUseCase` in a later ticket.
- Confirm whether future ViewModels should consume the current plain `PositionDto` shape directly or wrap it in a presentation-specific state mapper in AM-031/AM-045.

## Lessons / Limitations

The application layer can orchestrate stateful gameplay without leaking `BoardGraph`, storage, HTTP, React, or navigation concerns. Undo remains domain-owned through Command, while the facade only exposes observable snapshots for future MVVM integration.


<!-- AI_LOG_ENTRIES_END -->

## Critical Evaluation

### Approximate AI-Assisted Work

| Area | Estimate |
| --- | --- |
| Boilerplate and configuration | Pending |
| Pattern implementation | Pending |
| Game business logic | Pending |
| Tests | Pending |
| Documentation | Pending |
| Architectural decisions | 0% unless explicitly approved by the team |

### AI Failure Cases

Pending. Add concrete cases discovered during reviews.

### Reflection

Pending. Complete before final delivery with what accelerated delivery, what required review, and what the team would do differently.
