# AI Usage Log: MAZ-150 Render abstract shaped boards in the mobile client

## Task / Problem

Presentation slice of the Abstract Shaped Boards plan (**Option A**): render the
optional `boardShape` mask as the dotted board background — only the mask cells, not a
full rectangle — while keeping the rectangular fallback for unshaped levels, arrow
visuals/tap targets, and the off-board extraction animation unchanged (the shape is not
a wall). Covers Gherkin `@s5`, `@s2c`, `@s6`. **Stacked on MAZ-149** (the snapshot
`boardShape`); blocked-by it.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

Implement the whole `docs/abstract-shaped-boards-plan.md` under Option A (AI/image
deferred), following both repos' `AGENTS.md`, root `MEMORY.md`, `Linear_MCP_Guideline.md`,
a worktree per ticket, AI logging + `compile-ai-usage.sh`, and commit/push/PR/Linear.
Gherkin contract approved at the single human gate.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | Followed the approved spec; no separate session. | `specs/abstract-shaped-boards.spec.md` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Implemented the rendering slice of the approved `.feature` (`@s5`, `@s2c`, `@s6`). | `specs/abstract-shaped-boards.feature`, MAZ-150 |
| TDD Implementer (`.agents/tdd-implementer.md`) | Used | Red→Green: `GameUiState.boardShape`, `GameViewModel` pass-through, and `BoardView` mask-only dotted background + rectangular fallback. | tests below + `@s → test` map |
| Judge (`.agents/judge.md`) | Referenced | Pre-PR self-audit: `npm run verify` green; presentation imports no domain/use-case; tap targets + extraction unchanged. | `npm run verify` |
| Mutation Tester (`.agents/mutation.md`) | Not used | StrykerJS is not configured in the client repo (same as MAZ-144/MAZ-149); rendering is covered by component/VM assertions. | N/A |

## Scenario Coverage (@s ↔ test)

- @s5 (mask-only dotted background + tappable heads) →
  `BoardView.test should_render_only_mask_cells_as_dots_when_a_board_shape_is_present`.
- @s2c (rectangular fallback) →
  `BoardView.test should_keep_the_rectangular_dotted_lattice_when_no_board_shape`.
- @s6 (extraction unaffected by the shape boundary) →
  `BoardView.test should_extract_an_arrow_on_a_shaped_board_so_the_shape_is_not_a_wall`.
- (shape pass-through) →
  `GameViewModel.test should_carry_board_shape_into_ui_state_when_the_level_has_one`.

## Result Obtained

- `state/GameUiState.ts`: optional `boardShape?: readonly CoordinateDto[]`.
- `view-models/GameViewModel.ts`: `startLevel` carries `board.boardShape` from the
  snapshot into UI state (conditional spread for `exactOptionalPropertyTypes`).
- `components/BoardView.tsx`: a `dotStyle` helper + a shape-aware dotted background —
  when `state.boardShape` is present it renders one dot per mask cell inside a
  `board-shape-dots` container (each `board-dot-<row>-<col>`), otherwise the existing
  rectangular lattice inside `board-rect-dots`. Arrow neon visuals, `arrow-<id>` tap
  targets, shake, and the `ExitingArrow` stream-off (`exitClearance = max(width,height)`,
  independent of the mask) are unchanged — so extraction still leaves the visible shape.

## Verification

- `npm run verify` → **54 suites / 264 tests** green (lint + typecheck + coverage).

## Team Modifications Pending Human Review

- **Stacked on `feat/mobile-shaped-parse-MAZ-149`** (the snapshot `boardShape`); the PR
  carries MAZ-149's commit until that merges to `develop` first.
- Open UI decision (gate default kept): after victory the cleared board keeps rendering
  the empty shape (it stays in `GameUiState` until a new level starts).
- `AGENTS.md` unchanged (presentation-only; `react-native-svg` already wired; no domain
  import).

## Lessons / Limitations

The off-board exit distance is `max(width, height)` of the (union-)framed canvas, so an
extracted arrow always streams past the smaller visible mask — the shape is purely a
background, never a boundary. Wrapping the two dot variants in `board-shape-dots` /
`board-rect-dots` containers makes "mask-only vs rectangular" assertable under the SVG
mock without depending on dot counts.
