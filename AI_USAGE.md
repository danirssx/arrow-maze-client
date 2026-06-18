# AI Usage

This file compiles significant AI-assisted work for the Arrow Maze client.

## Tools Used

| Tool | Model/Version | Role |
| --- | --- | --- |
| Codex | GPT-5 | Project setup, configuration, documentation scaffolding (AM-017, AM-021, AM-022, AM-026, AM-027, AM-028) |
| Claude Code | Claude Opus 4.8 | AM-018, AM-020, AM-023, AM-024, AM-025 |
| Claude Code | Claude Sonnet 4.6 | AM-042 through AM-047 (Daniella Cruz) |

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


---

# AI Usage Log: AM-027 Manual Levels and Difficulty Progression

## Task / Problem

Resolve MAZ-98 / AM-027 by adding 15 manual, builder-compatible mobile levels with version metadata, expected optimal moves, start/exit definitions, time limits where applicable, and progressive difficulty.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to implement MAZ-98 while reviewing both repository `AGENTS.md` files, `MEMORY.md`, `Linear_MCP_Guideline.md`, previous ticket state, AI usage logging, validation, memory/agent updates, commit, push, PR, and Linear update rules.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Linear already contained the approved scope, out-of-scope boundaries, layer, patterns, dependencies, and acceptance criteria. No new spec interview was needed. | MAZ-98 description |
| Planner/Slicer | Referenced | Linear already contained the AM-027 slice and dependency on AM-025; no new ticket slicing was performed. | MAZ-98, MEMORY dependency check |
| TDD Implementer | Used | Wrote fixture validation tests first, then implemented the manual levels and reran targeted plus full verification. | `tests/application/levels/ManualLevels.test.ts`, `npm test -- --runInBand tests/application/levels/ManualLevels.test.ts`, `npm run verify` |
| Judge | Referenced | Performed a pre-PR self-audit against application-layer boundaries, approved Builder-compatible data, tests, conventional commit, and AI log presence. | `src/application/level-build/fixtures`, this log |
| Mutation Tester | Not used | Mutation testing is not configured yet; no Stryker run was performed. | N/A |

## Result Obtained

Added manual level fixtures in `src/application/level-build/fixtures`:

- 15 ordered level fixtures.
- `version`, `expectedOptimalMoves`, and `LevelDefinition` metadata per level.
- Easy, Medium, and Hard difficulty groups.
- Timed levels for later medium/hard progression.
- Directed arrow paths ending in exactly one exit, with wall cells for obstacle complexity.
- `manualLevels` and `manualLevelDefinitions` exports.

Added application tests to validate count, unique IDs, order, builder construction, start/exit presence, time-limit consistency, expected optimal moves, and monotonic progression score.

## Verification

- `npm test -- --runInBand tests/application/levels/ManualLevels.test.ts`
- `npm run typecheck`
- `npm run verify`

## Team Modifications Pending Human Review

- Confirm whether backend AM-011 should seed from this exact fixture shape or receive a serialized mapper/export in a later ticket.
- Confirm whether UI level selection should display `version` and `expectedOptimalMoves`, or treat those as internal metadata for validation/scoring only.

## Lessons / Limitations

Keeping manual levels under `application/level-build/fixtures` avoids treating level definitions as presentation assets while preserving compatibility with `LevelDirector`. The builder remains the source of truth for solvability and optimal-move validation.


---

# AI Log - AM-028 Complete Mobile Domain Engine Test Suite

## Task / Problem

Complete the mobile domain engine test suite for `MAZ-99 / AM-028`, covering board graph/pathfinding, movement, walls/exit behavior, timeout, undo, scoring, observer behavior, and state transitions without introducing UI, infrastructure, HTTP, storage, Expo, or React Native dependencies.

## Tool and Model

- Tool: Codex CLI coding agent.
- Model: GPT-5 based Codex session.

## Prompt Used

The user asked to implement Linear ticket `MAZ-99` while following the project workflow:

- Read both repository `AGENTS.md` files.
- Read `MEMORY.md`.
- Read `Linear_MCP_Guideline.md` and previous ticket state.
- Register AI usage and validate checks.
- Review whether `MEMORY.md` or repo `AGENTS.md` need updates.
- Commit, push, open PR, and update Linear.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Used the Linear issue/spec to keep the scope limited to domain tests and avoid production or architecture changes. | Linear issue `MAZ-99`; touched only `tests/domain`. |
| Planner/Slicer | Referenced | Followed the planned AM-028 slice from Linear: domain-only test coverage for graph, movement, timeout, undo, scoring, and observer behavior. | Linear issue `MAZ-99`; branch `test/mobile-domain-engine-AM-028`. |
| TDD Implementer | Referenced | Added behavior-focused AAA tests using `should_<expected>_when_<condition>` naming and ran validation gates. No production code was required because existing behavior already satisfied the new tests. | Updated domain tests; `npm test -- --runInBand --coverage --collectCoverageFrom='src/domain/**/*.ts' tests/domain`; `npm run verify`. |
| Judge | Referenced | Audited dependency boundaries, scope, test fragility, and acceptance criteria before finishing. | Domain-only imports in tests; no React Native, Expo, HTTP, storage, presentation, or infrastructure imports. |
| Mutation Tester | Not used | StrykerJS mutation testing is not configured for this repo yet, so mutation testing was out of scope. | N/A |

## Result Obtained

- Added domain edge-case coverage for `BoardGraph` and `PathfindingService`: unknown source/target nodes, duplicate nodes/edges, defensive neighbor copies, missing start/exit nodes, and `start === exit`.
- Expanded cell decorator/factory tests for pass-through behavior, exit delegation, missing arrow direction, and unknown malformed cell type.
- Expanded `BaseLevel` movement tests for invalid restore positions and invalid move counts.
- Expanded `GameContext` state tests for missing active level, snapshot restore, base-state action rejections, and terminal-state restart rejection.
- Domain coverage after focused run: `97.99%` statements, `96.79%` branches, `97.35%` functions, `98.44%` lines.
- Full verification passed with existing lint warnings only.

## Team Modifications Pending Human Review

- Review the added domain tests for academic traceability and confirm they match the intended game rules.
- Existing lint warnings remain outside this ticket scope and were not introduced by AM-028.

## Lessons / Limitations

- The domain engine was already above the 80% coverage target before this ticket, so the value of AM-028 was hardening edge cases rather than increasing coverage mechanically.
- Interface and barrel files still appear as `0%` in coverage output because they do not contain runtime behavior; this is expected and not a missing behavior test.
- Mutation testing was not executed because the repository does not currently configure StrykerJS.


---

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


---

# AI Usage Log: AM-030 Document Mobile Game Engine Patterns

## Task / Problem

Resolve MAZ-101 / AM-030 by documenting the GoF (and directed-graph) patterns of the mobile
game engine for defense and maintenance: a per-pattern catalog with key class, layer, and
reason, plus a class → layer map. Docs-only ticket.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to implement MAZ-101 following `AGENTS.md` in both repositories, `MEMORY.md`,
`Linear_MCP_Guideline.md`, AI usage logging (with the required agent-role table), validation,
checking whether `MEMORY.md`/`AGENTS.md` need updates, commit, push, PR, and Linear update
rules.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Spec taken from Linear AM-030; `.agents/spec-partner.md` conventions followed, not re-run. | Linear MAZ-101 |
| Planner/Slicer | Referenced | Ticket already planned/sliced in `ArrowMaze_Linear_Tickets_Plan.md`. | Linear MAZ-101 |
| TDD Implementer | Not used | Docs-only ticket; no production code or tests. | N/A |
| Judge | Referenced | Coherence self-check: every documented class verified against a `grep` of pattern headers in `src`; no claims about unimplemented layers. | `npm run verify`, source scan |
| Mutation Tester | Not used | No code under test in this ticket. | N/A |

## Result Obtained

Documentation only (no source/test changes):

- `docs/design-patterns.md` (new): catalog of the 11 patterns — Composite, Graph
  Model/Pathfinding, Decorator, Factory Method, Template Method, State, Command, Observer,
  Strategy (scoring + level source), Builder+Director, Facade — each with key class(es), files,
  layer, and rationale; a class → layer → pattern table; the directed-graph movement rules; and
  the dependency direction.
- `docs/architecture.md`: added a "Design Patterns" section summarizing patterns by layer and
  linking to `design-patterns.md`.
- `README.md`: added a "Design Patterns" section (table of the 11 patterns + key classes) linking
  to the detailed doc, satisfying the Section 6 requirement to document design patterns.

The class → pattern map was derived from an actual `grep` of pattern header comments in `src`, so
acceptance criterion 2 (every pattern class carries a header) was verified, not assumed. The docs
explicitly state that `presentation`/`infrastructure`/`framework` are scaffolding only, so no
claims are made about unimplemented features (UI, persistence, backend).

## Verification

- Source scan: `grep -rnE "pattern" --include=*.ts src` confirmed all 11 patterns have header
  comments across `domain` and `application`.
- `npm run verify` (lint + typecheck + coverage): 200 tests across 28 suites passing, 0 lint
  errors (docs change does not affect code).

## Team Modifications Pending Human Review

- Confirm the patterns doc should be referenced from the academic defense deck / Section 6
  checklist, and whether the required `docs/class-diagram.*` diagrams should embed this map.
- Revisit the doc when the presentation layer (MVVM, AM-045) lands to add its patterns.

## Lessons / Limitations

Generating the class → pattern map from a header `grep` rather than from memory kept the document
faithful to the code and made the "every pattern class has a header" criterion verifiable. The
doc is intentionally limited to implemented layers to honor the "no claims about unimplemented
features" Definition of Done.


---

# AI Usage Log: AM-031 Domain-to-ViewModel Observer Contract

## Task / Problem

Resolve MAZ-102 / AM-031 by defining the contract that lets a future `GameViewModel` observe the
domain without leaking UI into the domain or forcing presentation to read domain internals
(`BoardGraph`, level classes). Provide UI-neutral event DTOs, an observer bridge, a board
snapshot mapper, and document the `GameViewModel` responsibilities.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to implement MAZ-102 following `AGENTS.md` in both repositories, `MEMORY.md`,
`Linear_MCP_Guideline.md`, AI usage logging (with the agent-role table), validation, checking
whether `MEMORY.md`/`AGENTS.md` need updates, commit, push, PR, and Linear update rules.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Spec taken from Linear AM-031; `.agents/spec-partner.md` conventions followed. | Linear MAZ-102 |
| Planner/Slicer | Referenced | Ticket already planned/sliced in the tickets plan. | Linear MAZ-102 |
| TDD Implementer | Used | Built the contract guided by mapper/bridge/facade tests covering both acceptance criteria. | `tests/application/game/GameEventContract.test.ts`, PR #20 |
| Judge | Referenced | Self-review via `.agents/judge.md` checklist + `npm run verify`; coordination with the presentation owner flagged for AM-045. | Linear comment, `npm run verify` |
| Mutation Tester | Not used | No mutation run for this boundary ticket. | N/A |

## Result Obtained

New application module `src/application/dto` (UI-neutral domain→presentation boundary):

- `GameEventDto` — discriminated union mirroring domain `GameEvent` with plain payloads
  (`PositionDto`, `GameResultDto`); reuses the domain `GameEventType` string discriminator.
- `IGameEventListener` — presentation-facing observer interface, with documented `GameViewModel`
  responsibilities (subscribe via the facade, translate DTOs to UI state, never import
  `BoardGraph`/level classes/`Position`/`LevelResult`).
- `GameEventMapper.mapGameEvent` — single domain `GameEvent` → `GameEventDto` translation point.
- `GameEventBridge` — implements the domain `IGameObserver`, maps events, and forwards DTOs to an
  `IGameEventListener` (keeps presentation from implementing the domain observer directly).
- `BoardSnapshotDto` + `mapBoardSnapshot` — UI-neutral board layout (dimensions, start, exit,
  cells with type and direction name) mapped from a `LevelDefinition`, so screens render the grid
  without reading `BoardGraph`/`BoardGroup`.

Facade integration (`src/application/facades/GameFacade.ts`):

- `addEventListener` / `removeEventListener` and `getBoardSnapshot`.
- The facade owns one `GameEventBridge` that it (re)registers on each new level (start/restart)
  and fans out to all listeners. The level definition is captured once at start (single
  `createDefinition` call) to back the board snapshot, with no domain or use-case changes.

The domain layer was not modified (kept pure); the bridge subscribes through the existing
`BaseLevel`/`IObservable` API.

## Verification

- `npm test -- --runInBand tests/application/game/GameEventContract.test.ts` (11 tests:
  event mapping, bridge forwarding, board snapshot mapping, facade subscribe/win/remove,
  board-snapshot and pre-start error cases).
- `npm run verify` (lint + typecheck + coverage): 211 tests across 29 suites passing, 0 lint
  errors (remaining output is pre-existing warnings only). `application/dto` 100% and
  `application/facades` 100% statements.

## Team Modifications Pending Human Review

- Definition of Done requires coordination with the presentation owner (Daniella Cruz) before
  AM-045: confirm the `GameEventDto`/`BoardSnapshotDto` shapes and the `IGameEventListener`
  contract match the planned `GameViewModel`/MVVM design. Flagged in the Linear comment.
- Decide whether `GameSnapshotDto` should also carry the current `score` (open question from
  AM-029) so the ViewModel reads it from one snapshot.

## Lessons / Limitations

Bridging the domain `IGameObserver` into a DTO-only `IGameEventListener` at the application
boundary lets presentation stay free of domain imports while keeping the domain observer pure.
Capturing the `LevelDefinition` once at `startLevel` (and reusing it for the board snapshot)
avoided exposing the board through the domain `BaseLevel` API, keeping all changes within the
ticket's touch paths (`application/dto`, `application/facades`).


---

# AI Log - AM-042 - Implement mobile HTTP, storage, mappers and AOP adapters

## Task / problem
Implement external gateways and mappers so that presentation/application layers
do not depend on concrete libraries (Axios, AsyncStorage).
Define IHttpClient, ILocalStorage, AxiosHttpClientAdapter, AsyncStorageAdapter,
HttpError, StorageError, IMapper, and AOP wrappers for use cases.

## Tool and model
Claude Code - claude-sonnet-4-6

## Prompt used
Pre-checks: AGENTS.md (client repo) reviewed, MEMORY.md reviewed,
existing ports (Logger.ts) and ConsoleLogger studied to match style.
AM-013 / AM-017 branches inspected for contract and tsconfig constraints.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Spec from MAZ-113 guided in-scope items | MAZ-113 |
| Planner/Slicer | Referenced | ports → errors → adapters → mappers → AOP → tests | file list |
| TDD Implementer | Referenced | jest-expo + mock axios/AsyncStorage | test files |
| Judge | Not used | No .agents/ directory configured | N/A |
| Mutation Tester | Not used | No .agents/ directory configured | N/A |

## Result obtained
Created:
- `src/application/ports/IHttpClient.ts` — HTTP client interface
- `src/application/ports/ILocalStorage.ts` — local storage interface
- `src/application/ports/UseCase.ts` — generic use case interface
- `src/infrastructure/http/HttpError.ts` — typed app error codes from HTTP status
- `src/infrastructure/http/AxiosHttpClientAdapter.ts` — Pattern: Adapter; wraps Axios
- `src/infrastructure/storage/StorageError.ts` — typed error for storage failures
- `src/infrastructure/storage/AsyncStorageAdapter.ts` — Pattern: Adapter; wraps AsyncStorage
- `src/infrastructure/mappers/IMapper.ts` — generic mapper contract
- `src/application/aspects/LoggingUseCaseWrapper.ts` — Pattern: AOP; logs start/success/error
- `src/application/aspects/ErrorHandlingUseCaseWrapper.ts` — Pattern: AOP; centralised error handling
- `tests/infrastructure/http/AxiosHttpClientAdapter.test.ts` — 5 tests
- `tests/infrastructure/storage/AsyncStorageAdapter.test.ts` — 5 tests
- `tests/application/aspects/LoggingUseCaseWrapper.test.ts` — 3 tests (incl. no-token-leak)

All 44 tests pass. typecheck clean.

## Team modifications pending human review
- IMapper.toDto is declared but concrete mappers (progress, auth) await AM-043/AM-044 specs
- ErrorHandlingUseCaseWrapper.onError is typed as `ErrorHandler = (err: unknown) => never`;
  team may prefer a Result<T,E> pattern instead
- AxiosHttpClientAdapter baseURL is constructor-injected; DI wiring is pending AM-043

## Lessons / limitations
- exactOptionalPropertyTypes:true requires omitting undefined keys from AxiosRequestConfig
  rather than setting them to undefined
- DoD "no tokens logged": verified by test `should_not_log_input_values_to_prevent_token_leakage`


---

# AI Usage Log: Agent Role Traceability Documentation

## Task / Problem

Clarify whether ticket work has been following the configured `.agents/` workflow and update documentation so future `ai-log/` entries explicitly record which agent roles were used and how.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked whether each ticket has used the configured agents from each repo and requested documentation changes so every `ai-log/` records why and how each agent was used.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Reviewed the role boundary to distinguish actual spec alignment from referencing an approved Linear spec. | `.agents/spec-partner.md`, `AGENTS.md` |
| Planner/Slicer | Referenced | Reviewed planner responsibilities and documented when existing Linear tickets count as referenced planning rather than a new planner run. | `.agents/planner.md`, `docs/zed-worktree-agents.md` |
| TDD Implementer | Referenced | Updated logging requirements for implementation tickets that use test-guided or TDD-style work. | `.agents/tdd-implementer.md`, `docs/ai-log-template.md` |
| Judge | Referenced | Added guidance for recording self-audit versus a separate judge review. | `.agents/judge.md`, `docs/zed-worktree-agents.md` |
| Mutation Tester | Referenced | Added explicit `Not used` / future `Used` guidance until mutation tooling is configured. | `.agents/mutation.md`, `docs/ai-log-template.md` |

## Result Obtained

Updated client documentation so future logs must include an `Agent Roles Used` table with `Used`, `Referenced`, or `Not used` status for every configured role. Added `docs/ai-log-template.md` as the source template for future logs.

## Verification

- Documentation-only change; reviewed modified Markdown files.

## Team Modifications Pending Human Review

- Decide whether prior historical `ai-log/` entries should be retroactively annotated or left as-is to avoid overstating past agent usage.
- Decide whether future PR templates should also require checking the `Agent Roles Used` section.

## Lessons / Limitations

Past work followed `AGENTS.md` constraints and role intent, but logs did not make the distinction between literal agent execution and same-session referenced roles. Future logs must be explicit and auditable.


---

# AI Log - AM-043 - Implement mobile auth session and backend contract tests

## Task / problem
Consume auth backend endpoints and validate client DTOs against backend OpenAPI
shapes. Implement session manager (Singleton), auth repository (Adapter),
auth use cases, and contract tests for auth/progress/leaderboard responses.

## Tool and model
Claude Code - claude-sonnet-4-6

## Prompt used
Pre-checks: AGENTS.md (client repo) reviewed, MEMORY.md reviewed,
AM-042 files brought in via git checkout from prior branch.
Backend openApiSpec.ts studied for exact response shapes (LoginResponse,
RegisterResponse, ProgressResponse, LeaderboardResponse).

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Spec from MAZ-114 guided session boundary / contract DoD | MAZ-114 |
| Planner/Slicer | Referenced | ports → DTOs → mapper → repo → session → use cases → tests | file list |
| TDD Implementer | Referenced | Fake implementations for all ports in tests | test files |
| Judge | Not used | No .agents/ directory configured | N/A |
| Mutation Tester | Not used | No .agents/ directory configured | N/A |

## Result obtained
Created:
- `src/application/auth/AuthSession.ts` — session model { userId, username, role, accessToken }
- `src/application/ports/IAuthRepository.ts` — register/login port
- `src/application/ports/ISessionManager.ts` — get/save/clear port
- `src/infrastructure/mappers/auth/AuthDtos.ts` — DTOs matching backend OpenAPI
- `src/infrastructure/mappers/auth/AuthMapper.ts` — Pattern: Adapter; toSession, toRegisterOutput
- `src/infrastructure/repositories/HttpAuthRepository.ts` — Pattern: Adapter, Repository
- `src/framework/session/SessionManager.ts` — Pattern: Singleton; persists session via ILocalStorage
- `src/application/auth/LoginUseCase.ts` — calls repo.login + sessionManager.save
- `src/application/auth/RegisterUseCase.ts`
- `src/application/auth/LogoutUseCase.ts`
- `src/application/auth/GetCurrentSessionUseCase.ts`
- `tests/infrastructure/repositories/HttpAuthRepository.test.ts` — 3 tests
- `tests/framework/session/SessionManager.test.ts` — 4 tests
- `tests/contract/auth.contract.test.ts` — 5 tests (incl. no rawPassword in session)
- `tests/contract/progress.contract.test.ts` — 4 tests
- `tests/contract/leaderboard.contract.test.ts` — 4 tests

65 total tests passing. typecheck clean.

## Team modifications pending human review
- SessionManager.resetInstance() exposed for testing; team may prefer a factory instead
- accessToken stored as plain string in AsyncStorage (JSON); encryption pending team decision
- No refresh-token flow implemented — backend openApiSpec does not currently expose one

## Lessons / limitations
- DoD "no secrets in fixtures": all fixtures use placeholder strings
  (accessToken: 'contract-test-token-placeholder', no real passwords)
- Contract tests are static shape checks — not live API calls; team
  should run real integration tests before production deploy


---

# AI Log - AM-044 - Implement mobile offline-first progress and leaderboard repos

## Task / problem
Implement client-side repositories for offline-first progress and remote leaderboard.
ViewModels must not call storage or HTTP directly — facades enforce the boundary.

## Tool and model
Claude Code - claude-sonnet-4-6

## Prompt used
Pre-checks: AGENTS.md (client repo) reviewed, MEMORY.md reviewed.
AM-042/AM-043 files brought in via git checkout. Backend openApiSpec studied
for /progress/me, /progress/sync, /leaderboard/:levelId, /leaderboard/scores shapes.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Spec from MAZ-115 guided offline-first and facade DoD | MAZ-115 |
| Planner/Slicer | Referenced | ports → DTOs → repos → facades → tests order | file list |
| TDD Implementer | Referenced | Fake implementations for all ports | test files |
| Judge | Not used | No .agents/ directory configured | N/A |
| Mutation Tester | Not used | No .agents/ directory configured | N/A |

## Result obtained
Created:
- `src/application/ports/IProgressRepository.ts` — load/save/markPendingSync/clearPendingSync
- `src/application/ports/ILeaderboardRepository.ts` — getTopScores/submitScore
- `src/infrastructure/mappers/progress/ProgressDtos.ts`, `ProgressMapper.ts`
- `src/infrastructure/mappers/leaderboard/LeaderboardDtos.ts`
- `src/infrastructure/repositories/LocalProgressRepository.ts` — Pattern: Adapter, Repository
- `src/infrastructure/repositories/HttpProgressRepository.ts` — fetchRemote/sync with Bearer token
- `src/infrastructure/repositories/HttpLeaderboardRepository.ts` — Pattern: Adapter, Repository
- `src/application/facades/ProgressFacade.ts` — Pattern: Facade; offline-first load/saveOffline/sync
- `src/application/facades/LeaderboardFacade.ts` — Pattern: Facade
- `tests/infrastructure/repositories/LocalProgressRepository.test.ts` — 5 tests
- `tests/infrastructure/repositories/HttpLeaderboardRepository.test.ts` — 2 tests
- `tests/application/facades/ProgressFacade.test.ts` — 6 tests
- `tests/application/facades/LeaderboardFacade.test.ts` — 2 tests

59 tests passing. typecheck clean.

## Team modifications pending human review
- HttpProgressRepository is not behind an interface (only used by ProgressFacade);
  team may want IRemoteProgressRepository port for full testability
- Offline merge strategy is local-wins (send local completedLevels to /sync);
  backend ProgressMergePolicy handles union + best-score logic
- No TTL/cache-invalidation on LocalProgressRepository — team decision pending

## Lessons / limitations
- DoD "ViewModels do not call storage/HTTP directly" enforced by facades accepting
  only IProgressRepository and HttpProgressRepository (not IHttpClient or ILocalStorage)
- Acceptance criterion "marks pending sync locally": verified by
  should_mark_pending_sync_when_saving_offline in ProgressFacade.test.ts
- Acceptance criterion "merges and clears pending sync": verified by
  should_clear_pending_sync_after_successful_sync


---

# AI Log - AM-045 - Implement mobile MVVM screens and navigation

## Task / problem
Build the main mobile UI flow with MVVM boundaries: Expo routes, screens,
ViewModels, UI states, UIController, translated visible text, and presentation
tests. Resume and close the ticket after the previous agent stopped during
validation.

## Tool and model
Codex - GPT-5

## Prompt used
Pre-checks: client and backend `AGENTS.md` reviewed, `MEMORY.md` reviewed,
`Linear_MCP_Guideline.md` reviewed, and Linear MAZ-116 read before validation.
Existing AM-031 observer contract and AM-044 facades were used as the boundary
for the presentation layer.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | MAZ-116 scope and acceptance criteria defined the UI/MVVM behavior to validate | Linear MAZ-116 |
| Planner/Slicer | Referenced | Work was kept inside the AM-045 slice: presentation routes/screens/ViewModels/controllers/tests | changed file list |
| TDD Implementer | Referenced | Existing tests were validated and boundary fixes were made before rerunning checks | `tests/presentation` |
| Judge | Referenced | Presentation imports were audited so screens/ViewModels do not depend directly on domain or infrastructure internals | `rg "@/domain|@/infrastructure" src/presentation` |
| Mutation Tester | Not used | Mutation testing was not required for this ticket closeout | N/A |

## Result obtained
Created / validated the AM-045 presentation flow:
- Expo routes for home, level select, game, victory, defeat, leaderboard,
  progress, and settings.
- MVVM screens and ViewModels for game, level select, leaderboard, progress,
  settings, and home navigation.
- `GameUIController` so cell taps call `GameViewModel.playTurn` instead of
  invoking use cases or domain objects from the screen.
- `GameViewModel` consumes the application observer DTO contract and updates
  `GameUiState` to victory/defeat when level-finished events arrive.
- Reusable presentation components for board rendering, cards, headers,
  buttons, empty/error states, rewards, and screen layout.
- EN/ES i18n keys for all visible text introduced by the new screens.

Closeout fixes before PR:
- Removed direct presentation imports from domain value objects/status types.
- Removed direct presentation imports from infrastructure error/audio types.
- Kept app route files as framework composition points that can wire concrete
  dependencies into presentation screens.

## Validation
- `npm test -- --runInBand tests/presentation` passed: 9 suites, 29 tests.
- `npm run typecheck` passed.
- `npm run verify` passed: lint 0 errors, typecheck OK, coverage OK,
  53 suites and 309 tests passed.

## Team modifications pending human review
- Lint still reports existing warnings in prior domain/application/infrastructure
  files, but no lint errors and the verify script passes.
- Some route-level wiring uses local/demo data until the remaining integration
  flow is fully exercised against the deployed backend.

## Lessons / limitations
- Presentation must consume application DTOs/facades and not `BoardGraph`,
  level classes, storage, HTTP adapters, or domain value objects directly.
- The framework `app/` route layer is the accepted composition boundary for
  concrete adapter/view-model construction.


---

# AI Log - AM-046 - Implement mobile settings, i18n, audio and UX polish

## Task / problem
Complete the visible user experience: language switch (EN/ES), sound mute,
friendly error messages with i18n, and loading/error/empty state components.

## Tool and model
Claude Code - claude-sonnet-4-6

## Prompt used
Pre-checks: AGENTS.md (client repo) reviewed, MEMORY.md reviewed.
Existing i18n setup (i18n.ts, locales) and AppErrorBoundary studied.
AM-042 files brought in from prior branch.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Spec from MAZ-117 guided in-scope items | MAZ-117 |
| Planner/Slicer | Referenced | locales → ports → infra → components → tests | file list |
| TDD Implementer | Referenced | Fake IAudioPlayer; @testing-library/react-native for SettingsScreen | test files |
| Judge | Not used | No .agents/ directory configured | N/A |
| Mutation Tester | Not used | No .agents/ directory configured | N/A |

## Result obtained
Created / updated:
- `src/framework/i18n/locales/en.json` + `es.json` — added settings/errors/states keys
- `src/application/ports/ISettingsRepository.ts` — { language, muted } port
- `src/application/ports/IAudioPlayer.ts` — SoundKey + play port
- `src/infrastructure/storage/SettingsRepository.ts` — Pattern: Adapter; persists via ILocalStorage
- `src/infrastructure/audio/AudioFacade.ts` — Pattern: Facade, Singleton; mute blocks all play()
- `src/infrastructure/audio/ExpoAudioAdapter.ts` — Pattern: Adapter; wraps expo-av
- `src/presentation/components/LoadingState.tsx` — uses t('states.loading')
- `src/presentation/components/ErrorState.tsx` — maps HttpError codes to translated messages
- `src/presentation/components/EmptyState.tsx` — variants: default/progress/leaderboard
- `src/presentation/screens/SettingsScreen.tsx` — language toggle + mute Switch
- `src/framework/errors/AppErrorBoundary.tsx` — updated hardcoded string to i18n key
- `tests/infrastructure/audio/AudioFacade.test.ts` — 5 tests (mute/unmute/singleton)
- `tests/infrastructure/storage2/SettingsRepository.test.ts` — 3 tests
- `tests/presentation/screens/SettingsScreen.test.tsx` — 5 tests (i18n + interactions)

57 tests passing. typecheck clean. 0 lint errors.

## Team modifications pending human review
- ExpoAudioAdapter requires sound asset files in assets/sounds/ — not bundled here
- SettingsScreen is a pure presentational component; a ViewModel/hook to wire
  ISettingsRepository is needed before connecting to navigation
- i18n.changeLanguage() is called imperatively in SettingsScreen; team may prefer
  a context/provider approach for persistence across navigation

## Lessons / limitations
- DoD "no hardcoded visible strings without translation": AppErrorBoundary was the
  only existing hardcoded string — replaced with i18n.t('errors.generic')
- Acceptance criterion "mute enabled → no sound plays": verified by
  should_not_play_sound_when_muted in AudioFacade.test.ts
- Acceptance criterion "language changes to Spanish → text is translated": verified by
  should_show_spanish_labels_when_language_is_es in SettingsScreen.test.tsx


---

# AI Log - AM-047 - Complete mobile contract tests and release documentation

## Task / problem
Close client-backend compatibility with a complete contract test suite and
provide release documentation so a new developer can run, test, and build
the app from scratch.

## Tool and model
Claude Code - claude-sonnet-4-6

## Prompt used
Pre-checks: AGENTS.md (client repo) reviewed, MEMORY.md reviewed.
AM-046 source files brought in from prior branch. Backend openApiSpec
studied for all endpoint shapes. Existing README.md and CI workflow reviewed
before updating to avoid duplication.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Spec from MAZ-118 guided contract scope and README DoD | MAZ-118 |
| Planner/Slicer | Referenced | contract tests → README → docs/RELEASE.md order | file list |
| TDD Implementer | Referenced | Static fixtures, no real network calls | test files |
| Judge | Not used | No .agents/ directory configured | N/A |
| Mutation Tester | Not used | No .agents/ directory configured | N/A |

## Result obtained
Created / updated:
- `tests/contract/levels.contract.test.ts` — 9 tests for GET /levels and GET /levels/:id
- `tests/contract/auth.contract.test.ts` — 6 tests (LoginResponse, RegisterResponse)
- `tests/contract/progress.contract.test.ts` — 5 tests (ProgressResponse + ProgressMapper)
- `tests/contract/leaderboard.contract.test.ts` — 4 tests (LeaderboardResponse)
- `README.md` — added Prerequisites, env vars, detailed quality/build commands,
  link to RELEASE.md
- `docs/RELEASE.md` — full release guide: Expo Go, EAS preview/production,
  web build, CI, contract test run command, versioning, screenshots placeholder
- `docs/screenshots/.gitkeep` — placeholder for AM-048 screenshots

68 tests passing. typecheck clean. 0 lint errors.

## Team modifications pending human review
- GET /levels and GET /levels/:id contract fixtures are based on domain model
  (LevelDto shape); must be reconciled with actual backend spec when AM-013 lands
- `eas.json` not created — EAS profile setup requires team EAS account credentials
- Screenshots placeholder in docs/screenshots/ to be filled after AM-048 UI polish

## Lessons / limitations
- DoD "docs align with actual commands": all commands verified against package.json
  scripts (start/android/ios/web/lint/typecheck/test/test:coverage/verify/build)
- Contract tests make no real network calls — static fixtures only


---

# AI Usage Log: MAZ-131 Arrow Untangle Domain (ArrowEntity, BoardGroup, CollisionService)

## Task / Problem

Resolve `MAZ-131` (Refactor T2) of the Arrow Untangle pivot: replace the maze-navigation board domain with the untangle-puzzle engine foundation. Delete the cell/Composite/`BoardGraph`/`PathfindingService` model and add `ArrowEntity`, an occupancy-indexed `BoardGroup` (`Map<coordKey, Set<arrowId>>`), and a `CollisionService` that decides extraction via a directional raycast on an unbounded board. This is the base ticket; the rest of the engine (T3-T7) migrates on top of it.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user approved the sealed refactor spec (`Refactor_Arrow_Untangle_Tickets.md`, `Mecanica_Juego_Arrow_Untangle.md`), chose a big-bang sequencing strategy, and asked to implement `MAZ-131` while following both repos' `AGENTS.md`, the team `MEMORY.md`, `Linear_MCP_Guideline.md`, prior ticket state, AI usage logging, validation, MEMORY/AGENTS update checks, commit/push/PR, and Linear updates.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Used | Ran a full grill-me spec session that sealed the mechanic (Model B raycast, unbounded canvas, overlaps, win/no-loss, attempts/defeat, DAG solvability) into the refactor docs before any code. | `Refactor_Arrow_Untangle_Tickets.md`, `Mecanica_Juego_Arrow_Untangle.md`, MAZ-131 |
| Planner/Slicer | Used | Sliced the refactor into MAZ-130..137 with coverage mapping to the superseded AM tickets and blocking edges. | MAZ-130..137, §3 of the tickets doc |
| TDD Implementer | Used | Wrote domain tests (AAA, `should_*_when_*`) for `ArrowSpec`, `BoundingBox`, `ArrowEntity`, `BoardGroup`, `CollisionService`, and negative-`Position`, then implemented to green. | `tests/domain/board/*`, `tests/domain/value-objects/*`, this branch |
| Judge | Referenced | Pre-PR self-audit against `AGENTS.md` layer boundaries (no RN/Expo/HTTP in domain), scoped eslint, and a grep confirming no dangling references to deleted modules in the touched layer. | scoped `eslint` (exit 0), `grep` clean |
| Mutation Tester | Not used | StrykerJS is not configured in this repo. | N/A |

## Result Obtained

Deleted the maze-navigation engine in the board + value-objects layer:
- `src/domain/board/{ICell,IBoardComponent,Cell,ArrowCell,WallCell,EmptyCell,ExitCell,BoardGraph,BoardGraphBuilder,PathfindingService}.ts`
- `src/domain/value-objects/{CellSpec,CellType,LevelTemplate}.ts`
- `src/domain/factory/*` and `src/domain/decorators/*`
- Dead tests: old `board/{BoardGraph,BoardGroup}.test.ts`, `value-objects/{CellSpec,LevelTemplate}.test.ts`, `tests/domain/cells/*`

Added the untangle domain:
- `value-objects/ArrowSpec` (immutable; validates orthogonal connectivity, no self-intersection, head not pointing back into its own body).
- `value-objects/BoundingBox` (camera framing only; never used by rules).
- `board/ArrowEntity` (entity with `active`/`extracted` reversible state).
- `board/BoardGroup` (occupancy index `Map<coordKey, Set<arrowId>>`; overlaps allowed; queries filter by `isActive` so removal = state flip).
- `board/CollisionService.canExtract` (unbounded directional raycast; own body transparent; any other active arrow strictly ahead on the head's axis blocks).
- `Position` now allows negative integer coordinates; `Direction.fromName` throws the new `InvalidDirectionError`.
- Updated `board/errors.ts` (`DuplicateArrowError`, `ArrowNotFoundError`), `value-objects/errors.ts` (added `InvalidDirectionError`, `InvalidArrowSpecError`, `InvalidBoundingBoxError`; removed cell/template errors), and both barrels.

## Verification

- `npx jest tests/domain/board tests/domain/value-objects` → 8 suites, 38 tests passing.
- `npx eslint src/domain/board src/domain/value-objects tests/domain/board tests/domain/value-objects` → exit 0 (clean).
- `grep` for deleted-module references inside the touched layer → clean.
- NOTE: full `npm run verify` is **intentionally red** under the approved big-bang strategy, because consumers (`level`/`state`/`command`/`scoring`/`application`/`presentation`) still reference the deleted engine until tickets T3-T7 migrate them. This PR is a Draft and must not merge to `develop` until the refactor chain is green.

## Team Modifications Pending Human Review

- Confirm the big-bang sequencing: T3 (`MAZ-132`), T4 (`MAZ-133`), T6 (`MAZ-135`), T7 (`MAZ-136`) must migrate consumers off the deleted engine before `develop` can go green; PRs stay Draft until then.
- `docs/design-patterns.md` and `docs/architecture.md` still describe the removed Composite/Graph/Pathfinding patterns; they must be revised once the chain lands (out of T2 scope).
- Confirm `attempts`/scoring/level-build contracts as their tickets (T1/T4/T5) consume the new `ArrowSpec`/`LevelDefinition`.

## Lessons / Limitations

Modeling arrow removal as an `ArrowEntity` state flip (instead of mutating the occupancy index) keeps `CollisionService` and future undo trivial: the index is built once and queries filter by `isActive`. On an unbounded board the raycast is tested against the finite set of other active cells (no edge to walk to). The big-bang approach trades a temporarily red tree for a direct path to the target engine, validated layer-by-layer in isolation.


---

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


---

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


---

# AI Log - Fix Leaderboard Authenticated Score Submit

## Task / Problem

Update the mobile client after the backend changed `POST /leaderboard/scores` to require JWT authentication and to read `userId` from the token instead of accepting it in the request body.

Also verify the M4 mobile integration ports around HTTP, auth/session, progress, leaderboard, storage, and contract tests.

## Tool and Model

- Tool: Codex CLI coding agent.
- Model: GPT-5 based Codex session.

## Prompt Used

The user asked to verify the M4 milestone port connections and implement the frontend fix for `POST /leaderboard/scores`:

- Remove `userId` from the request body.
- Add `Authorization: Bearer <token>` to the request.
- Keep `GET /leaderboard/:levelId` unauthenticated.
- Validate the integration.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Used the backend change description as the accepted spec and kept scope limited to the mobile integration contract. | User-provided Fix #8; backend `LeaderboardController`/routes inspection. |
| Planner/Slicer | Referenced | Mapped the fix to application port, facade, repository, and contract-test updates without touching domain/gameplay. | `ILeaderboardRepository`, `LeaderboardFacade`, `HttpLeaderboardRepository`, contract tests. |
| TDD Implementer | Referenced | Updated tests around expected behavior first, then adjusted the port/repository implementation to pass them. | Leaderboard facade, repository, and contract tests. |
| Judge | Referenced | Checked dependency direction and verified that M4 integration tests pass without React Native, UI, or backend runtime coupling. | `npm run verify`; M4 targeted Jest suites. |
| Mutation Tester | Not used | Mutation testing is not configured in this repository. | N/A |

## Result Obtained

- `SubmitScoreInput` no longer includes `userId`.
- `ILeaderboardRepository.submitScore` and `LeaderboardFacade.submitScore` now require an `accessToken` argument.
- `HttpLeaderboardRepository.submitScore` sends `Authorization: Bearer <token>` and posts a body without `userId`.
- `GET /leaderboard/:levelId` remains unauthenticated.
- Contract tests now represent authenticated score submission without spoofable `userId`.
- M4 integration tests for auth, progress, leaderboard, HTTP, storage, session, and contracts pass.

## Team Modifications Pending Human Review

- Backend Swagger/OpenAPI currently still documents `userId` inside `SubmitScoreRequest` and does not mark `POST /leaderboard/scores` with bearer auth in `origin/develop`; that should be fixed in the backend docs/contract.
- Future UI/ViewModel callers must pass the stored session token when submitting leaderboard scores.

## Lessons / Limitations

- The fix is compile-time enforced by removing `userId` from `SubmitScoreInput`.
- No real network request was executed; validation used repository and contract tests with mocked HTTP clients.


<!-- AI_LOG_ENTRIES_END -->

## Critical Evaluation

### Approximate AI-Assisted Work

| Area | Estimate |
| --- | --- |
| Boilerplate and configuration | ~80% AI-drafted, human-reviewed |
| Pattern implementation (Adapter, Facade, Singleton, AOP) | ~70% AI-drafted, human-reviewed and corrected |
| Game business logic (domain engine AM-018 to AM-028) | ~60% AI-drafted, human-confirmed |
| Tests | ~75% AI-drafted, human-reviewed; all pass `npm run verify` |
| Documentation | ~85% AI-drafted, human-reviewed |
| Architectural decisions | 0% — all approved by team before implementation |

### AI Failure Cases

- **AM-042**: `exactOptionalPropertyTypes: true` caused multiple typecheck failures in `AxiosHttpClientAdapter` — setting optional properties to `undefined` is disallowed. Fixed by building config objects conditionally.
- **AM-042**: TS2719 (`T is not assignable to type T`) in `AxiosHttpClientAdapter`. Fixed by removing generic at call site and casting `res.data as T`.
- **AM-044**: `ProgressFacade` imported `HttpProgressRepository` (infrastructure) from application layer — ESLint `import/no-restricted-paths` caught the violation. Fixed by extracting `IRemoteProgressRepository` port.
- **AM-047**: `git stash` applied over staged untracked files caused a merge state. Fixed by committing staged files first.

### Reflection

AI assistance significantly accelerated infrastructure adapter scaffolding and contract test generation. Human review was critical for:
1. Architecture boundary enforcement (no concrete infrastructure imports in application layer).
2. TypeScript strict-mode compliance (`exactOptionalPropertyTypes`).
3. Security invariants (no input values logged, no secrets in fixtures, no API keys in code).

The team would use AI confidently for pattern scaffolding and test skeleton generation, and would add strict linting earlier in the project to catch boundary violations before they compound.
