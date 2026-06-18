# AI Usage Log: MAZ-135 Mobile UI — canvas, HUD, MVVM (closes the client chain green)

## Task / Problem

Resolve `MAZ-135` (Refactor T6): rebuild the gameplay presentation for the arrow untangle game — a dark dotted canvas with colored arrows, tap-to-extract, scroll, a HUD (arrows + attempts) and a soft-defeat overlay — following the `design/` guidelines, and re-introduce the board-snapshot DTO. As the last red layer, this brings the whole client green. Stacked on `MAZ-134`.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to implement `MAZ-135` (T6) taking `arrow-maze-client/design/` into account, following both repos' `AGENTS.md`, the team `MEMORY.md`, `Linear_MCP_Guideline.md`, prior ticket state, AI usage logging, validation, MEMORY/AGENTS update checks, commit/push/PR, and Linear updates.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Mechanic/HUD/overlay behavior was sealed in the refactor docs; `design/README.md` provided the palette (blue/lavender app chrome; dark game board per `game-design/`). | `Refactor_Arrow_Untangle_Tickets.md` (T6), `design/README.md` |
| Planner/Slicer | Used | Scoped T6 to the testable presentation logic + functional RN views; folded the inherited strict-null fixes needed for green into this green-gate ticket. | this log, MEMORY note |
| TDD Implementer | Used | Wrote/rewrote ViewModel, controller, screen, mapper, and level-select tests to the new model, then implemented to green. | `tests/presentation/*`, `tests/application/dto/BoardSnapshotMapper.test.ts` |
| Judge | Referenced | Pre-PR self-audit: full `npm run verify`, layer boundaries (NativeWind/Zustand only in presentation; no domain classes in views). | `npm run verify` output |
| Mutation Tester | Not used | StrykerJS is not configured. | N/A |

## Result Obtained

- **dto:** `BoardSnapshotDto`/`BoardSnapshotMapper` rebuilt around arrows (`ArrowDto`, `CoordinateDto`, `BoardBoundsDto`); `GameEventDto`/`GameEventMapper` now use a local `CoordinateDto` (the removed `PositionDto` dependency is gone); `dto/index` updated.
- **presentation logic:** `GameUiState` holds arrows + extracted ids + bounds + HUD counters + overlay + shake id. `GameViewModel` is snapshot-driven (a tap that lowers `arrowsRemaining` extracted an arrow — pushed to a LIFO stack for undo; an unchanged count is a blocked tap flagged for shake). `GameUIController.handleArrowTap(id)` replaces cell taps. `LevelSelectViewModel` updated to the new fixtures.
- **RN views:** `BoardView` renders a dark dotted lattice with colored rounded arrow cells (palette-aligned), both-axis scroll, and head glyphs; tapping any cell reports the arrow id. `GameScreen` HUD shows arrows-remaining + attempts-remaining; `VictoryScreen`/`DefeatScreen` (out-of-attempts) overlays. i18n keys `game.arrows`/`game.attempts` + defeat copy added (en/es).
- **facade:** restored `GameFacade.getBoardSnapshot()` using the new arrow mapper; fixed `app/victory.tsx`.
- **Green-gate fixes (inherited from earlier chain branches, surfaced by full `tsc`):** strict-null (`noUncheckedIndexedAccess`) fixes in `ArrowSpec`, `BoundingBox`, and `fixtures/manualLevels.ts`; index-access fix in `ManualLevels.test`; removed the stale maze `LevelObserver.test` (untangle observer tests belong to T7).

## Verification

- `npx tsc --noEmit` → clean (whole project typechecks).
- `npm run verify` (lint + typecheck + test:coverage) → **47 suites, 222 tests passing**, 0 lint errors. The full client is green for the first time since the pivot began.

## Team Modifications Pending Human Review

- The board render is **functional, not final art**: arrows are straight cells (not curved snakes), there is no live timer/"Best" wiring yet, and power-ups (hint/shuffle) remain in **T8**. These are visual/score refinements, not contract changes.
- The per-ticket jest runs (T2-T5) did not run full `tsc`, so a few strict-null errors were latent; they are fixed here. Future tickets should run `npm run typecheck` (not only jest) before claiming local green.
- Observer tests for the untangle events (`LevelFinished`) should be re-added in **T7 (MAZ-136)**.

## Lessons / Limitations

A snapshot-driven ViewModel (read the `GameSnapshotDto` returned by each facade call, track extracted ids locally) avoided exposing live arrow state from the domain while keeping the screen in sync — including undo via a LIFO stack. Running the full `tsc` at the green-gate ticket caught strict-null issues that per-file jest had masked; that is the real lesson for the rest of the chain.
