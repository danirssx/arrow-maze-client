# Spec — Refresh access token on 401 (refresh-and-retry before logout) (Client / Mobile)

Date: 2026-06-29
Ticket: `MAZ-187`
Source: follow-up to MAZ-175 (backend refresh endpoints). Extends MAZ-180 (401 → logout).
Status: approved pending human gate. The `@s` scenarios in `specs/refresh-retry-MAZ-187.feature` are the contract.
Base: stacked on `feat/mobile-401-logout-MAZ-180` (the 401 handler this extends). Decoupled from MAZ-181 (the retry attaches the new token explicitly). Merge order: 180 → develop, then 187.

## Purpose

MAZ-175 made access tokens short-lived (default 15m) with a `POST /auth/refresh` rotating-refresh-token
endpoint. MAZ-180 currently **hard-logs-out** on any authed 401. Without a client refresh-and-retry, the
user is bounced to login every ~15 minutes. This slice makes an authed 401 transparently refresh the
access token and retry the original request **once**, falling back to MAZ-180's logout only when the
refresh itself fails. It also makes logout revoke the refresh token server-side.

## In scope / Out of scope

- In scope: `refreshToken` on `AuthSession` + `LoginResponseDto` + `AuthMapper`; `refresh`/`logout` on
  `IAuthRepository` + `HttpAuthRepository`; a `RefreshSessionUseCase`; extend `LogoutUseCase` to call the
  backend; extend the MAZ-180 response interceptor with an injected `tryRefresh` (refresh + retry once,
  else invalidate); wire it in the framework composition root with a **bare** http client to avoid
  recursion; contract test for the refresh DTO.
- Out of scope: backend changes (MAZ-175); the MAZ-181 request interceptor (the retry attaches the new
  token itself); cookie transport.

## Behavior

- **Login** persists the whole session, which now includes `refreshToken` (JSON-blobbed by `SessionManager`).
- **Refresh** (`RefreshSessionUseCase`): read the stored session; if it has no refresh token → return
  `null`. Else call `IAuthRepository.refresh(refreshToken)` → `{ accessToken, refreshToken }` (rotated),
  save the merged session, return the new access token. On any failure → return `null`, session unchanged.
- **401 interceptor** (`AxiosHttpClientAdapter`): on a 401 for a request that carried an `Authorization`
  header and is **not already a retry**, call `tryRefresh()`; if it yields a non-empty token, retry the
  original request **once** with the `Authorization` header rewritten to the new token; otherwise (no
  `tryRefresh`, refresh returned null, or already retried) call `onUnauthorized()` (MAZ-180's
  `notifySessionInvalidated`) and re-reject.
- **Logout** (`LogoutUseCase`): best-effort `POST /auth/logout` with the stored refresh token, then clear
  the local session (clearing always happens even if the backend call fails).

## Architecture placement / Clean Architecture contract

- Application (mutation-scoped): `RefreshSessionUseCase` + `LogoutUseCase` depend only on the
  `IAuthRepository` + `ISessionManager` **ports** (no infra/framework imports). `IAuthRepository` gains
  `refresh`/`logout`.
- Infrastructure: `HttpAuthRepository.refresh/logout` (relative URLs, **no** Authorization header → the
  interceptor's `hadAuthorization` guard won't loop on them); `AuthMapper`/`AuthDtos` gain `refreshToken`;
  `AxiosHttpClientAdapter` gains an injected `tryRefresh` + the retry logic.
- Framework: `createHttpClient` wires `tryRefresh` from a `RefreshSessionUseCase` over a **bare**
  `AxiosHttpClientAdapter` (no interceptors) so the refresh call can't recurse; `auth.ts` wires the new
  `LogoutUseCase` dependency.

Checks:
- [x] Dependency rule — `tryRefresh` is injected into infra; the adapter does not import session/use-cases.
- [x] Application only orchestrates ports (no framework/infra imports).
- [x] DTOs simple records; `AuthSession` stays a flat record.
- [x] No new domain entity; `RefreshSessionUseCase` + repo methods are gate-approved (AGENTS §2/§8).

Layer impact:
- Application: `auth/RefreshSessionUseCase.ts` (new); `auth/LogoutUseCase.ts` (backend call); `ports/IAuthRepository.ts` (refresh/logout + `RefreshTokens` type).
- Infrastructure: `repositories/HttpAuthRepository.ts`; `mappers/auth/AuthDtos.ts` + `AuthMapper.ts`; `http/AxiosHttpClientAdapter.ts` (tryRefresh + retry).
- Application boundary: `auth/AuthSession.ts` (`refreshToken`).
- Framework: `config/httpClient.ts` (wire tryRefresh + bare client); `config/auth.ts` (LogoutUseCase dep).

## Edge cases

- No session / no refresh token → refresh no-ops (null). Refresh backend rejects → null, no retry, invalidate. Retry also 401s → no second refresh (`_retried` flag), invalidate. Anonymous 401 (login/public GET) → untouched (no Authorization). Logout with no refresh token → just clears locally. Backend logout fails → local clear still happens.

## Acceptance criteria (Given/When/Then)

See `specs/refresh-retry-MAZ-187.feature` `@s1..@s8`.

## Decisions

- **Stack on MAZ-180; decouple from MAZ-181.** The retry rewrites `error.config.headers.Authorization`
  with the new token itself, so it does not need 181's request interceptor. Adapter ctor
  `(baseURL, onUnauthorized?, tryRefresh?)`; the eventual 180/181/187 merge combines the optional params.
- **Bare http client for the refresh call** (no interceptors) + a `_retried` flag on the config → one
  retry max, no refresh-recursion. (The refresh request also carries no `Authorization`, so the
  `hadAuthorization` guard already prevents looping; the bare client is belt-and-suspenders.)
- **Best-effort backend logout** — never block local logout on a network/refresh-revoke failure.
- **Client built against the MAZ-175 contract** (not merged); a contract test pins the refresh DTO shape;
  real end-to-end needs MAZ-175 merged + the backend running.

## Risks / OPEN QUESTIONS

- `createHttpClient` now imports `createSessionManager` (for `tryRefresh`), pulling the storage layer into
  any test that builds the real client. If a composition test breaks on unmocked AsyncStorage, add the
  global mock to `jest.setup.ts` (as MAZ-181 did) — MAZ-181 is not on this branch.
- MAZ-175 backend must be deployed for refresh to actually work; until then the client gracefully falls
  back to MAZ-180 logout (refresh returns null).
