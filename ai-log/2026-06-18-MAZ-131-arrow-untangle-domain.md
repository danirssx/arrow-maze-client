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
