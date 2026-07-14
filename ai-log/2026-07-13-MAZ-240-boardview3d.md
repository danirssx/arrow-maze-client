# AI Log - MAZ-240 BoardView3D GL scene

## Task / Problem

Implement ticket `MAZ-240` (C5): build the client presentation `BoardView3D` GL scene for volumetric 3D boards, based on the sealed M13 plan and stacked on the client C4 branch (`origin/refactor/mobile-infra-level-catalog-3d-MAZ-238`).

## Tool and Model

- Tool: Codex CLI coding agent.
- Model: GPT-5 Codex.

## Prompt Used

The user requested work on `MAZ-240`, explicitly requiring both repo `AGENTS.md` files, `MEMORY.md`, `Linear_MCP_Guideline.md`, AI usage logging, checks, a new worktree, commit/push/PR, Linear update, and a review of affected tickets.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | Used its scope discipline to derive a local spec from the sealed M13 plan without adding new architecture decisions. | `specs/mobile-board3d-render-MAZ-240.spec.md`, `M13_3D_Boards_Plan.md` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Used its executable-contract format to record `@s1..@s5` scenarios for traceability. | `specs/mobile-board3d-render-MAZ-240.feature` |
| TDD Implementer (`.agents/tdd-implementer.md`) | Referenced | Followed red/green/refactor: wrote failing mapper/geometry/component tests, implemented the minimum DTO + presentation code, then verified. | Tests listed in `@s -> test` map below |
| Judge (`.agents/judge.md`) | Referenced | Applied layer-boundary and Clean Architecture checks while implementing; no separate judge session was run. | `npm run lint`, `npm run typecheck`, code placement under application DTOs and presentation |
| Mutation Tester (`.agents/mutation.md`) | Referenced | Ran scoped Stryker mutation after verify for the application mapper touched by this ticket. | `ai-log/2026-07-13-MAZ-240-mutation.md` |

## Result Obtained

- Added optional depth to `CoordinateDto` and `BoardBoundsDto`.
- Updated `BoardSnapshotMapper` to preserve `z` for explicit 3D levels, inferred-depth levels, 3D zero slabs, and depth board-shape masks while keeping 2D snapshots backward-compatible.
- Added `src/presentation/components/board3d/`:
  - `BoardView3D.tsx`: static R3F/Three.js canvas shell with neon tube arrows and a volume lattice.
  - `board3dGeometry.ts`: pure descriptor/coordinate/direction helpers.
  - `index.ts`: presentation export.
- Added Jest manual mock for `@react-three/fiber/native`.
- Imported the R3F/Three/expo-gl dependencies validated by MAZ-225.
- Left `GameScreen` renderer switching, orbit/zoom, picking, and exit animation untouched for `MAZ-241`..`MAZ-244`.

## Affected Tickets Reviewed

- `MAZ-225` / T0: device spike branch showed GO at 60fps with R3F and provided the dependency set reused here.
- `MAZ-238` / C4: this worktree is stacked on C4 because `dimensions`/`z` catalog parsing unlocks C5.
- `MAZ-241` / C6: orbit and zoom gestures remain deferred.
- `MAZ-242` / C7: tap-picking remains deferred.
- `MAZ-243` / C8: GL exit animation and shake remain deferred.
- `MAZ-244` / C9: `GameScreen` renderer switching remains deferred.

## @s -> Test Map

| Scenario | Tests |
| --- | --- |
| `@s1` | `tests/application/dto/BoardSnapshotMapper.test.ts` - `should_map_3d_arrow_coordinates_and_depth_bounds_when_definition_is_volumetric`, `should_infer_depth_coordinates_when_any_arrow_cell_has_nonzero_z`, `should_keep_zero_depth_coordinates_when_dimensions_explicitly_mark_a_3d_slab`, `should_include_board_shape_depth_cells_and_depth_bounds` |
| `@s2` | `tests/application/dto/BoardSnapshotMapper.test.ts` - `should_map_arrows_with_head_direction_and_bounds`, `should_include_board_shape_cells_and_union_bounds`, `should_omit_board_shape_when_definition_has_none` |
| `@s3` | `tests/presentation/components/board3d/board3dGeometry.test.ts` - `should_center_a_board_coordinate_inside_the_volume`, `should_default_missing_z_to_the_planar_zero_slab`, `should_resolve_six_world_axis_direction_vectors`, `should_describe_neon_tube_arrows_from_active_dto_cells`, `should_measure_depth_from_optional_bounds_or_the_zero_slab` |
| `@s4` | `tests/presentation/components/board3d/BoardView3D.test.tsx` - `should_mount_a_canvas_for_a_volumetric_board`, `should_render_an_empty_3d_board_without_canvas_when_bounds_are_null` |
| `@s5` | Absence of `GameScreen` production changes plus scoped assertions in `BoardView3D` tests; follow-up tickets own interaction/switching. |

## Validation

- `npm test -- --runInBand tests/application/dto/BoardSnapshotMapper.test.ts tests/presentation/components/board3d` - GREEN.
- `npm run lint` - GREEN.
- `npm run typecheck` - GREEN.
- `npm run verify` - GREEN (94 suites / 563 tests).
- `npm run mutation -- --mutate "src/application/dto/BoardSnapshotMapper.ts"` - GREEN, 100.00%.

## Team Modifications Pending Human Review

- Human review should confirm the visual framing on device once `MAZ-244` wires `BoardView3D` into gameplay.
- Human review should confirm stacking on `MAZ-238` is acceptable until C4 is merged into `develop`.
- Linear could not be read or updated from this session because `LINEAR_API_KEY` was not set locally.

## Lessons / Limitations

- `BoardSnapshotDto` had to become depth-aware for the renderer to remain presentation-only; otherwise `BoardView3D` would need to reach into domain/application internals.
- Jest validates the RN shell and pure geometry, not a real native GL context.
- The first mutation pass exposed missing tests for inferred depth and empty boards; adding those tests raised the scoped score to 100%.
