# AI Usage Log: MAZ-164 Flatten boundary DTOs and keep domain types out of presentation

## Task / Problem

Clean Architecture remediation slice `CA-011` (report `C-Y4`). Application "DTOs" and
ports were exposing or re-exporting domain types across the application → presentation
boundary: `application/dto/GameEventDto.ts` re-exported the domain `GameEventType`
(and `dto/index.ts` re-exported it again); `GameSnapshotDto`/`LevelOutcomeDto` typed
their fields with the domain `GamePhase`/`LevelStatus`/`DefeatReason`;
`ILevelCatalogRepository.LevelCatalogSummary.difficulty` used the domain `Difficulty`;
and `presentation/view-models/LevelSelectViewModel.ts` imported the domain `Difficulty`
directly (the only `@/domain` import left in `src/presentation`). This ticket gives the
boundary its own plain DTO literal types, maps domain → DTO inside the application
layer, exposes ready-to-consume difficulty fields to the level list, and adds an eslint
guard so `presentation` can never import `@/domain` again. No serialized value changes.
Covers `@s1..@s9` of `specs/boundary-dtos.feature`.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

Work MAZ-164 end to end honoring both repos' `AGENTS.md`, root `MEMORY.md`,
`Linear_MCP_Guideline.md`; a new worktree per ticket; AI logging +
`compile-ai-usage.sh`; and commit/push/PR/Linear. As a refactor, review the whole
context and the affected tickets.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | Distilled the approved CA-011 scope from `Clean_Architecture_Fix_Tickets_Proposal.md` + the actual code violations into a local spec; no separate session. | `specs/boundary-dtos.spec.md` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Authored the executable `.feature` (`@s1..@s9`) from the already-approved ticket ACs. | `specs/boundary-dtos.feature` |
| TDD Implementer (`.agents/tdd-implementer.md`) | Used | Implemented the DTO-owned literals + boundary mappers and the difficulty ViewState, with mapper/ViewModel/component tests and a lint-guard probe. | tests below + `@s → test` map |
| Judge (`.agents/judge.md`) | Referenced | Pre-PR self-audit: `npm run verify` green; `src/presentation` has zero `@/domain` imports (proved by a throwaway eslint probe); `application/dto` re-exports no domain type. | `npm run verify`, eslint `no-restricted-paths` probe |
| Mutation Tester (`.agents/mutation.md`) | Not used | StrykerJS is not configured in the client repo (same as MAZ-144/149/160). The new translation logic is covered by exhaustive value assertions (every domain enum value → identical DTO literal). | N/A |

## Scenario Coverage (@s ↔ test)

- @s1 (snapshot phase DTO literal) → covered by the typed `mapGameSnapshot` + `BoundaryDtos.test should_map_every_domain_phase_to_the_same_dto_literal`.
- @s2 (lost result → DTO status/reason) → `BoundaryDtos.test should_map_a_lost_level_finished_event_to_dto_status_and_reason`.
- @s3 (every phase/status/reason maps to identical DTO literal) → `BoundaryDtos.test should_map_every_domain_{phase,status,defeat_reason}_to_the_same_dto_literal`.
- @s4 (event DTO discriminator + plain coordinates) → `BoundaryDtos.test should_map_a_move_event_to_a_dto_with_plain_coordinates`.
- @s5 (dto barrel re-exports no domain type) → `dto/index.ts` exports `GameEventTypeDto`; `grep` of `src/application/dto` shows no `export … from "…domain…"`.
- @s6 (catalog summary plain difficulty literal) → `LevelSelectViewModel.test` fake repo summaries use `DifficultyDto` strings + typecheck.
- @s7 (ViewModel ready-to-consume difficulty, no domain import) → `LevelSelectViewModel.test should_expose_ready_to_consume_difficulty_fields` / `should_map_manual_levels_to_star_ratings`.
- @s8 (LevelCard renders from difficultyStars) → `LevelCard.test should_fill_stars_from_difficulty_stars` / `should_fill_one_star_for_an_easy_level`.
- @s9 (presentation has no `@/domain` import) → eslint `import/no-restricted-paths` zone (`presentation` ← `domain`), verified by a throwaway probe file that errors.

## Result Obtained

Application:
- `application/use-cases/game/GameSnapshotDto.ts`: now owns `GamePhaseDto`,
  `LevelStatusDto`, `DefeatReasonDto` literal unions (no domain import); `GameResultDto`
  / `GameSnapshotDto` use them.
- `application/use-cases/game/GameSnapshotMapper.ts`: exports `toGamePhaseDto`,
  `toLevelStatusDto`, `toDefeatReasonDto` — the single domain → snapshot DTO translation
  point — and maps `phase`/`result` through them.
- `application/use-cases/game/LevelOutcomeDto.ts` + `ResolveLevelOutcomeUseCase.ts`:
  `status` is now `LevelStatusDto`, mapped via `toLevelStatusDto`.
- `application/dto/GameEventDto.ts`: defines its own `GameEventTypeDto` const+union and
  no longer re-exports the domain `GameEventType`; the event payload types use it.
- `application/dto/GameEventMapper.ts`: switches on the domain `GameEventType` and emits
  the boundary-owned `GameEventTypeDto` discriminator.
- `application/dto/DifficultyDto.ts` (new): boundary difficulty literal.
- `application/dto/index.ts`: re-exports `GameEventTypeDto`, no domain type.
- `application/ports/ILevelCatalogRepository.ts`: `LevelCatalogSummary.difficulty` is now
  `DifficultyDto`.

Infrastructure:
- `infrastructure/mappers/level-catalog/LevelCatalogMapper.ts`: casts the wire string to
  `DifficultyDto` for the summary (the `LevelDefinition` build input keeps domain
  `Difficulty`, which is correct — application build data, not a presentation DTO).

Presentation:
- `presentation/view-models/LevelSelectViewModel.ts`: dropped the `@/domain` import.
  `LevelListItem` now exposes ready-to-consume `difficultyStars` (1–3) and
  `difficultyLabel`; the ViewModel maps the plain difficulty literal to them.
- `presentation/view-models/GameViewModel.ts`: uses `GameEventTypeDto`.
- `presentation/components/LevelCard.tsx`: renders the rating from `level.difficultyStars`
  and uses `level.difficultyLabel` for the accessibility label; maps no domain difficulty.

Guardrail:
- `eslint.config.js`: new `import/no-restricted-paths` zone blocking `src/presentation`
  from importing `src/domain` (DoD: "Lint/check bloquea presentation → domain").

Validation: `npm run verify` GREEN (59 suites / 294 tests, lint + typecheck + coverage).
New: `tests/application/dto/BoundaryDtos.test.ts` (5 tests), `tests/presentation/components/LevelCard.test.tsx` (2 tests), +2 ViewModel difficulty tests.

## Team modifications pending human review

- Application/presentation tests are subject to mandatory human review (AGENTS §5): the
  new boundary mapper tests and the difficulty ViewState tests.
- Confirm `difficultyLabel` should stay a plain English label (used only for the card's
  accessibility label) or be routed through i18n — enriching ViewStates further is the
  sibling ticket `CA-012`.

## Lessons / Limitations

- The domain enums and the new DTO literals are structurally identical string unions, so
  each converter is a typed pass-through. The value is the *type ownership*: the files
  presentation imports (`GameSnapshotDto.ts`, `GameEventDto.ts`, `DifficultyDto.ts`) now
  depend on no domain code, and the translation lives in application-only mappers.
- `LevelDefinition.difficulty` deliberately keeps the domain `Difficulty` — it is an
  application build input that constructs domain levels, not a presentation-facing DTO,
  so it is out of scope.
- The eslint zone is the real enforcement of "presentation never imports domain"; a
  throwaway probe file confirmed it errors before the change could regress.
