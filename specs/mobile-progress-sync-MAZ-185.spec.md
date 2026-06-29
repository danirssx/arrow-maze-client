# Spec — Robust victory persistence + drain offline progress (Client / Mobile)

Date: 2026-06-29
Ticket: `MAZ-185` (M9 — Mandatory Auth & Leaderboard/Progress Fixes; C7)
Source: M9 audit, "client-leaderboard/progress defects #4, #6"
Status: approved. The `@s` scenarios in `specs/mobile-progress-sync-MAZ-185.feature`
are the executable contract for this slice.

## Purpose

Two gaps make offline/failed completions disappear silently:
1. Victory writes are **fire-and-forget with swallowed failures** — `app/game.tsx`
   does `void progressFacade.completeLevel(...).catch(() => undefined)` (and the
   same for `submitScore`). A failed write (expired token, no network) is lost
   with no signal.
2. The **offline drain path is missing** — `ProgressFacade.sync()` /
   `hasPendingSync()` exist and are tested, but **no caller ever invokes `sync()`**.
   A completion saved offline as `pendingSync:true` survives locally but never
   reaches the backend because there is no connectivity/app-resume trigger.

This slice adds an application drain operation and a framework trigger
(connectivity + app-foreground) that calls it, and stops swallowing victory-write
failures.

## In scope / Out of scope

- In scope:
  - `ProgressFacade.drainPendingProgress(userId, accessToken)` (application):
    if there is pending progress, run `sync()` and report whether it drained.
  - `startProgressSync(drain, triggers)` (framework, pure): drain on start, on
    app-foreground, and on reconnect; return an unsubscribe.
  - `useProgressSync()` (framework hook): wire real `AppState` + NetInfo to
    `startProgressSync` for the signed-in session.
  - Mount the hook in the root layout; log (not swallow) victory-write failures in
    `app/game.tsx`.
  - Add `@react-native-community/netinfo` + its Jest mock.
- Out of scope:
  - The mandatory-login gate (MAZ-179), 401 handling (MAZ-180), Bearer interceptor
    (MAZ-181), UUID levelId guarantee (MAZ-183), leaderboard replay UX (MAZ-184).
    No change to `ProgressFacade.completeLevel/sync/hasPendingSync` behavior, the
    repositories, ports, DTOs, or the progress domain.

## Behavior

- `ProgressFacade.completeLevel` already saves the merged completion locally with
  `pendingSync:true` **before** the remote call, so a remote failure leaves the
  completion retained locally and the promise rejects. This slice does not change
  that; it stops the caller from swallowing the rejection.
- `ProgressFacade.drainPendingProgress(userId, accessToken)`:
  - if `hasPendingSync(userId)` is false → no-op, return `false` (no network call);
  - else → `sync(userId, accessToken)` (sends retained `completedLevels` to
    `PUT /progress/sync`, clears `pendingSync`), return `true`.
- `startProgressSync(drain, triggers)` (pure, platform-agnostic):
  - calls `drain()` once immediately (covers app launched with prior pending);
  - subscribes `drain` to `triggers.subscribeForeground` and
    `triggers.subscribeReconnect`;
  - returns an unsubscribe that detaches both.
- `useProgressSync()`: for a signed-in session, builds a `drain` that calls
  `drainPendingProgress` (logging failures), and maps `AppState` `active` →
  foreground and NetInfo `isConnected` → reconnect. No-op while signed out.

## Architecture placement (domain → application → presentation; inward-only deps)

- Application owns the drain decision (`drainPendingProgress`) over the existing
  `IProgressRepository`/`IRemoteProgressRepository` ports — no platform concepts.
- Framework owns *when* to drain: a pure `startProgressSync` coordinator (triggers
  injected, no RN/React) and a thin `useProgressSync` hook that supplies the real
  `AppState`/NetInfo subscriptions. NetInfo (external tool) is imported only in
  framework wiring. Presentation/`app` only mounts the hook and logs failures.

## Clean Architecture contract

Applicable rules from `docs/reglas_clean_arch.md`:

- [x] Regla de dependencia (dependencies point inward only)
- [x] Independencia del dominio (no RN/Expo/storage/http/navigation in `src/domain`)
- [x] Application solo orquesta (no business rules; depends on ports, not infra/framework)
- [x] Repositorios: interfaz adentro (ports), implementación afuera
- [x] DTOs simples en fronteras (no boundary DTO change)
- [x] Invariantes en VO/agregados (best-completion merge stays in `ProgressMergePolicy`)
- [x] MVVM: trigger wiring + composition stay in framework; no business rule in UI

Layer impact:

- Domain: `no previsto`.
- Application: add `ProgressFacade.drainPendingProgress` (composes existing
  `hasPendingSync` + `sync`).
- Infrastructure/Adapters: `no previsto` (reuse existing repositories; NetInfo is
  wired in framework, not a new repository).
- Presentation (MVVM): `app/game.tsx` logs victory-write failures instead of
  swallowing them (composition root of the game route).
- Framework (composition root): new pure `startProgressSync` coordinator + thin
  `useProgressSync` hook; mount the hook in `app/_layout.tsx`.

Forbidden moves (must stay unchecked / not introduced):

- [ ] `src/domain` importing React/RN/Expo/storage/http/navigation
- [ ] `src/application` importing `infrastructure`/`framework`/`presentation` or NetInfo/AppState
- [ ] Views/screens containing business rules or dependency composition
- [ ] ViewModels calculating scoring/progress/authorization/persistence
- [ ] NetInfo/AppState imported by `domain`/`application`

Required tests:

- Domain: none.
- Application: `drainPendingProgress` drains when pending, no-ops when not, and a
  failed remote `completeLevel` retains `pendingSync` then a later drain retries it.
- Framework: `startProgressSync` drains on start/foreground/reconnect and
  unsubscribes; `useProgressSync` drains via mocked NetInfo for a session.

Architecture acceptance criteria:

- Given the touched layers, When imports are inspected, Then NetInfo/AppState
  appear only in framework wiring and deps point inward only.
- Given the drain decision, When inspected, Then it lives in the application
  Facade, not in a screen/hook.

## Edge cases

- No pending progress on a trigger → no remote call (`drainPendingProgress` false).
- Signed out → hook does nothing.
- Remote `sync` fails during a drain → rejection is logged; `pendingSync` stays
  true (still retained for the next trigger).
- App launched online with prior pending → drained once on mount.

## Acceptance criteria (Given/When/Then)

- S1: Given pending progress, When `drainPendingProgress` runs, Then it calls
  `sync` and reports `true`; the stored progress is `pendingSync:false`.
- S2: Given no pending progress, When `drainPendingProgress` runs, Then it makes no
  remote call and reports `false`.
- S3: Given a remote completion write fails, Then the local completion is retained
  with `pendingSync:true` and the promise rejects (caller can log/retry).
- S4: Given retained pending progress, When a later drain runs, Then the retained
  completion is sent to remote `sync`.
- S5: Given `startProgressSync`, When started, Then it drains immediately.
- S6: Given `startProgressSync`, When a foreground or reconnect trigger fires, Then
  it drains; When unsubscribed, Then later triggers do not drain.
- S7: Given a signed-in session, When connectivity returns (mocked NetInfo), Then
  `drainPendingProgress` runs for that session.

## Decisions

- **Drain decision in the application Facade, not the hook.** Keeps the
  "sync if pending" rule testable without React and out of the UI. Discarded: the
  hook calling `hasPendingSync`+`sync` itself (application orchestration leaking
  into framework).
- **Pure `startProgressSync` coordinator with injected triggers.** Makes the
  "drain on start/foreground/reconnect" behavior unit-testable without RN; the hook
  is thin glue like the existing `useCurrentSession`. Discarded: putting all wiring
  in the hook (only testable through fragile render mocks).
- **Add NetInfo (not only AppState).** The ticket's AC1 says "when connectivity
  returns"; NetInfo is the connectivity source. AppState `active` covers app-resume.
- **Log, don't swallow, victory-write failures.** `console.warn` is allowed by the
  eslint config; the local `pendingSync` already retains the completion, so the
  drain retries it later. Discarded: surfacing a blocking UI error (out of scope;
  belongs to MAZ-184's UX work).

## Risks / OPEN QUESTIONS

- NetInfo/AppState are platform modules; verified via Jest mocks, not a real
  device. Real reconnect/resume draining needs `expo run`.
- Builds on MAZ-179 (session) and MAZ-183 (UUID levelId), both In Review (not yet
  merged to `develop`). This slice branches off `develop` and does not depend on
  their code; the drain uses the session already exposed by `useCurrentSession`.
