# Spec: Redesign Home account area and remove coin badge (MAZ-215 — client)

Date: 2026-07-09
Ticket: `MAZ-215`
Source: Linear issue `MAZ-215 - M12-03 - Redesign mobile home account area and remove unused coin badge`
Status: Backlog; executable contract pending human approval.

## Purpose

Make the Home account area match the current authenticated product: show the
signed-in username and a clear logout action, while removing the unused coin
badge and every visual coin reference from Home.

## In scope / Out of scope

- In scope: Home authenticated account presentation, Home unauthenticated fallback,
  Settings logout availability, Home coin badge removal, and presentation tests.
- Out of scope: economy/coins features, auth/session semantics, logout use-case
  behavior, backend changes, new screens, and settings redesign beyond verifying
  the existing logout remains available.

## Behavior

When Home receives an authenticated username, it renders an account area with
only that username as identity copy and a clearly placed logout action. The
logout action is not compressed into tiny secondary detail text and invokes the
injected logout callback.

When Home receives no username, it renders no fake account data and no logout
control. Home does not render `CoinBadge`, does not expose `home-coins`, and
does not accept or display a coin amount.

Settings keeps its existing session identity and logout behavior so users can
still sign out from Settings.

## Architecture placement (domain -> application -> presentation; inward-only deps)

This is a presentation-only slice. Home remains a dumb MVVM View: it receives
primitive props (`username`, callbacks), renders view state, and emits intents
through injected callbacks. The route in `app/index.tsx` continues to read the
session from framework `AuthGate` and pass primitives/callbacks down. No domain,
application, infrastructure, or auth semantics change.

## Clean Architecture contract

Applicable rules from `docs/reglas_clean_arch.md`:

- [x] Regla de dependencia (dependencies point inward only)
- [x] Independencia del dominio (no RN/Expo/storage/http/navigation in `src/domain`)
- [x] Application solo orquesta (no business rules, no infra/framework/presentation imports)
- [ ] Repositorios: interfaz adentro (port), implementación afuera (infrastructure)
- [x] DTOs simples en fronteras (primitives/records, no raw domain entities/types)
- [ ] Invariantes en VO/agregados (no domain invariant changes in this slice)
- [x] MVVM: View dumb, ViewModel solo presentación, streams/view state, composition root en framework

Layer impact:

- Domain: no previsto.
- Application: no previsto.
- Infrastructure/Adapters: no previsto.
- Presentation (MVVM): `src/presentation/screens/HomeScreen.tsx` redesigns the
  account area and removes `CoinBadge` usage/coin props.
- Framework (composition root): `app/index.tsx` may stop passing unused coin
  data and should keep session extraction/logout callback wiring only.

Forbidden moves:

- [ ] `src/domain` importing React/RN/Expo/storage/http/navigation
- [ ] `src/application` importing `infrastructure`/`framework`/`presentation`
- [ ] Views/screens containing business rules, framework side effects, or dependency composition
- [ ] ViewModels calculating scoring/progress/authorization/persistence or domain results
- [ ] DTOs to presentation re-exporting raw domain entities/types
- [ ] NativeWind/Zustand/svg/reanimated imported by `domain`/`application` or game-rule logic

Required tests:

- Domain: none; no domain behavior changes.
- Application: none; no use-case behavior changes.
- Presentation/UI: React Native Testing Library coverage for authenticated Home,
  unauthenticated Home, Home coin badge removal, and Settings logout availability.

Architecture acceptance criteria:

- Given the touched layers in this ticket, When imports are inspected, Then dependencies point inward only.
- Given Home receives route/session data, When props are inspected, Then the View consumes primitives and callbacks only.
- Given Home is inspected, When account behavior is reviewed, Then it renders state and emits intents without auth/session rules.

## Edge cases

- AuthGate normally protects Home, but the component must still render safely
  with no `username` prop in isolated tests.
- Logout may be unavailable in a story/test fixture; Home should only render the
  logout action when authenticated identity and callback are both present.
- Settings already handles optional `username`/`onLogout`; this ticket verifies
  that behavior is preserved.

## Acceptance criteria (Given/When/Then)

- S1: Given an authenticated user, When Home opens, Then the user sees only the
  username as identity copy and a clearly placed logout action.
- S2: Given an authenticated user, When the Home logout action is pressed, Then
  the injected logout intent is invoked once.
- S3: Given an authenticated user, When Settings opens, Then logout is still available.
- S4: Given an unauthenticated state, When Home opens, Then no fake account
  information or logout action appears.
- S5: Given Home is inspected, When it renders, Then no coin badge, `home-coins`
  element, coin amount, or visual coin reference appears.
- S6: Given imports are inspected, When the presentation change is reviewed, Then
  Home introduces no business rules and keeps MVVM dependency boundaries.

## Decisions

- Keep logout orchestration in `app/index.tsx`/`AuthGate` and only pass a
  callback to Home. Reason: Home is a dumb View. Discarded alternative:
  compose auth/logout dependencies inside `HomeScreen`.
- Remove the `coins` prop from Home rather than defaulting it to zero. Reason:
  the feature is not implemented, so a zero badge is misleading. Discarded
  alternative: hide the visual badge but keep a dormant prop.
- Preserve Settings logout as-is and cover it with tests. Reason: MAZ-215 asks
  for availability, not a Settings redesign. Discarded alternative: redesign
  Settings account area in the same slice.

## Risks / OPEN QUESTIONS

- The exact visual spacing/button style is implementation detail, but the test
  should assert observable behavior and the absence of coin UI, not fragile class
  strings.
