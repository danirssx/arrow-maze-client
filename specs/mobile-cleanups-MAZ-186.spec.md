# Spec — Progress level names, dead victory route, unused DTO field + victory-submit test (Client / Mobile)

Date: 2026-06-29
Ticket: `MAZ-186` (M9 — Mandatory Auth & Leaderboard/Progress Fixes; C8)
Source: M9 audit, "client-leaderboard/progress defects #7, #8, #9 + test gap"
Status: approved. The `@s` scenarios in `specs/mobile-cleanups-MAZ-186.feature`
are the executable contract for this slice.

## Purpose

Four bundled cleanups + the one missing integration test:
1. `ProgressScreen` renders the raw `levelId` (UUID) as the visible label — show the
   human-readable catalog level name instead.
2. `app/victory.tsx` is a dead route (renders `VictoryScreen` with no submit; the
   real victory UX is the overlay inside `app/game.tsx`) — remove it.
3. `SubmitScoreRequestDto` declares an unused `userId` (the runtime body omits it;
   the backend derives `userId` from the token) — drop the misleading field.
4. There is no integration test for the most important path — winning a level
   submits score + progress with the right ids — add it.

## In scope / Out of scope

- In scope:
  - Surface the catalog level `name` through `LevelListItem`/`ManualLevelFixture`;
    `app/progress.tsx` builds a `levelId → name` map; `ProgressScreen` renders the
    name (falling back to the id).
  - Delete the dead `app/victory.tsx` route (keep `VictoryScreen`, still used by the
    in-game overlay in `GameScreen`).
  - Remove `userId` from `SubmitScoreRequestDto` (+ the contract-test copy).
  - Add a victory-submit integration test over `app/game.tsx`'s `GameRoute`.
- Out of scope:
  - Any behavior change to leaderboard/progress submission, scoring, or the catalog
    contract. No backend change.

## Behavior

- `LevelListItem` gains `name: string` (sourced from `LevelCatalogSummary.name`
  remotely and the fixture `name` offline). `ProgressScreen` takes an optional
  `levelNameById` map and renders `levelNameById[levelId] ?? levelId` per completed
  level, so a missing mapping degrades to the id rather than crashing.
- The `/victory` route no longer exists; navigation already uses the in-game
  overlay. `VictoryScreen` (the component) is unchanged.
- `SubmitScoreRequestDto` no longer contains `userId`; the HTTP body was already
  built without it, so the wire contract is unchanged.
- The victory-submit integration test renders `GameRoute`, solves the first manual
  level by tapping its arrows in a valid extraction order, and asserts the victory
  effect calls `completeLevel` and `submitScore` once each with the UUID `levelId`,
  the session ids, the username snapshot, and arrow-count moves.

## Architecture placement (domain → application → presentation; inward-only deps)

Presentation/framework + a fixtures/ViewModel field. `name` is plain catalog
display data carried on the existing `LevelListItem` (presentation) and
`ManualLevelFixture`/`LevelCatalogSummary` (application). The name lookup is built
in the composition root (`app/progress.tsx`) and passed to the dumb screen. No
domain change; no new use case, entity, or pattern.

## Clean Architecture contract

Applicable rules from `docs/reglas_clean_arch.md`:

- [x] Regla de dependencia (dependencies point inward only)
- [x] Independencia del dominio (no RN/Expo/storage/http/navigation in `src/domain`)
- [x] Application solo orquesta (no business rules added)
- [x] Repositorios: interfaz adentro, implementación afuera (unchanged)
- [x] DTOs simples en fronteras (`SubmitScoreRequestDto` stays a primitive record, now leaner)
- [x] Invariantes en VO/agregados (none added in UI)
- [x] MVVM: the screen stays dumb; the name map is built in the composition root

Layer impact:

- Domain: `no previsto`.
- Application: `ManualLevelFixture` + fixtures map gain `name`; `LevelListItem` gains
  `name` (presentation VM type) sourced from `LevelCatalogSummary.name`.
- Infrastructure/Adapters: `SubmitScoreRequestDto` drops the unused `userId`.
- Presentation (MVVM): `ProgressScreen` renders the level name via an injected map.
- Framework (composition root): `app/progress.tsx` builds the `levelId → name` map;
  `app/victory.tsx` deleted.

Forbidden moves (must stay unchecked / not introduced):

- [ ] `src/domain` importing React/RN/Expo/storage/http/navigation
- [ ] `src/application` importing `infrastructure`/`framework`/`presentation`
- [ ] Views/screens containing business rules or dependency composition
- [ ] DTOs exposing domain entities or runtime objects

Required tests:

- Application/Presentation: `LevelSelectViewModel.getLevels()` exposes the level
  `name`.
- Presentation: `ProgressScreen` renders the mapped name and falls back to the id.
- Infrastructure: leaderboard contract test no longer carries `userId`.
- Integration: `GameRoute` victory effect fires `completeLevel` + `submitScore`.

Architecture acceptance criteria:

- Given the touched layers, When imports are inspected, Then dependencies point
  inward only and no new pattern/use case is introduced.
- Given the boundary DTO, When inspected, Then it is a leaner primitive record.

## Edge cases

- Completed level with no catalog mapping → falls back to the raw id (no crash).
- `/victory` removed → no navigation targets it (in-game overlay only).
- Victory effect dedups via `submittedVictoryKey` → submits once per win.

## Acceptance criteria (Given/When/Then)

- S1: Given the level catalog, When `getLevels()` is read, Then each item carries a
  human-readable `name`.
- S2: Given completed progress and a `levelId → name` map, When `ProgressScreen`
  renders, Then it shows the name, not the raw id.
- S3: Given a completed level with no mapping, When `ProgressScreen` renders, Then
  it falls back to the raw id.
- S4: Given `SubmitScoreRequestDto`, When inspected, Then it has no `userId` field.
- S5: Given a player wins the first level, When the victory effect runs, Then
  `completeLevel` is called once with the session ids and the UUID `levelId`.
- S6: Given a player wins the first level, When the victory effect runs, Then
  `submitScore` is called once with the UUID `levelId`, the username snapshot, the
  access token, and arrow-count moves.

## Decisions

- **Surface the existing catalog `name` rather than invent labels.** `LevelCatalogSummary`
  and the fixture drafts already carry `name`; threading it onto `LevelListItem`
  (offline + remote paths) is the faithful, consistent fix. Discarded: deriving
  "Level N" from `order` (loses the authored name).
- **`ProgressScreen` takes a `levelNameById` map, built in the composition root.**
  Keeps the screen dumb (no catalog dependency in the view) and the lookup out of
  the `ProgressViewModel` (which only owns progress, not the catalog). Discarded:
  enriching `ProgressViewModel` with the catalog (couples two concerns).
- **Delete `app/victory.tsx`, keep `VictoryScreen`.** The component is still used by
  the in-game overlay; only the orphan route is dead.
- **Integration test drives the real engine to victory** (taps a valid extraction
  order) with mocked framework facades, asserting the route's victory effect — the
  highest-value untested path.

## Risks / OPEN QUESTIONS

- The integration test depends on MAZ-183's UUID fixture ids (already on `develop`)
  to assert a UUID `levelId`. Score/elapsed-time values are clock-derived, so the
  test asserts ids/moves/structure, not exact score/time.
