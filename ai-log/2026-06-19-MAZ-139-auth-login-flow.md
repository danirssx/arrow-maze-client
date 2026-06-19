# AI Usage Log: MAZ-139 Wire mobile auth login flow (populate session)

## Task / Problem

Resolve `MAZ-139`: build the missing login flow so an `AuthSession` is populated in the app. The auth use cases (`LoginUseCase` saves the session), `HttpAuthRepository`, `SessionManager`, and the backend JWT endpoints already existed, but there was no login screen/route — so no session, which blocked the leaderboard write path (MAZ-138 no-ops without a session). Based on `develop`.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to do the full auth wiring directly and to be told what to run to test end-to-end, following both repos' `AGENTS.md`, `MEMORY.md`, `Linear_MCP_Guideline.md`, AI logging, validation, MEMORY/AGENTS updates, commit/push/PR, Linear.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Used | Created MAZ-139 from the discovered gap (use cases + repo + backend exist; no login UI) and confirmed the contract (`/auth/login` `{email, rawPassword}` → session; backend derives userId from the token). | MAZ-139 |
| Planner/Slicer | Used | Scoped to a composition + `AuthViewModel` + login/register screen + route + a backward-compatible Settings entry; backend untouched. | this log |
| TDD Implementer | Used | Wrote `AuthViewModel` tests (login success/failure, register-then-login, logout) then implemented to green. | `tests/presentation/view-models/AuthViewModel.test.ts` |
| Judge | Referenced | Pre-PR self-audit: full `npm run verify`; the new Settings prop is optional (existing tests unchanged); AuthViewModel stays pure. | `npm run verify` |
| Mutation Tester | Not used | StrykerJS is not configured. | N/A |

## Result Obtained

- **`AuthViewModel`** (presentation): `login`/`register`/`logout`/`loadSession` with `AuthUiState` (status + session + errorKey). Successful login persists the session via `LoginUseCase` (saved in `SessionManager`); failures surface a controlled i18n error key and save nothing.
- **Composition** `createAuthViewModel()` (framework): `HttpAuthRepository(createHttpClient())` + `SessionManager` → the four auth use cases → `AuthViewModel`.
- **`AuthScreen`** (presentation): login/register form (email/username/password, toggle, error) and, when signed in, the username + a logout action.
- **`app/login.tsx`** route + a backward-compatible **Settings → Account** entry (`onAccount` optional prop) navigating to `/login`. i18n keys added (en/es).
- Once logged in, `SessionManager` holds the token, so `SubmitScoreUseCase` (MAZ-138) and any authed request go live.

## Verification

- `npx jest tests/presentation/view-models/AuthViewModel.test.ts` → 4 passing.
- `npm run verify` (lint + typecheck + coverage) → **50 suites / 231 tests passing**.

## Team Modifications Pending Human Review

- **End-to-end requires the backend running + a registered user** (Postgres + migrations). README "Running the full stack locally" documents it.
- The real score submission also needs **MAZ-138** merged (it is stacked separately); auth + MAZ-138 together complete the loop.
- Token refresh / expiry handling and a proper auth gate are future work (out of scope here).

## Lessons / Limitations

Keeping `AuthViewModel` dependent only on the auth use cases made it unit-testable with a fake `IAuthRepository` + `ISessionManager` and kept AsyncStorage/HTTP out of the test path (they live only in the framework composition). Making the Settings entry an optional prop avoided touching the existing SettingsScreen tests.
