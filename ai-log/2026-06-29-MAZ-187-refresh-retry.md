# AI Usage Log: MAZ-187 — Refresh access token on 401 (refresh-and-retry before logout)

## Task / Problem

MAZ-175 made access tokens short-lived (default 15m) with a rotating `POST /auth/refresh` endpoint, and
MAZ-180 hard-logs-out on any authed 401 — so without a client refresh-and-retry the user is bounced to
login every ~15 minutes. This slice makes an authed 401 transparently refresh the access token and retry
the request **once**, falling back to MAZ-180's logout only when the refresh itself fails; it also makes
logout revoke the refresh token server-side and persists the refresh token in the session.

## Tool and Model

Claude Opus 4.8 (1M context) via Claude Code CLI.

## Prompt Used

User asked to do MAZ-187 following the team workflow and to "do what you recommend" on the base. I chose
**Option A: stack on `feat/mobile-401-logout-MAZ-180` and decouple from MAZ-181** (the retry rewrites the
`Authorization` header itself). The `.feature` (@s1..@s8) + the 5 decisions were human-approved before TDD.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | Followed AGENTS §0.2; a read-only sub-agent mapped the client auth flow (adapter/401 handler, AuthSession/DTOs/mapper, HttpAuthRepository, SessionManager, use cases, composition root, contract test, eslint/stryker scope); distilled into the CA spec. | `specs/refresh-retry-MAZ-187.spec.md` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Authored 8 `@s` scenarios across the mapper, the use cases, and the interceptor; single human gate. | `specs/refresh-retry-MAZ-187.feature` |
| TDD Implementer (`.agents/tdd-implementer.md`) | Referenced | Red→Green inside-out: plumbing (AuthSession/DTOs/mapper/port/repo) → `RefreshSessionUseCase` → `LogoutUseCase` backend revoke → repo refresh/logout → adapter refresh-and-retry → framework wiring → contract test + fixture migration. | tests, code, this entry |
| Judge (`.agents/judge.md`) | Referenced | Self-review vs `docs/reglas_clean_arch.md`: `tryRefresh` is injected into the adapter (infra doesn't import session/use-cases); the use cases depend only on ports; refresh/logout carry no Authorization (no interceptor loop); `@s → test` complete. PASS. | this entry, spec CA block |
| Mutation Tester (`.agents/mutation.md`) | Referenced | Stryker scoped to the in-scope new files (`RefreshSessionUseCase`, `LogoutUseCase`). First 94.74% (one survivor on the `&& session.refreshToken` guard); added the empty-refresh-token logout test → **100%**. | `reports/mutation/index.html` |

## Scenario Coverage (@s ↔ test)

| Scenario | Test |
|----------|------|
| @s1 — persisted session carries the refresh token | `tests/contract/auth.contract.test.ts` (toSession maps refreshToken); `HttpAuthRepository.test` (`should_map_access_and_refresh_tokens_to_session`) |
| @s2 — refresh rotates session + returns new access | `RefreshSessionUseCase.test`: `should_rotate_the_session_and_return_the_new_access_token` |
| @s3 — refresh no-op without a refresh token | `RefreshSessionUseCase.test`: `…when_there_is_no_session` / `…when_the_session_has_no_refresh_token` |
| @s4 — refresh returns null on backend failure, session unchanged | `RefreshSessionUseCase.test`: `…when_the_refresh_fails` |
| @s5 — 401 refreshes + retries once with the new token | `AxiosHttpClientAdapter.test`: `should_refresh_and_retry_once_with_the_new_token_on_an_authed_401` |
| @s6 — refresh→null falls back to invalidation | `AxiosHttpClientAdapter.test`: `should_invalidate_the_session_when_the_refresh_yields_null` |
| @s7 — retried request does not refresh again (no loop) | `AxiosHttpClientAdapter.test`: `should_not_refresh_again_for_an_already_retried_request` |
| @s8 — logout revokes server-side then clears | `LogoutUseCase.test` (revoke + clear; clear even when backend fails; no refresh token → just clear); `HttpAuthRepository.test` (logout posts the token) |

## Result Obtained

- **Application boundary:** `AuthSession.refreshToken`; `IAuthRepository.refresh/logout` + `RefreshTokens` type.
- **Application:** `RefreshSessionUseCase` (rotate session, return new access token or null); `LogoutUseCase` now best-effort revokes via the backend then clears.
- **Infrastructure:** `HttpAuthRepository.refresh/logout` (no Authorization header); `AuthDtos` (`refreshToken` on login + `RefreshResponseDto`); `AuthMapper` (refreshToken + `toRefreshTokens`); `AxiosHttpClientAdapter` gains an injected `tryRefresh` + a one-retry refresh-and-retry (guarded by a config flag).
- **Framework:** `createHttpClient` wires `tryRefresh` from a `RefreshSessionUseCase` over a **bare** adapter (no interceptors → no recursion); `auth.ts` passes the auth repo to `LogoutUseCase`. Global AsyncStorage Jest mock added (the http client now imports the session layer).

## Verification

- `npm run verify` — lint 0, typecheck 0, **68 suites / 364 tests**.
- Scoped Stryker on the in-scope new files: **100%** (`RefreshSessionUseCase` + `LogoutUseCase`). The adapter retry, repo, mapper, and composition are infra/framework — outside the default Stryker scope (line-covered by the adapter/repo/contract tests).

## Team Modifications Pending Human Review

1. **Base = stacked on MAZ-180; decoupled from MAZ-181.** The retry rewrites the `Authorization` header itself, so 187 doesn't need 181's request interceptor. Adapter ctor is now `(baseURL, onUnauthorized?, tryRefresh?)`; the eventual 180/181/187 merge combines the optional params. **Merge order: MAZ-180 → develop, then MAZ-187.**
2. **Client built against the MAZ-175 contract** (backend not yet merged). A contract test pins the refresh DTO; real end-to-end needs MAZ-175 deployed. Until then the client degrades gracefully (refresh → null → MAZ-180 logout).
3. **`AuthSession.refreshToken` is required**; legacy persisted sessions without it are handled at runtime (`!session.refreshToken` → no refresh / just clear).

## Lessons / Limitations

- A **bare** http client for the refresh call (plus the `_retry` config flag) is what prevents refresh recursion and retry loops; the refresh/logout requests also carry no `Authorization`, so the `hadAuthorization` guard already keeps them out of the 401 path.
- Stacking on an unmerged branch (MAZ-180) lacks the MAZ-181 global AsyncStorage mock; since `createHttpClient` now imports the session layer, the global mock had to be re-added here.
