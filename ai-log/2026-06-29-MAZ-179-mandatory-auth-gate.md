# AI Usage Log: MAZ-179 Enforce mandatory auth gate on mobile launch

## Task / Problem

Client ticket `MAZ-179`: make mobile login mandatory after the existing
MAZ-139 login flow by bootstrapping the persisted session at launch, guarding
protected routes, removing gameplay guest rendering, and exposing visible
identity/logout controls.

## Tool and Model

Codex CLI / GPT-5.

## Prompt Used

User asked to implement MAZ-179 following both repo `AGENTS.md` files, the root
`MEMORY.md`, `Linear_MCP_Guideline.md`, a fresh worktree, AI usage logging,
checks, commit/push/PR, and Linear update. The Linear issue was read through the
local Linear GraphQL workflow without exposing secrets.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | Read and applied the role constraints to distill the Linear issue into a local executable contract without running a separate agent session. | `specs/mandatory-auth-gate.spec.md` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Read and applied the Gherkin/planning rules to create tagged scenarios and keep the slice within the approved Clean Architecture contract. | `specs/mandatory-auth-gate.feature` |
| TDD Implementer (`.agents/tdd-implementer.md`) | Referenced | Followed red-green-refactor locally: added failing AuthGate/Home/Settings tests first, then implemented the route gate and UI props. | `tests/framework/auth/AuthGate.test.tsx`, `tests/presentation/screens/HomeScreen.test.tsx`, `tests/presentation/screens/SettingsScreen.test.tsx` |
| Judge (`.agents/judge.md`) | Not used | No separate judge review was run in this session. | N/A |
| Mutation Tester (`.agents/mutation.md`) | Not used | This ticket changed framework routing and presentation behavior only; no domain/application rule was added. | N/A |

## Scenario Coverage (@s -> test)

| Scenario | Concrete test coverage |
| --- | --- |
| `@s1` unauthenticated protected route redirects to `/login` | `tests/framework/auth/AuthGate.test.tsx` -> `should_redirect_to_login_when_protected_route_has_no_session` |
| `@s2` persisted session renders protected content | `tests/framework/auth/AuthGate.test.tsx` -> `should_render_protected_content_when_session_bootstraps` |
| `@s3` logout clears session and returns to login | `tests/framework/auth/AuthGate.test.tsx` -> `should_clear_session_and_redirect_to_login_when_logout_runs` |
| `@s4` Home/Settings show username and logout | `tests/presentation/screens/HomeScreen.test.tsx` and `tests/presentation/screens/SettingsScreen.test.tsx` -> `should_show_username_and_logout_when_session_identity_is_provided` |
| `@s5` game route is protected before guest gameplay can render | `tests/framework/auth/AuthGate.test.tsx` -> `should_redirect_to_login_when_game_route_has_no_session` |

## Result Obtained

- Added `AuthGate` in `src/framework/auth` to bootstrap persisted session,
  protect every non-login route, redirect authenticated users away from
  `/login`, and expose session/clear/refresh through framework context.
- Wrapped the Expo Router stack in `app/_layout.tsx`.
- Updated login success to refresh the auth context and replace navigation with
  Home.
- Updated Home and Settings routes/screens to show username and a logout action.
- Updated game and progress routes to consume the auth context instead of
  tolerating guest session data.
- Added `clearCurrentSession()` in the framework session composition helper.

## Verification

- `npm run typecheck` GREEN.
- `npm run lint` GREEN.
- `npm test -- --runInBand tests/framework/auth/AuthGate.test.tsx tests/presentation/screens/HomeScreen.test.tsx tests/presentation/screens/SettingsScreen.test.tsx` GREEN (3 suites / 15 tests).
- `npm run verify` GREEN (lint, typecheck, coverage; 60 suites / 301 tests). Existing React Native `Animated(View)` act warnings still appear in unrelated UI coverage tests.

## Team Modifications Pending Human Review

- Confirm the product decision that persisted-session presence is sufficient for
  MAZ-179. Token validation through `GET /users/me` and global 401 handling is
  intentionally deferred to MAZ-180.
- Review that Settings no longer routes authenticated users to `/login` for
  account management; the visible account action for this slice is logout.

## Lessons / Limitations

- A framework-level gate avoids duplicated per-route checks and catches deep
  links consistently.
- Presentation screens stayed UI-only by receiving identity/logout props instead
  of reading storage or navigation directly.
