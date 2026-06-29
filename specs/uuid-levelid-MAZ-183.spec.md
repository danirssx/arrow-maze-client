# Spec — Guarantee a UUID levelId reaches submit & leaderboard (Client / Mobile)

Date: 2026-06-28
Ticket: `MAZ-183`
Source: M9 audit (`arrow-maze-m9-auth-leaderboard-fixes`) — client leaderboard/progress defect #1; source `MAZ-141`.
Status: approved pending human gate. The `@s` scenarios in `specs/uuid-levelid-MAZ-183.feature` are the executable contract for this slice.

## Purpose

The backend requires a v4 **UUID** `levelId` and returns **422** otherwise. The client's offline
fallback catalog (`manualLevels.ts`) uses **slug** ids (`"manual-001-first-knot"`). The `levelId`
sent to the three network sinks is the raw route param (`app/game.tsx:31`), which equals the
selected `LevelListItem.id` — a slug whenever the remote catalog is not the active source (initial
render before `loadLevels()` resolves, or any `.catch()` fallback). So winning a level offline POSTs
a slug to `POST /progress/levels/<slug>/complete` and `POST /leaderboard/scores`, and reads
`GET /leaderboard/<slug>` — all 422. The breakage is invisible because every test uses slug ids.

This slice (1) makes the offline fallback emit the **real backend UUIDs** so a slug never enters the
flow, and (2) adds a pure UUID guard at the application network boundary so a non-UUID can never
reach the backend even if data drifts again, and (3) migrates the slug-id tests to UUIDs so the
contract is actually exercised.

## In scope / Out of scope

- In scope: replace the 15 `manualLevels.ts` fixture slug ids with the canonical backend seed UUIDs
  (orders 1-15); add `src/shared/isUuid.ts`; guard `LeaderboardFacade.submitScore`,
  `ProgressFacade.completeLevel`, and `LeaderboardViewModel.load` against non-UUID levelIds; migrate
  slug-id test placeholders to UUIDs.
- Out of scope: changing facade signatures; the leaderboard replay/empty-state UX (`MAZ-184`); the
  offline reconnect drain (`MAZ-185`); a victory-submit integration test (`MAZ-186`); any backend
  change; reconciling offline fixture **geometry** with the backend (catalog source-of-truth is
  `MAZ-168/169`).

## Behavior

- The offline fallback fixtures expose only valid v4 UUID ids (the same `550e8400-…-4466554400XX`
  ids the backend seeds for orders 1-15). Display name/order/difficulty are unchanged (the fixture
  `id` is a pure play/lookup key; `name` is dropped and `order` is the array index).
- `isUuid(value)` returns true only for a canonical v4 UUID string.
- The three application network sinks no-op / degrade (never call the network) when the levelId is
  not a UUID, and behave exactly as today when it is:
  - `LeaderboardFacade.submitScore` — skips the repository call.
  - `LeaderboardViewModel.load` — sets `Empty` without calling the facade.
  - `ProgressFacade.completeLevel` — skips local save and remote completion, returning current/empty progress.

## Architecture placement (domain → application → presentation; inward-only deps)

- `src/shared/isUuid.ts` — pure, zero-dependency validator (parallel to the existing `createUuid.ts`),
  importable by any layer (outside every eslint `no-restricted-paths` zone).
- Application: `manualLevels.ts` fixture data; `LeaderboardFacade`/`ProgressFacade` guards.
- Presentation: `LeaderboardViewModel.load` guard (input-format guard at the View-state boundary, not a business rule).

## Clean Architecture contract

Applicable rules from `docs/reglas_clean_arch.md`:

- [x] Regla de dependencia (dependencies point inward only) — `isUuid` is a leaf util; no new cross-layer edges.
- [x] Independencia del dominio — domain untouched.
- [x] Application solo orquesta — facades gain a format guard, no new business rules; no infra/framework/presentation imports.
- [x] Repositorios: interfaz adentro — unchanged.
- [x] DTOs simples en fronteras — unchanged (levelId stays a `string`).
- [x] Invariantes en VO/agregados — `isUuid` is a format predicate, not a domain invariant; no entity added.
- [x] MVVM — `LeaderboardViewModel` keeps presentation-only logic (guards the request, sets view state).

Layer impact:

- Domain: none.
- Application: `src/application/level-build/fixtures/manualLevels.ts` (15 ids → UUIDs); `src/application/facades/LeaderboardFacade.ts` + `src/application/facades/ProgressFacade.ts` (UUID guard).
- Infrastructure/Adapters: none.
- Presentation (MVVM): `src/presentation/view-models/LeaderboardViewModel.ts` (UUID guard → Empty).
- Framework (composition root): none.
- Shared: new `src/shared/isUuid.ts`.

Forbidden moves (must stay unchecked / not introduced):

- [ ] `src/domain` importing React/RN/Expo/storage/http/navigation
- [ ] `src/application` importing `infrastructure`/`framework`/`presentation`
- [ ] Views/screens containing business rules or composition
- [ ] ViewModels calculating scoring/progress/authorization/persistence
- [ ] DTOs re-exporting raw domain entities
- [ ] New entity/use-case/pattern without approval (only a `src/shared` util + guards are added)

Required tests:

- Application: `isUuid` unit; `LeaderboardFacade.submitScore` no-op/delegate by id; `ProgressFacade.completeLevel` no-op/persist by id; fixtures expose UUIDs.
- Presentation: `LeaderboardViewModel.load` Empty-without-request vs fetch.
- Migration: slug ids → UUIDs across contract/repo/VM/merge-policy tests (AC3).

## Edge cases

- Non-UUID levelId (slug, empty string, non-v4 UUID) → no network call. Valid UUID → unchanged behavior. Initial render before `loadLevels()` resolves now uses a UUID fixture id, so even an immediate win records correctly.

## Acceptance criteria (Given/When/Then)

See `specs/uuid-levelid-MAZ-183.feature` `@s1`..`@s8`. Ticket ACs:
- Catalog fails to load → win → no slug 422 (a valid UUID fixture id is used). ✓ (@s1)
- Online → submit/complete/leaderboard use the backend UUID. ✓ (already; preserved by @s4/@s6/@s8)
- Tests use UUID levelIds end-to-end. ✓ (test migration)

## Decisions

- **Adopt the 15 canonical backend seed UUIDs (orders 1-15, `…440010`..`…440024`) as the fixture ids**, mapped by order. Reason: makes the offline fallback align with the real backend levels, so offline-completed progress/scores reference real levels and sync correctly; the fixture `id` is a pure play key, so display/order are unaffected. Discarded: random UUIDs (would reference non-existent backend levels → orphan/FK issues with `MAZ-176`); slug→UUID runtime mapping (needs a map that drifts).
- **Add an `isUuid` guard at the application boundary** (the two facades + the leaderboard VM), not only the data fix. Reason: the bug was invisible drift; enforcing "a slug can never reach the network" as a tested invariant prevents recurrence. Silent no-op/degrade matches the existing best-effort semantics (victory writes already `.catch(()=>undefined)`; unauthenticated already no-ops). Discarded: guarding inside `app/game.tsx` (untested presentation effect — `MAZ-186`); a `LevelId` domain value object (would be a new domain entity needing team approval).
- **`isUuid` lives in `src/shared`** next to `createUuid.ts`. Reason: pure leaf util, already the home of `createUuid`; importable from every layer.

## Risks / OPEN QUESTIONS

- The offline fixture **geometry** may differ from what the backend serves for the same UUID (pre-existing offline-degraded-mode caveat; catalog source-of-truth is `MAZ-168/169`). This slice only fixes the `levelId` (422); geometry alignment is out of scope.
- OPEN: keep the guard a **silent no-op** (chosen, matches best-effort writes) vs surface a user-visible message? User-facing leaderboard/replay UX is `MAZ-184`.
