# AI Usage Log: MAZ-188 Auth navigation regression fix

## Task / Problem

Investigate and fix a mobile navigation regression found after M9 auth testing:
login and registration worked, but home actions did not reliably move to the
next screen and Expo Router logged `REPLACE` actions for `login` that were not
handled by any navigator.

## Tool and Model

Codex CLI / GPT-5.

## Prompt Used

The user reported that after successful login/register, the game flow was
compromised: buttons on the home page did not advance correctly, and the app
console showed `The action 'REPLACE' with payload {"name":"login","params":{}} was not handled by any navigator`.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | Used the M9 auth/navigation intent from existing work to preserve mandatory auth while diagnosing the regression. No separate agent session was run. | User console trace, `src/framework/auth/AuthGate.tsx` |
| Planner / Gherkin Author (`.agents/planner.md`) | Not used | No new Gherkin contract was created for this urgent regression fix. | N/A |
| TDD Implementer (`.agents/tdd-implementer.md`) | Referenced | Added a regression assertion around AuthGate redirects keeping the navigation tree mounted, then changed the gate and route handlers. | `tests/framework/auth/AuthGate.test.tsx` |
| Judge (`.agents/judge.md`) | Not used | No separate judge review session was run. | N/A |
| Mutation Tester (`.agents/mutation.md`) | Not used | Mutation was not run; this fix is in framework routing code outside the default mutation scope. | N/A |

## Scenario Coverage (@s -> test)

No approved Gherkin `@s` scenarios exist for this regression. Concrete coverage:

| Behavior | Concrete test coverage |
| --- | --- |
| Unauthenticated protected routes redirect to `/login` without unmounting the navigation tree | `tests/framework/auth/AuthGate.test.tsx` -> `should_redirect_to_login_without_unmounting_navigation_when_protected_route_has_no_session` |
| Logout and session invalidation still redirect to `/login` | `tests/framework/auth/AuthGate.test.tsx` -> `should_clear_session_and_redirect_to_login_when_logout_runs`; `should_clear_session_and_redirect_to_login_when_session_is_invalidated` |
| Authenticated users are redirected away from `/login` | `tests/framework/auth/AuthGate.test.tsx` -> `should_redirect_authenticated_users_away_from_login` |

## Result Obtained

- Kept the Expo Router `Stack` mounted while `AuthGate` bootstraps session state
  and while auth redirects are scheduled.
- Replaced render-time `<Redirect>` branches with effect-driven
  `router.replace(...)`, so redirects run only after the navigation tree exists.
- Removed duplicate imperative `router.replace` calls from login/logout route
  handlers; session changes now drive redirects through `AuthGate`.
- Preserved the loading screen as a temporary overlay instead of replacing the
  navigation tree.

## Verification

- `npm test -- --runInBand tests/framework/auth/AuthGate.test.tsx` GREEN
  (6 tests).
- `npm run lint` GREEN.
- `npm run typecheck` GREEN.
- `npm run verify` GREEN: lint, typecheck, coverage; 71 suites / 382 tests.
  Existing React Native `Animated(View)` act warnings still appear in unrelated
  board/victory tests.

## Team Modifications Pending Human Review

- Validate on device that home buttons now navigate to Levels, Leaderboard,
  Progress, and Settings after login.
- Confirm the loading overlay appearance during the short session bootstrap is
  acceptable.

## Lessons / Limitations

- In Expo Router, auth guards must not remove the root `Stack` while issuing a
  redirect. Doing so can make otherwise valid routes look unavailable to React
  Navigation and produce unhandled `REPLACE` warnings.
- Local automated tests cover the regression path, but device validation is
  still required because the original failure appeared in the iOS runtime.
