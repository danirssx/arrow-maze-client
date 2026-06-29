# Spec — Mandatory Auth Gate (Client / Mobile)

Date: 2026-06-29
Ticket: `MAZ-179`
Source: Linear issue `MAZ-179`
Status: approved by user request. The `@s` scenarios in
`specs/mandatory-auth-gate.feature` are the executable contract for this slice.

## Purpose

Make login mandatory in the mobile app by bootstrapping a persisted session at
launch, guarding protected routes, and exposing visible identity/logout controls.

## In scope / Out of scope

- In scope: app launch session bootstrap, route guard for gameplay/progress/
  leaderboard/settings/home, `/login` as unauthenticated entry, loading state
  while bootstrap runs, login success returning to the app, visible username and
  logout actions in Home/Settings, and removing gameplay guest tolerance.
- Out of scope: backend implementation, token-refresh flows, global 401 retry
  handling (MAZ-180), leaderboard replay UX (MAZ-184), and native biometric auth.

## Behavior

- On launch, the app checks the persisted session before exposing protected
  routes.
- With no valid session, every protected route redirects to `/login`.
- `/login` remains public while unauthenticated.
- With a persisted session, the protected app renders without requiring manual
  login.
- If an authenticated user opens `/login`, the app redirects to Home.
- Logout clears the stored session and returns the app to `/login`.
- Gameplay is not rendered as a guest; score/progress submission always receives
  a session from the auth gate.

## Architecture placement (domain → application → presentation; inward-only deps)

- Domain: no change.
- Application: existing session/auth use cases and ports remain the business
  boundary for persisted auth state.
- Infrastructure/Adapters: no change for this slice; MAZ-180 can expand 401
  handling.
- Presentation: Home/Settings receive optional `username` and `onLogout` props
  and render only UI.
- Framework: `AuthGate` composes Expo Router redirects, session bootstrap, and
  a context consumed by route files.

## Clean Architecture contract

Applicable rules from `docs/reglas_clean_arch.md`:

- [x] Regla de dependencia (dependencies point inward only)
- [x] Independencia del dominio (no RN/Expo/storage/http/navigation in `src/domain`)
- [x] Application solo orquesta (no business rules, no infra/framework/presentation imports)
- [x] Repositorios: interfaz adentro (port), implementación afuera (infrastructure)
- [x] DTOs simples en fronteras (primitives/records, no raw domain entities/types)
- [x] Invariantes en VO/agregados (no en ViewModels/screens)
- [x] MVVM: View dumb, ViewModel solo presentación, streams/view state, composition root en framework

Layer impact:

- Domain: no previsto.
- Application: no new domain rules; existing session use cases remain.
- Infrastructure/Adapters: no previsto.
- Presentation (MVVM): Home/Settings render identity/logout props only.
- Framework (composition root): Root layout wraps navigation in an auth gate and
  route files consume session/logout context.

Forbidden moves:

- [ ] `src/domain` importing React/RN/Expo/storage/http/navigation
- [ ] `src/application` importing `infrastructure`/`framework`/`presentation`
- [ ] Views/screens containing business rules, framework side effects, or dependency composition
- [ ] ViewModels calculating scoring/progress/authorization/persistence or domain results
- [ ] DTOs to presentation re-exporting raw domain entities/types
- [ ] NativeWind/Zustand/svg/reanimated imported by `domain`/`application` or game-rule logic

Required tests:

- Domain: no previsto.
- Application: no previsto.
- Presentation/UI: Home/Settings identity/logout rendering.
- Framework: AuthGate redirects and logout/session bootstrap behavior.

Architecture acceptance criteria:

- Given the touched layers in this ticket, When imports are inspected, Then
  dependencies point inward only.
- Given boundaries are crossed, When DTOs are inspected, Then they are simple
  records/primitives.
- Given auth routing is involved, When implementation is inspected, Then Expo
  Router side effects live in app/framework, not domain/application.

## Edge cases

- Missing session at launch.
- Persisted session while opening `/login`.
- Logout from a protected route.
- Bootstrap loading state.
- Game victory before session is available.

## Acceptance criteria (Given/When/Then)

- S1: Given no session, When the app launches or a protected route is opened,
  Then the user is redirected to `/login` and protected content is not rendered.
- S2: Given a valid persisted session, When the app launches, Then the app
  renders protected content without requiring manual login.
- S3: Given logout, When the user triggers it from the app UI, Then the session
  is cleared and navigation returns to `/login`.
- S4: Given an authenticated user, When Home or Settings renders, Then the UI
  shows the username and a logout action.
- S5: Given gameplay runs after auth bootstrap, When victory is reached, Then
  progress/leaderboard submission uses a non-null session.

## Decisions

- Use a framework-level `AuthGate` around the Expo Router stack. The discarded
  alternative was per-route redirects only, which duplicates bootstrap and makes
  deep-link protection easier to miss.
- Keep Home/Settings as dumb presentation components with `username` and
  `onLogout` props. The discarded alternative was making screens read storage or
  navigation directly, which would violate MVVM boundaries.
- Session validation against `/users/me` is deferred to MAZ-180/401 handling
  because the MAZ-179 acceptance criteria require mandatory gating and
  rehydration; this slice keeps the current persisted-session contract intact.

## Risks / OPEN QUESTIONS

- If a persisted token is expired, this slice may briefly consider it present
  until a guarded API call fails. MAZ-180 owns global 401 handling.
