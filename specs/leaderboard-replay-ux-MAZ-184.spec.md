# Spec - Leaderboard Empty State and Replay Submit UX (Client / Mobile)

Date: 2026-06-29
Ticket: `MAZ-184`
Source: Linear issue `MAZ-184`, M9 audit notes, and current client code
Status: Backlog / pending executable contract approval. The `@s` scenarios in
`specs/leaderboard-replay-ux-MAZ-184.feature` are the executable contract for
this slice.

## Purpose

Make leaderboard reads and victory submit feedback honest for players: a known
level with no scores should render the friendly empty leaderboard state, replay
submits should no longer be silently swallowed, and real submit failures should
be visible enough for the player to understand that leaderboard sync failed.

## In scope / Out of scope

- In scope: map leaderboard not-found responses caused by scoreless levels to
  `AsyncStatus.Empty`; keep non-404 failures as error; add observable victory
  submit status for successful leaderboard sync, skipped non-UUID submit, and
  real submit failure; stop using `.catch(() => undefined)` for leaderboard
  submit failures; update tests and i18n copy for the new UI states.
- Out of scope: backend MAZ-173 implementation, backend MAZ-172 best-score
  rules, client UUID catalog fix MAZ-183, changing score calculation,
  changing auth/session routing from MAZ-179/MAZ-180, and adding backend
  metadata that distinguishes "new best" from "already recorded".

## Behavior

- `LeaderboardViewModel.load(levelId)` keeps the existing UUID guard for local
  slug fallback ids.
- When the leaderboard facade/repository reports `NOT_FOUND` for a UUID level,
  the ViewModel treats that response as an empty leaderboard, not as a generic
  error.
- Network/server/unknown failures continue to produce `AsyncStatus.Error`.
- Victory submit attempts continue to complete local progress independently.
- Leaderboard submit success produces a visible success state on the victory
  overlay, phrased generically as score synced/submitted because the backend
  does not currently say whether the score was a new best.
- Leaderboard submit failure produces a visible warning/error state on the
  victory overlay; the player can still navigate home, replay, next level, or
  open the leaderboard.
- If the level id is not a UUID, the app must not POST to leaderboard. That
  degraded path is shown separately from a real backend failure and remains
  owned by MAZ-183.

## Architecture placement (domain -> application -> presentation; inward-only deps)

- Domain: no change.
- Application: existing `LeaderboardFacade` remains the boundary used by
  presentation. The implementation should avoid forcing ViewModels to import
  HTTP or infrastructure errors directly. Preferred option: expose an
  application-level result/error classification for leaderboard not-found.
- Infrastructure/Adapters: if needed, translate HTTP 404 into the existing
  application-facing error/result shape; do not leak raw Axios or HTTP response
  objects to presentation.
- Presentation: `LeaderboardViewModel` owns async leaderboard view state;
  victory UI receives a submit status prop and renders copy only.
- Framework/app: `app/game.tsx` orchestrates the victory side effect, updates a
  presentation status, and passes it into `GameScreen`/`VictoryScreen`.

## Clean Architecture contract

Applicable rules from `docs/reglas_clean_arch.md`:

- [x] Regla de dependencia (dependencies point inward only)
- [x] Independencia del dominio (no RN/Expo/storage/http/navigation in `src/domain`)
- [x] Application solo orquesta (no business rules, no infra/framework/presentation imports)
- [x] Repositorios: interfaz adentro (port), implementacion afuera (infrastructure)
- [x] DTOs simples en fronteras (primitives/records, no raw domain entities/types)
- [x] Invariantes en VO/agregados (no en ViewModels/screens)
- [x] MVVM: View dumb, ViewModel solo presentacion, streams/view state, composition root en framework

Layer impact:

- Domain: no previsto.
- Application: possible small leaderboard result/error classification so
  presentation can react to not-found without importing infrastructure.
- Infrastructure/Adapters: possible mapping from HTTP 404 to the application
  classification; repository contract remains behind `ILeaderboardRepository`.
- Presentation (MVVM): `LeaderboardViewModel` maps empty/not-found/error to
  `AsyncUiState`; `VictoryScreen` renders submit status text only.
- Framework (composition root): `app/game.tsx` observes victory submit promise
  and passes submit status to presentation.

Forbidden moves:

- [ ] `src/domain` importing React/RN/Expo/storage/http/navigation
- [ ] `src/application` importing `infrastructure`/`framework`/`presentation`
- [ ] Views/screens containing business rules, framework side effects, or dependency composition
- [ ] ViewModels calculating scoring/progress/authorization/persistence or domain results
- [ ] DTOs to presentation re-exporting raw domain entities/types
- [ ] NativeWind/Zustand/svg/reanimated imported by `domain`/`application` or game-rule logic

Required tests:

- Domain: no previsto.
- Application: only if a new application-level leaderboard error/result
  classification is introduced.
- Infrastructure/Adapters: only if HTTP 404 mapping changes at adapter level.
- Presentation/UI: `LeaderboardViewModel` maps `NOT_FOUND` to Empty and keeps
  non-404 failures as Error; Victory/Game UI renders submit success, skipped,
  and failure states.
- Framework/app: a route-level or extracted pure orchestration test proves
  leaderboard submit success/failure is not swallowed.

Architecture acceptance criteria:

- Given the touched layers in this ticket, When imports are inspected, Then
  dependencies point inward only.
- Given a backend 404 is handled, When implementation is inspected, Then
  presentation does not depend on Axios, raw HTTP responses, or concrete
  infrastructure adapters.
- Given victory submit status is rendered, When UI files are inspected, Then
  screens only render props/state and do not calculate score, auth, persistence,
  or backend semantics.

## Edge cases

- UUID level has no leaderboard row yet.
- Unknown network/server failure while loading leaderboard.
- Non-UUID fallback level id reaches leaderboard view.
- Victory leaderboard submit succeeds after MAZ-172 idempotent replay behavior.
- Victory leaderboard submit fails with a real backend/network error.
- Victory progress completion succeeds while leaderboard submit fails.
- Victory leaderboard submit is skipped because the level id is not a UUID.
- User navigates away while submit is still pending.

## Acceptance criteria (Given/When/Then)

- S1: Given a UUID level whose leaderboard read returns `NOT_FOUND`, When the
  leaderboard screen loads, Then the empty leaderboard state is shown instead
  of the error/retry state.
- S2: Given a leaderboard read fails for a non-404 reason, When the leaderboard
  screen loads, Then the error/retry state is still shown.
- S3: Given a non-UUID fallback level id, When the leaderboard screen loads,
  Then no leaderboard request is made and the empty leaderboard state is shown.
- S4: Given a victory replay submit succeeds, When the victory overlay renders,
  Then the player sees a successful score sync/submission message.
- S5: Given a victory submit fails for leaderboard sync, When the victory
  overlay renders, Then the player sees a visible leaderboard sync failure
  message and navigation actions remain available.
- S6: Given local progress completion and leaderboard submit run on victory,
  When leaderboard submit fails, Then progress completion is not blocked or
  reported as failed by the leaderboard error.
- S7: Given the backend cannot distinguish "new best" from "already recorded",
  When submit success is displayed, Then the copy is generic and does not claim
  a new best score.

## Decisions

- Decision: show generic "score submitted/synced" copy on successful submit.
  Reason: backend MAZ-172 makes replay idempotent but returns no metadata about
  whether the submitted score improved the previous best. Claiming "new best"
  would be misleading.
  Discarded alternative: show "new best" on every success; inaccurate without
  backend metadata.
- Decision: treat 404/`NOT_FOUND` as empty only on leaderboard reads.
  Reason: MAZ-173 will make known scoreless levels return 200-empty, but the
  client should remain defensive during rollout. Other features should not
  globally reinterpret 404.
  Discarded alternative: map all app 404s to Empty; too broad and would hide
  real missing content.
- Decision: keep progress completion independent from leaderboard submit
  feedback.
  Reason: local/remote progress is a separate persistence path; a leaderboard
  sync failure should not erase level completion.
  Discarded alternative: make the whole victory side effect fail as one unit;
  that would punish progress for a leaderboard-only problem.

## Affected tickets

- `MAZ-172`: backend best-score upsert removes replay 422 and makes successful
  replay submit possible.
- `MAZ-173`: backend read contract should eventually return 200-empty for known
  scoreless levels. MAZ-184 adds defensive client behavior while that lands.
- `MAZ-179`: mandatory auth means victory submit has a session; MAZ-184 should
  not reintroduce guest submit paths.
- `MAZ-180`: global 401 handling remains out of scope. Submit 401 should follow
  the future session-expired flow, not a leaderboard-specific workaround.
- `MAZ-183`: UUID level id guarantee remains the owner of slug/fallback catalog
  fixes; MAZ-184 should only keep the no-POST guard and visible skipped state.

## Risks / OPEN QUESTIONS

- OPEN QUESTION: Should the not-found-to-empty mapping live in
  `LeaderboardFacade` as an application-level result, or in an adapter-level
  mapper that preserves a UI-safe error code? Both avoid importing
  infrastructure errors in presentation; the team should approve one before TDD.
- OPEN QUESTION: Should a failed leaderboard submit offer a retry button on the
  victory overlay, or is visible warning text plus the existing leaderboard
  navigation enough for this slice?
- Risk: if MAZ-173 changes the leaderboard DTO for empty responses by removing
  `leaderboardId` or `updatedAt`, MAZ-184 tests may need to use a compatible
  fixture or update the client port shape in coordination with MAZ-173.
