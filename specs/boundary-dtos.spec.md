# Spec — Flatten boundary DTOs and keep domain types out of presentation (Client / Mobile)

Date: 2026-06-23
Ticket: `MAZ-164` (temporary id `CA-011`)
Source: `Clean_Architecture_Fix_Tickets_Proposal.md` (Area — boundary DTOs), report `C-Y4`.
Status: scope approved by the human (Linear `MAZ-164`). The `@s` scenarios in
`boundary-dtos.feature` are the executable contract for this slice.

## Purpose

Application DTOs and ports currently **expose or re-export domain types** across the
application → presentation boundary:

- `application/dto/GameEventDto.ts` re-exports the domain `GameEventType`
  (`export { GameEventType } from "../../domain/observer"`), and `application/dto/index.ts`
  re-exports it again.
- `application/use-cases/game/GameSnapshotDto.ts` types its fields with the domain
  `GamePhase`, `LevelStatus`, and `DefeatReason`.
- `application/use-cases/game/LevelOutcomeDto.ts` types `status` with the domain
  `LevelStatus`.
- `application/ports/ILevelCatalogRepository.ts` types `difficulty` with the domain
  `Difficulty`.
- `presentation/view-models/LevelSelectViewModel.ts` imports the domain `Difficulty`
  directly (the only `@/domain` import left in `src/presentation`).

A ViewModel/component therefore transitively depends on domain string-literal unions
through "DTOs" that are not really owned by the application layer. This slice gives the
boundary its **own plain DTO literal types**, maps domain → DTO inside the application
layer, exposes **ready-to-consume** difficulty fields to the level list, and adds a lint
guard so `presentation` can never import `@/domain` again.

## Architecture placement (domain → application → presentation; inward-only deps)

- **Domain**: unchanged. The frozen const maps (`GamePhase`, `LevelStatus`,
  `DefeatReason`, `GameEventType`, `Difficulty`) stay the single source of the
  *serialized* string values. No new domain rules, no value changes.
- **Application**:
  - DTO type files that presentation imports (`GameSnapshotDto.ts`, `GameEventDto.ts`)
    define their **own** literal unions (`GamePhaseDto`, `LevelStatusDto`,
    `DefeatReasonDto`, `GameEventTypeDto`) and import **no** domain code. Serialized
    values are identical to the domain ones (the external contract is unchanged).
  - The mappers that already sit on the boundary do the translation:
    `GameSnapshotMapper` maps domain `GamePhase`/`LevelResult` → snapshot DTO literals;
    `GameEventMapper` maps domain `GameEvent` → `GameEventDto` with the DTO discriminator;
    `ResolveLevelOutcomeUseCase` returns a `LevelStatusDto`.
  - `ILevelCatalogRepository.LevelCatalogSummary.difficulty` becomes a `DifficultyDto`
    literal; `LevelCatalogMapper` casts the wire string to `DifficultyDto`.
  - `application/dto` no longer re-exports any domain type.
- **Presentation**:
  - `LevelSelectViewModel` drops the `@/domain` import. `LevelListItem` exposes
    **ready-to-consume** `difficultyStars` (1–3) and `difficultyLabel` derived from the
    plain difficulty string, so the view never holds a domain type.
  - `LevelCard` renders the rating from `difficultyStars` instead of mapping the raw
    difficulty itself.

## Out of scope

- Changing any serialized value (the wire/backend contract keeps `EASY`/`WON`/
  `MOVE_EXECUTED`/… exactly).
- Touching `LevelDefinition.difficulty` (an application build input that legitimately
  consumes domain `Difficulty` to construct levels).
- Enriching the rest of the ViewStates or splitting level fixtures (that is `CA-012`).

## Acceptance criteria (from the ticket)

1. `src/presentation` has **no** import from `@/domain` (enforced by eslint
   `import/no-restricted-paths`).
2. `application/dto` does **not** re-export any type from `domain`.
3. Snapshots and events reaching ViewModels are plain objects with the boundary's **own**
   DTO literals.
4. `LevelCard` renders difficulty from `difficultyStars` / `difficultyLabel` of the
   ViewState.
5. `npm run verify` is green.
