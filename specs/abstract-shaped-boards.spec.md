# Spec — Abstract Shaped Boards (Client / Mobile)

Date: 2026-06-21
Status: **draft for human gate**. Not an approved contract until the human signs the
`@s` scenarios in `abstract-shaped-boards.feature`.

Source plan: `docs/abstract-shaped-boards-plan.md`.
Decision taken by product owner: **Option A** (shape = visual + placement mask, NOT a
physical blocker). AI/Gemini and image/user-shape upload are **deferred to Phase 2**.

## Purpose

Let the mobile client parse, carry, and render an optional finite `boardShape` cell
mask so abstract boards look like the reference frames in `fotogramas-arrow-orig/`,
while keeping ArrowSpec extraction rules (unbounded raycast) and current rectangular
levels unchanged.

## Data contract (Option A)

```jsonc
{
  "boardShape": { "type": "CELL_MASK", "cells": [{ "row": 0, "col": 0 }] }
}
```

Same invariants as backend: optional; `type` = `"CELL_MASK"`; non-empty integer cells;
no duplicates; max 600 cells; every arrow cell inside the mask; connectivity NOT
enforced for MVP.

## Architecture placement (domain → application → presentation; inward-only deps)

- **Application — `level-build`**: extend `LevelDefinition` with optional
  `boardShape?: { type: "CELL_MASK"; cells: readonly CoordinateDto[] }` (a plain DTO;
  no new domain class). `JsonLevelStrategy` parses + validates it (type, non-empty,
  integers, no duplicates, ≤600, arrow containment) and throws the existing controlled
  `InvalidLevelDefinitionError` on any violation. The Builder/Director keep building the
  playable board from arrows only — the shape is a view-layer concern and rides along on
  the `LevelDefinition`.
- **Application — `dto`**: `BoardSnapshotDto` gains optional `boardShape`;
  `mapBoardSnapshot` passes the shape cells through and derives `bounds` from the
  **union of arrow cells and shape cells** so empty visible shape cells are framed.
  `GameFacade.getBoardSnapshot` already maps from the stored definition — no signature
  change.
- **Presentation**: `GameUiState` + `GameViewModel` carry the optional shape through to
  the view. `BoardView` renders dotted cells **only for `boardShape.cells`** when a shape
  exists, and keeps the current rectangular fallback when it does not. Arrow visuals, tap
  targets, and the SVG extraction animation are unchanged; the exit animation still
  travels outside the visible shape boundary (the shape is not a wall).

## Slices in this repo

1. **Shaped JSON parsing + board snapshot** (`LevelDefinition`, `JsonLevelStrategy`,
   `BoardSnapshotDto`, `BoardSnapshotMapper`). Covers **S1**, **S2**, **S3**.
2. **Shaped board rendering** (`GameUiState`, `GameViewModel`, `BoardView`). Covers
   **S5**, **S6**, and the no-shape rectangular fallback.

## Acceptance criteria → scenarios

- **S1** Parse shaped JSON → `@s1`.
- **S2** Backward compatibility (no shape) → parsing `@s2a`, rendering `@s2c`.
- **S3** Reject invalid shape (client parse) → `@s3` (dup / outside-mask / bad type /
  oversize / empty, as a Scenario Outline).
- **S5** Render abstract board → `@s5`; snapshot exposes shape + union bounds → `@s5b`.
- **S6** Keep extraction rules stable (shape not a wall) → `@s6`.

## Open decisions surfaced for the human gate

1. Connectivity not enforced for MVP (allow islands)? (default: yes)
2. After victory, keep rendering the empty shape background vs. fade to empty board?
   (default for MVP: **keep** rendering the empty shape; matches a persistent mask)

## Out of scope (Phase 2)

- Gemini/AI generation in the mobile app (keys must never ship in the client).
- Image/user-drawn shape upload. Shape as a physical wall.
