# AI Usage Log: MAZ-237 — Make client CollisionService raycast 3D

## Task / Problem

Resolve `MAZ-237` (C3) of the M13 "3D Volumetric Boards" milestone: make the client `CollisionService` extraction raycast operate on the 3D board. Stacked on `MAZ-236` (Direction 6 + ArrowSpec 3D) → `MAZ-235` (Position 3D). This is the live untangle physics that runs in the client: an arrow can be extracted iff the straight ray from its head along its `direction` world axis meets no cell of another active arrow.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to implement `MAZ-237` following both repos' `AGENTS.md`, the team `MEMORY.md`, `Linear_MCP_Guideline.md`, prior ticket/plan context, AI-usage logging + validation checks, MEMORY/AGENTS update review, commit/push/PR, and Linear updates; and, because this is a refactor, to review the whole context and every affected ticket.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | M13 grill-me spec sealed the volumetric raycast (6 world axes, own body transparent, any other active arrow strictly ahead on the head's axis blocks). | `../M13_3D_Boards_Plan.md`, `MAZ-237` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Milestone pre-sliced into MAZ-225..244; this is C3 (stacked on C2/C1). No separate `.feature` authored. | `MAZ-237` |
| TDD Implementer (`.agents/tdd-implementer.md`) | Used | Red → Green: failing tests for a blocked depth ray and a planar ray that must ignore a cell at a different depth; then generalised `isStrictlyAhead` to 6 axes. Then a second hardening pass (per-branch perpendicular-guard tests, strictly-ahead boundary, inactive-arrow guard) to bite mutants. | `tests/domain/board/CollisionService.test.ts`, `src/domain/board/CollisionService.ts` |
| Judge (`.agents/judge.md`) | Referenced | Confirmed `BoardGroup` needs no change (its occupancy `Map`/`Set` already keys on the 3D `Position.toKey()`; `activeArrowsAt`/`place` are dimension-agnostic) and `BoundingBox`/`activeBounds` is camera framing (render scope, not rules). Full suite + `npm run verify` green. | grep, `npm run verify` exit 0 |
| Mutation Tester (`.agents/mutation.md`) | Used | `stryker --mutate CollisionService.ts` → 70.97% first pass; after targeted tests **87.10%** (≥ break 80). | stryker clear-text reports |

## Result Obtained

`src/domain/board/CollisionService.ts`:
- `isStrictlyAhead` generalised from 2 axes to 6. Each direction moves along exactly one world axis (exactly one non-zero delta among `rowDelta`/`colDelta`/`zDelta`); a cell is strictly ahead iff it shares the two perpendicular coordinates and is forward on the moving axis:
  - row ray (`Up`/`Down`): `cell.col === head.col && cell.z === head.z && (cell.row - head.row) * rowDelta > 0`
  - column ray (`Left`/`Right`): `cell.row === head.row && cell.z === head.z && (cell.col - head.col) * colDelta > 0`
  - depth ray (`Forward`/`Back`): `cell.row === head.row && cell.col === head.col && (cell.z - head.z) * zDelta > 0`
- `canExtract` is unchanged (own body skipped by id, overlaps respected); doc comment updated to describe the 3D world-axis ray.
- **`BoardGroup` untouched** — it already indexes on the 3D `toKey`.

Tests: `CollisionService.test.ts` grew from 7 to 17 cases (AAA, `should_*_when_*`), covering depth-ray clear/blocked, and, per branch, a blocker that is forward on the axis but off a perpendicular coordinate (different depth / different column / different row) which must NOT block — plus a strictly-ahead boundary (overlap exactly on the head) and the already-extracted guard.

## Verification

- `npm run verify` (lint + typecheck + coverage) → exit 0; **539 tests**; `CollisionService.ts` at 100% coverage. Full suite green — the extra branch and z-guards did not regress the 2D behaviour (planar arrows have `z = 0`, so the depth guard is a no-op for them).
- Mutation: `CollisionService.ts` **87.10%** (≥ break 80), up from 70.97% after the hardening pass. Remaining survivors are the `ArrowNotFoundError` message string literal (intentionally not pinned) and a few equivalent arithmetic mutants on the `(Δaxis) * delta > 0` comparison.

## Team Modifications Pending Human Review

- Domain service + tests require mandatory human review (AGENTS §5).
- `BoardGroup.activeBounds()` still uses the 2D `BoundingBox` (camera framing only); the 3D camera/bounds belongs to the render tickets (`MAZ-240` C5), not here.
- No formal Gherkin `.feature` was authored for this refactor; the M13 plan + sealed grill-me spec acted as the contract.

## Lessons / Limitations

The 2D→6-axis generalisation is clean because each `Direction` has exactly one non-zero delta, so branch selection is unambiguous and the perpendicular guards are symmetric across axes. The mutation-testing lesson mirrors MAZ-236: a raycast test only bites the perpendicular guards if a blocker is placed forward-on-axis but off each perpendicular coordinate in turn — one such negative case per axis (different depth, different column, different row) is what lifted the score from 71% to 87%. `BoardGroup` needing zero changes validates the M13 design bet: keying the occupancy index on `Position.toKey()` makes the aggregate dimension-agnostic.
