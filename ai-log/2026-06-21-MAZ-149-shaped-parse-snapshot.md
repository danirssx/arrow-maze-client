# AI Usage Log: MAZ-149 Parse and snapshot shaped boards in the mobile client

## Task / Problem

Client slice of the Abstract Shaped Boards plan (**Option A**): teach the mobile
client to parse and carry an optional `boardShape` `CELL_MASK` and expose it through
the board snapshot. The shape is a visual + placement mask, not a wall, so building
and extraction are unchanged. Covers Gherkin `@s1`, `@s2a`, `@s3`, `@s5b`. Rendering
is the next slice (MAZ-150). Blocked-by the backend contract (MAZ-148), whose DTO
shape this mirrors.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

Implement the whole `docs/abstract-shaped-boards-plan.md` under Option A, deferring
AI/Gemini + image upload, following both repos' `AGENTS.md`, root `MEMORY.md`,
`Linear_MCP_Guideline.md`, a new worktree per ticket, AI logging +
`compile-ai-usage.sh`, and commit/push/PR/Linear. Gherkin contract approved at the
single human gate.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | Followed the approved spec; no separate session. | `specs/abstract-shaped-boards.spec.md` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Implemented the client slice of the approved `.feature` (`@s1`, `@s2a`, `@s3`, `@s5b`); the tickets/feature were authored in the planning phase (MAZ-148..153). | `specs/abstract-shaped-boards.feature`, MAZ-149 |
| TDD Implementer (`.agents/tdd-implementer.md`) | Used | Red→Green: shaped-JSON parse + validation in `JsonLevelStrategy`, optional `boardShape` on `LevelDefinition`, and union-bounds + shape pass-through in `BoardSnapshotMapper`/`BoardSnapshotDto`. | tests below + `@s → test` map |
| Judge (`.agents/judge.md`) | Referenced | Pre-PR self-audit: `npm run verify` green; application layer imports no RN/Expo; DTO mirrors the backend contract. | `npm run verify` |
| Mutation Tester (`.agents/mutation.md`) | Not used | StrykerJS is not configured in the client repo (same as MAZ-144). The new parse/validation paths are covered by explicit throw/value assertions (9 new tests). | N/A |

## Scenario Coverage (@s ↔ test)

- @s1 (parse valid shaped JSON + builds playable) →
  `JsonLevelStrategy.test should_parse_a_valid_board_shape`,
  `should_build_a_playable_level_from_a_shaped_definition`.
- @s2a (legacy, no shape) → `JsonLevelStrategy.test should_omit_board_shape_when_absent`.
- @s3 (reject invalid shape) → `JsonLevelStrategy.test`:
  `should_throw_when_board_shape_has_duplicate_cells`,
  `should_throw_when_an_arrow_cell_is_outside_the_mask`,
  `should_throw_when_board_shape_type_is_not_cell_mask`,
  `should_throw_when_board_shape_exceeds_the_maximum_cells`,
  `should_throw_when_board_shape_cells_is_empty`.
- @s5b (snapshot exposes shape + union bounds) →
  `BoardSnapshotMapper.test should_include_board_shape_cells_and_union_bounds`
  (+ `should_omit_board_shape_when_definition_has_none`).

## Result Obtained

- `level-build/LevelDefinition.ts`: `BOARD_SHAPE_MAX_CELLS = 600`, `BoardShapeCell`
  (`{row, col}`) and `BoardShapeDefinition` (`{ type: "CELL_MASK"; cells }`) types +
  optional `LevelDefinition.boardShape` (mirrors the backend `definition.boardShape`).
- `level-build/JsonLevelStrategy.ts`: `mapBoardShape` validates type, non-empty,
  integers, duplicates, max 600, and arrow containment — all surfaced as the existing
  controlled `InvalidLevelDefinitionError`. Absent shape stays backward compatible.
  The Builder/Director are unchanged (shape rides on the definition; the playable
  board is still built from arrows only).
- `dto/BoardSnapshotDto.ts`: optional `boardShape?: readonly CoordinateDto[]`.
- `dto/BoardSnapshotMapper.ts`: passes the mask cells through (`col` → UI `column`)
  and derives `bounds` from the **union** of arrow + shape cells.

## Verification

- `npm run verify` → **54 suites / 260 tests** green (lint + typecheck + coverage).

## Team Modifications Pending Human Review

- Contract symmetry: client `LevelDefinition.boardShape` uses `{row, col}` (matching
  the JSON/backend contract); the UI-facing `BoardSnapshotDto.boardShape` uses
  `{row, column}` (matching arrow `CoordinateDto`). The mapper does the `col→column`
  translation. Rendering consumes the snapshot shape (MAZ-150).
- `AGENTS.md` needed no change (`level-build`/`dto` are application subfolders; no new
  pattern, no RN/Expo import added to application).

## Lessons / Limitations

Keeping the shape on `LevelDefinition` (not threading it through the Builder) preserves
the "builder builds from arrows only" invariant and keeps `ConcreteLevelBuilder`/
`LevelDirector` untouched — the shape is a presentation concern that flows via the
snapshot. Computing `bounds` from the union of arrow + shape cells is what frames the
empty visible mask cells in the reference look.
