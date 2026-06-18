# AI Usage Log: MAZ-134 Manual Arrow-Knot Levels (15 fixtures)

## Task / Problem

Resolve `MAZ-134` (Refactor T5): replace the maze-era manual level fixtures with 15 solvable arrow-untangle "knot" levels in the new `ArrowSpec` format, with progressive difficulty. This also unblocks the `level-build/fixtures/manualLevels.ts` red left by T4. Stacked on `MAZ-133`.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to implement `MAZ-134` (T5) following both repos' `AGENTS.md`, the team `MEMORY.md`, `Linear_MCP_Guideline.md`, prior ticket state, AI usage logging, validation, MEMORY/AGENTS update checks, commit/push/PR, and Linear updates.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Level-design guidance (progressive difficulty by arrow count / crossings / body length, no self-pointing, DAG-solvable) was already sealed in the refactor docs. | `Refactor_Arrow_Untangle_Tickets.md` (T5) |
| Planner/Slicer | Used | Scoped T5 to the client fixtures; deferred the backend seed reseed to T1 (MAZ-130), which owns the new schema. | this log, MEMORY note |
| TDD Implementer | Used | Wrote a greedy-solver test (proves each level's blocking graph is acyclic) + structure/progression/buildability tests, then authored the fixtures to green. | `tests/application/levels/ManualLevels.test.ts` |
| Judge | Referenced | Pre-PR self-audit: scoped eslint, confirmed fixtures no longer reference the deleted cell model, verified the solvability guarantee. | scoped `eslint`, `grep` |
| Mutation Tester | Not used | StrykerJS is not configured. | N/A |

## Result Obtained

- Rewrote `src/application/level-build/fixtures/manualLevels.ts`: 15 ordered `LevelDefinition`s of `ArrowSpec` arrows, progressive (2 → 10 arrows; Easy → Medium → Hard; growing body length; timed + reduced attempts on harder levels).
- Solvability guarantee: every arrow points only UP or RIGHT and is straight, which makes the blocking graph provably acyclic (a blocker always has a strictly smaller `row − col`), so a removal order always exists. A deterministic `knot(n)` helper lays out a crossing "top bar + hanging verticals + side bars" so levels have real dependencies, not just free arrows.
- `ManualLevelFixture` is now `{ id, order, difficulty, arrowCount, definition }` (dropped maze-era `expectedOptimalMoves`/`version`); `manualLevels` + `manualLevelDefinitions` exports preserved for `LevelSelectViewModel` (T6).
- Unblocks the `fixtures/manualLevels.ts` red left by T4 (the `level-build` layer now builds clean).

## Verification

- `npx jest tests/application/levels/ManualLevels.test.ts` → 32 tests passing (15 build-via-director + 15 greedy-solvable + structure/progression).
- `npx eslint src/application/level-build/fixtures tests/application/levels/ManualLevels.test.ts` → clean.
- `grep` confirms the fixtures no longer reference `CellSpec`/`CellType`/`LevelTemplate`/`optimalMoves`/`walls`.
- Full `npm run verify` still intentionally red until T6 (UI) lands (presentation layer).

## Team Modifications Pending Human Review

- **Backend seed reseed (`001_seed_levels.sql`) deferred to T1 (MAZ-130)** — it needs the new `ArrowSpec` JSONB schema, which does not exist yet. The client fixtures can be exported to seed format once the backend lands.
- The levels are **baseline procedural layouts** (straight UP/RIGHT arrows). They satisfy solvability + progression + no-self-pointing; curved/art-directed bodies can refine them later without changing the contract.
- `LevelSelectViewModel` (presentation) still references the old domain elsewhere and lands green in T6; the fixtures API it consumes (`manualLevels` → `id`/`definition`) was kept compatible.

## Lessons / Limitations

Constraining the fixtures to straight UP/RIGHT arrows turned "is this level solvable?" from a hand-verification burden into a proof: the `row − col` potential strictly decreases along every blocking edge, so no cycle can form. The greedy-solver test then doubles as the acceptance check for all 15 levels at once.
