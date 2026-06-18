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
