# Mobile Game Engine — Design Patterns

This document maps the Gang of Four (and the directed-graph) patterns used by the Arrow Maze
mobile game engine to their key classes, layer, and the reason each was chosen. It exists for
defense and maintenance: an evaluator asking "where is pattern X / how do graphs work?" should
find the class, the layer, and the rationale here.

Scope note: only the **domain** and **application** layers are implemented so far (Milestone M2).
The `presentation`, `infrastructure`, and `framework` layers are scaffolding only; this document
makes no claims about screens, ViewModels, persistence, audio, or backend integration, which land
in later milestones (M3–M4).

Every class listed below carries a pattern header comment in its source file, so opening the file
confirms the pattern in place.

## Pattern catalog

### Composite — `domain`

- Key classes: `BoardGroup` (composite), `Cell`, `ArrowCell`, `WallCell`, `EmptyCell`, `ExitCell`
  (leaves), `IBoardComponent` / `ICell` (contracts).
- Files: `src/domain/board/BoardGroup.ts`, `src/domain/board/Cell.ts`,
  `src/domain/board/ArrowCell.ts`, `src/domain/board/WallCell.ts`,
  `src/domain/board/EmptyCell.ts`, `src/domain/board/ExitCell.ts`,
  `src/domain/board/IBoardComponent.ts`, `src/domain/board/ICell.ts`.
- Reason: a board is a tree of cells and groups. The Composite contract lets callers traverse an
  arbitrarily nested board uniformly (`toCells`, `find`, `size`) without branching on whether a
  node is a single cell or a group.

### Graph Model / Pathfinding — `domain`

- Key classes: `BoardGraph` (directed graph), `BoardGraphBuilder` (build from the Composite board),
  `PathfindingService` (BFS).
- Files: `src/domain/board/BoardGraph.ts`, `src/domain/board/BoardGraphBuilder.ts`,
  `src/domain/board/PathfindingService.ts`.
- Reason: movement legality and the optimal solution are modeled as a pure directed graph,
  decoupled from UI and storage. Movement rules are encoded as edges:
  - `WallCell` is excluded from graph nodes.
  - `ExitCell` is a terminal node (no outgoing edges).
  - `ArrowCell` creates a single outgoing edge in its arrow direction.
  - `EmptyCell` creates outgoing edges to navigable cardinal neighbors.
  - `PathfindingService` provides reachability, shortest path, and `optimalMoves` via BFS.

### Decorator — `domain`

- Key classes: `CellDecorator` (base wrapper), `LockedCellDecorator`, `CollectableCellDecorator`.
- Files: `src/domain/decorators/CellDecorator.ts`,
  `src/domain/decorators/LockedCellDecorator.ts`,
  `src/domain/decorators/CollectableCellDecorator.ts`.
- Reason: add behavior to a cell (block movement, carry collectable state) without modifying the
  cell classes or expanding the `CellType` set.

### Factory Method — `domain`

- Key classes: `ICellFactory` (contract), `CellFactory`.
- Files: `src/domain/factory/ICellFactory.ts`, `src/domain/factory/CellFactory.ts`.
- Reason: centralize the single `CellSpec` → concrete cell mapping so the rest of the domain never
  duplicates cell-type switches.

### Template Method — `domain`

- Key classes: `BaseLevel` (abstract), `NormalLevel`, `TimedLevel`.
- Files: `src/domain/level/BaseLevel.ts`, `src/domain/level/NormalLevel.ts`,
  `src/domain/level/TimedLevel.ts`.
- Reason: `BaseLevel.evaluate()` defines the invariant outcome algorithm (defeat hook → victory by
  reaching the exit → still playing); subclasses specialize only the protected `evaluateDefeat`
  hook. `TimedLevel` reads time through an injectable `Clock` to stay deterministic.

### State — `domain`

- Key classes: `GameContext` (context), `IGameState` / `BaseGameState`, `MenuState`,
  `PlayingState`, `PausedState`, `GameOverState`, `VictoryState`, `GamePhase`.
- Files: `src/domain/state/*.ts`.
- Reason: the lifecycle phase determines which gameplay commands are legal. The State pattern
  encodes phase-dependent behavior as polymorphism instead of conditionals. `GameContext` is
  intentionally not a global singleton — each session owns its context.

### Command — `domain`

- Key classes: `ICommand`, `MoveCommand` (reversible), `CommandHistory` (undo).
- Files: `src/domain/command/ICommand.ts`, `src/domain/command/MoveCommand.ts`,
  `src/domain/command/CommandHistory.ts`.
- Reason: player moves are reversible. `MoveCommand` snapshots state only after a successful move,
  and `CommandHistory` provides deterministic undo.

### Observer — `domain`

- Key classes: `IObservable` / `IGameObserver` (contracts), `GameEvent`
  (`MoveExecutedEvent`, `CellEscapedEvent`, `LevelFinishedEvent`), `GameEventEmitter` (subject).
  `BaseLevel` implements `IObservable`.
- Files: `src/domain/observer/*.ts`, plus the emission points in `src/domain/level/BaseLevel.ts`.
- Reason: emit gameplay events so the domain stays decoupled from UI and audio. `move()` emits
  `CellEscaped` + `MoveExecuted`; `evaluate()` emits `LevelFinished` once on the terminal
  transition.

### Strategy — `domain` (scoring) and `application` (level source)

- Key classes: `IScoringStrategy`, `StandardScoringStrategy`, `EfficiencyScoringStrategy`,
  `TimeBonusScoringStrategy`; `ILevelStrategy`, `JsonLevelStrategy`, `TutorialLevelStrategy`.
- Files: `src/domain/scoring/*.ts`, `src/application/level-build/ILevelStrategy.ts`,
  `src/application/level-build/JsonLevelStrategy.ts`,
  `src/application/level-build/TutorialLevelStrategy.ts`.
- Reason: interchangeable algorithms. Scoring strategies compute a deterministic `Score` from a
  `ScoreContext` (and never produce a positive score on defeat/time). Level strategies produce a
  `LevelDefinition` from different sources (JSON/API text, a built-in tutorial).

### Builder + Director — `application`

- Key classes: `ILevelBuilder`, `ConcreteLevelBuilder` (builder), `LevelDirector` (director).
- Files: `src/application/level-build/ILevelBuilder.ts`,
  `src/application/level-build/ConcreteLevelBuilder.ts`,
  `src/application/level-build/LevelDirector.ts`.
- Reason: build a playable level step by step. `ConcreteLevelBuilder.build()` rebuilds the board
  graph (via the Factory Method, Composite, and Graph patterns), validates start/exit and
  solvability with `PathfindingService`, computes `optimalMoves`, then instantiates the concrete
  `BaseLevel`. `LevelDirector` drives the builder through that recipe from a level strategy.

### Facade — `application`

- Key classes: `GameFacade`.
- Files: `src/application/facades/GameFacade.ts`.
- Reason: provide a compact gameplay API (`startLevel`, `playTurn`, `undoMove`, `pauseGame`,
  `resumeGame`, snapshots) for future ViewModels, hiding use-case wiring, `GameContext`, command
  history, and level construction.

## Class → layer → pattern map

| Pattern | Layer | Key class(es) | Folder |
| --- | --- | --- | --- |
| Composite | domain | `BoardGroup`, `Cell` + cell leaves | `src/domain/board` |
| Graph Model / Pathfinding | domain | `BoardGraph`, `BoardGraphBuilder`, `PathfindingService` | `src/domain/board` |
| Decorator | domain | `CellDecorator`, `LockedCellDecorator`, `CollectableCellDecorator` | `src/domain/decorators` |
| Factory Method | domain | `CellFactory`, `ICellFactory` | `src/domain/factory` |
| Template Method | domain | `BaseLevel`, `NormalLevel`, `TimedLevel` | `src/domain/level` |
| State | domain | `GameContext`, `*State`, `GamePhase` | `src/domain/state` |
| Command | domain | `MoveCommand`, `CommandHistory`, `ICommand` | `src/domain/command` |
| Observer | domain | `GameEventEmitter`, `GameEvent`, `IObservable`/`IGameObserver` (subject: `BaseLevel`) | `src/domain/observer` |
| Strategy (scoring) | domain | `IScoringStrategy`, `Standard`/`Efficiency`/`TimeBonus` | `src/domain/scoring` |
| Strategy (level source) | application | `ILevelStrategy`, `JsonLevelStrategy`, `TutorialLevelStrategy` | `src/application/level-build` |
| Builder + Director | application | `ConcreteLevelBuilder`, `ILevelBuilder`, `LevelDirector` | `src/application/level-build` |
| Facade | application | `GameFacade` | `src/application/facades` |

Supporting value objects (`Position`, `Direction`, `CellType`, `CellSpec`, `Difficulty`,
`LevelTemplate`, `Score`, `LevelResult`) live in `src/domain/value-objects` and `src/domain/level`
and are consumed across the patterns above.

## Dependency direction

```txt
app / framework / presentation  ->  infrastructure  ->  application  ->  domain
```

All patterns above respect this inward-only direction: `domain` imports nothing from outer layers,
and `application` (Builder/Director/Strategy/Facade) depends only on `domain` abstractions and
concrete domain classes — never on React, Expo, HTTP, storage, or framework code.
