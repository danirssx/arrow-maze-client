# AI Usage Log: MAZ-169 carry boardShape through the backend-driven level path

## Task / Problem

Bug found in the post-merge deep review: the client's HTTP catalog path **dropped
`boardShape`**. `LevelDetailDto.definition` was only `{ attempts, arrows }` and
`LevelCatalogMapper.toDefinition` never mapped the mask, so a shaped level served by
`GET /levels/:id` rendered **rectangular** — the MAZ-150 shaped render only worked via
the local `JsonLevelStrategy` path, which the runtime catalog does NOT use. Fix it so
DB-served shaped levels render their mask.

## Tool and Model

Claude Code / Claude Opus 4.8 (1M).

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Not used | Direct defect fix; no spec. | N/A |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Authored ticket MAZ-169 from the review finding. | MAZ-169 |
| TDD Implementer (`.agents/tdd-implementer.md`) | Used | Red→Green: added a shaped `LevelResponseDto` test (board shape dropped → undefined), then mapped it. | `tests/infrastructure/repositories/HttpLevelCatalogRepository.test.ts` |
| Judge (`.agents/judge.md`) | Referenced | Pre-PR self-audit: `npm run verify` green; no-shape path unchanged. | `npm run verify` |
| Mutation Tester (`.agents/mutation.md`) | Not used | StrykerJS is not configured in the client repo; the mapper is covered by explicit assertions. | N/A |

## Scenario Coverage

- Shaped detail → populated `boardShape` → `HttpLevelCatalogRepository.test should_map_board_shape_from_level_detail`.
- No-shape detail → `boardShape` undefined → `should_omit_board_shape_when_level_detail_has_none`.

## Result Obtained

- `LevelCatalogDtos.ts`: new `BoardShapeDto` + optional `definition.boardShape` on
  `LevelDetailDto`.
- `LevelCatalogMapper.toDefinition`: maps `definition.boardShape` → the client
  `LevelDefinition.boardShape` (`type: "CELL_MASK"`, cells `{row,col}`), conditional and
  backward compatible. So a DB-served shaped level now flows through `GameFacade` →
  `BoardSnapshotMapper` → `GameUiState.boardShape` → `BoardView` (MAZ-150) and renders
  the mask instead of a rectangle.

## Verification

- `npm run verify` → **57 suites / 285 tests** green (lint + typecheck + coverage).

## Team Modifications Pending Human Review

- The offline fallback fixtures (`manualLevels.ts`) are intentionally left as-is (a
  degraded offline mode); the backend remains the source of truth (see MAZ-168). Trimming
  the 10k-line fixture file is high-risk/low-value (many domain/application tests depend
  on it) and was deliberately NOT done.
- Pair with **MAZ-168** (backend JSON catalog) + a reachable, seeded backend so shaped
  DB levels (e.g. Cross Beacon) actually appear and render.

## Lessons / Limitations

The shaped-board feature had a working domain/parse/render chain but a gap on the real
runtime path: the app loads the catalog via `LevelCatalogMapper`, not `JsonLevelStrategy`,
so the mask was silently dropped. The fix is one mapper field — but it's the field that
makes the feature visible from the database.
