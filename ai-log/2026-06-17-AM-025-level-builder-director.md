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
