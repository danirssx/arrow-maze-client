# AI Usage Log: MAZ-136 Untangle Domain and Application Tests

## Task / Problem

Resolve MAZ-136 / T7 by rewriting the mobile domain and application tests that still referenced the old maze-navigation model. The refactor target is the Arrow Untangle mechanic: arrows are extracted by raycast/collision rules, blocked taps consume attempts with per-arrow deduplication, victory is an empty board, and scoring is time-based.

Backend DAG/solvability coverage was implemented in MAZ-130 (`arrow-maze-backend` PR #40), so this mobile ticket focuses on client-side domain/application test alignment and does not duplicate backend persistence or Swagger work.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to implement MAZ-136 after MAZ-130, with the required workflow: read repository AGENTS files, `MEMORY.md`, `Linear_MCP_Guideline.md`, previous refactor tickets, log AI usage, validate checks, commit, push, open PR, and update Linear.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Used the approved Arrow Untangle mechanic spec as the source of truth instead of making new gameplay decisions. | `Mecanica_Juego_Arrow_Untangle.md`, `Refactor_Arrow_Untangle_Tickets.md` |
| Planner/Slicer | Referenced | Followed the T7 slice boundaries: rewrite collision/domain/application specs and avoid UI work from T6. | MAZ-136 / T7 scope, stacked branch on MAZ-134 |
| TDD Implementer | Used | Rewrote failing tests first, then adjusted small DTO/type-safety code needed for the new test contract. | `tests/domain/observer/LevelObserver.test.ts`, `tests/application/game/GameEventContract.test.ts` |
| Judge | Referenced | Applied a review pass to keep presentation changes out of scope and record blocked full-check status honestly. | Scoped validation + PR notes |
| Mutation Tester | Not used | Mutation testing was not requested and no mutation tool is configured for this ticket. | N/A |

## Result Obtained

- Rewrote observer tests around `ArrowEntity`, `BoardGroup`, `NormalLevel`, `TimedLevel`, `ArrowSpec`, attempts exhaustion, one-shot finish events, and listener unregistering.
- Rewrote application event/board contract tests away from `CellSpec`, `CellType`, `LevelTemplate`, `playTurn`, and `getBoardSnapshot`.
- Updated `BoardSnapshotDto`/`BoardSnapshotMapper` to expose arrow layouts, bounding boxes, and attempts instead of grid cells/start/exit.
- Restored the shared `PositionDto` and fixed strict-indexed access in `ArrowSpec`, `BoundingBox`, manual level colors, and manual level progression tests.

## Validation

- `npx eslint src/domain src/application tests/domain tests/application`
- `npm test -- --runInBand tests/domain tests/application`
  - 26 suites passed.
  - 143 tests passed.

Full project checks are intentionally not green on this stacked branch because `src/presentation` and `tests/presentation` still reference the old maze UI contract (`BoardCellDto`, `playTurn`, `moves`, `optimalMoves`, `CellType`). That belongs to the UI refactor slice, not MAZ-136.

## Team Modifications Pending Human Review

- Review the stacked PR together with MAZ-131 through MAZ-135; MAZ-136 assumes the Arrow Untangle domain/application contract from those branches.
- Decide whether MAZ-136 should remain stacked on `refactor/mobile-levels-MAZ-134` or be rebased after the UI branch is merged.
- Confirm whether a later UI slice should keep the new `BoardSnapshotDto` shape or restore a `GameFacade.getBoardSnapshot` convenience wrapper.

## Lessons / Limitations

Refactor tests must be honest about slice boundaries. Domain/application behavior is now aligned with Arrow Untangle, but full `typecheck` cannot be claimed until the presentation layer stops importing maze-navigation DTOs and APIs.
