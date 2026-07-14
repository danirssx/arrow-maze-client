# AI Usage Log: MAZ-236 — Add 6 directions and 3D ArrowSpec deltas (client)

## Task / Problem

Resolve `MAZ-236` (C2) of the M13 "3D Volumetric Boards" milestone: extend the client domain `Direction` from the four planar cardinals to the six world axis directions and make `ArrowSpec` adjacency 3D. Stacked on `MAZ-236`'s parent `MAZ-235` (Position 3D). This wires the depth axis into the collision/authoring primitives so the raycast (`MAZ-237`) and mapper (`MAZ-238`) can operate in 3D.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user approved implementing `MAZ-236` following both repos' `AGENTS.md`, the team `MEMORY.md`, `Linear_MCP_Guideline.md`, prior ticket/plan context, AI-usage logging + validation checks, MEMORY/AGENTS update review, commit/push/PR, and Linear updates — and, because this is a refactor, to review the whole context and every affected ticket.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | M13 grill-me spec fixed the 6 world-axis directions (`UP/DOWN/LEFT/RIGHT/FORWARD/BACK`, fixed to the board, not screen-relative) and 3D orthogonal adjacency. | `../M13_3D_Boards_Plan.md`, `MAZ-236` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Milestone pre-sliced into MAZ-225..244 with blocking edges; this is C2 (stacked on C1). No separate `.feature` authored for this VO delta. | `MAZ-236`, milestone `M13 - 3D Volumetric Boards` |
| TDD Implementer (`.agents/tdd-implementer.md`) | Used | Red → Green: failing tests for `zDelta`, `Forward`/`Back`, 6-element `all()`, `opposite` on the depth axis, `Direction.equals`, depth `translate`, and 3D `ArrowSpec` adjacency / depth head-points-back; then implemented. | `tests/domain/value-objects/{Direction,ArrowSpec,Position}.test.ts`, `src/domain/value-objects/{Direction,ArrowSpec,Position}.ts` |
| Judge (`.agents/judge.md`) | Referenced | Blast-radius grep of all `Direction` consumers (`fromName` mappers/fixtures, `directionUnit` SVG fallback, `CollisionService`, `opposite`); confirmed 2D behaviour unchanged and no exhaustive Direction Record/switch breaks. | grep, `npm run verify` exit 0 |
| Mutation Tester (`.agents/mutation.md`) | Used | `stryker --mutate` per changed file: `Direction.ts` 94.12%, `Position.ts` 90.91% (both ≥ break 80); confirmed the mutant on the one line changed in `ArrowSpec.ts` (`a.z - b.z`) is killed. | stryker clear-text reports |

## Result Obtained

- `src/domain/value-objects/Direction.ts`: added `zDelta` to the constructor; new canonical members `Forward` (`0,0,1`) and `Back` (`0,0,-1`); the four planar directions keep `zDelta = 0`; `all()` returns all six; `opposite()` is now exhaustive over the six (adds `Forward ↔ Back`); doc comment describes world-axis semantics.
- `src/domain/value-objects/Position.ts`: `translate` now moves along depth (`this.z + direction.zDelta`) — completing the z-axis movement deferred from `MAZ-235`; doc comment updated.
- `src/domain/value-objects/ArrowSpec.ts`: `areOrthogonallyAdjacent` is 3D Manhattan (`|Δrow| + |Δcol| + |Δz| === 1`), so an arrow may now bend along the depth axis; the head-points-back invariant works in 3D through the 3D `translate`.
- Tests strengthened across the three VO test files (AAA, `should_*_when_*`), including a depth-adjacency accept case using non-zero z on both endpoints (z `1→2`) so the `a.z − b.z` sign mutant is killed.

## Verification

- `npm run verify` (lint + typecheck + coverage) → exit 0; **529 tests**; `Direction.ts` and `Position.ts` at 100% coverage, `ArrowSpec.ts` 96%.
- `npx jest` full suite green (confirms the extra directions and 3D adjacency did not regress the 2D `CollisionService`, `Direction.fromName` mappers, `JsonLevelStrategy`, or the SVG `directionUnit` fallback).
- Mutation (per changed file): `Direction.ts` 94.12%, `Position.ts` 90.91% (≥ break 80); the single mutant on the touched `ArrowSpec.ts` line is killed.

## Team Modifications Pending Human Review

- Domain VOs + tests require mandatory human review (AGENTS §5).
- `CollisionService` still raycasts in 2D — a `Forward`/`Back` arrow is not yet correctly blocked; that is `MAZ-237` (C3) scope. This ticket deliberately stops at the VO layer.
- Pre-existing `ArrowSpec.ts` mutation survivors (error-message string literals and guard conditionals on lines 26/29/32/41/42/47/55/56/64) are **baseline**, not introduced here; the repo mutation gate is a whole-project aggregate (`stryker.conf.json` mutates all of `src/domain` + `src/application`), not per-file. Flagged for a separate test-hardening pass if desired.
- No formal Gherkin `.feature` was authored for this VO delta; the M13 plan + sealed grill-me spec acted as the contract.

## Lessons / Limitations

Keeping `Direction` a canonical-instance class (not a union) means adding two members ripples nowhere at the type level — the only runtime consumers are `fromName` (safe: 2D levels never carry the new names), the SVG `directionUnit` (safe: has a `?? RIGHT_UNIT` fallback and only renders 2D), and `opposite` (made exhaustive). The subtle mutation-testing lesson: an adjacency test whose depth cells touch `z = 0` cannot distinguish `a.z - b.z` from `a.z + b.z`; using two non-zero depths on the same segment is required to bite that operator.
