# Spec — Centralize Bearer token attachment via a request interceptor (Client / Mobile)

Date: 2026-06-28
Ticket: `MAZ-181`
Source: M9 audit — client-auth defect #6. Complements `MAZ-179`/`MAZ-180`.
Status: approved (human gate). The `@s` scenarios in `specs/http-auth-interceptor-MAZ-181.feature` are the executable contract.
Base: stacked on `fix/mobile-uuid-levelid-MAZ-183` (shares the leaderboard/progress facades + their tests; avoids merge conflicts).

## Purpose

`AxiosHttpClientAdapter` has no request interceptor; the Bearer header is hand-rolled at every authed
call site (`HttpProgressRepository.ts:13,25,31`, `HttpLeaderboardRepository.ts:22`) and the token is
threaded from screens (`app/game.tsx:85,101`, `app/progress.tsx:17` → `ProgressScreen` →
`ProgressViewModel.load` → `ProgressFacade.load`). This is fragile and easy to forget on new
endpoints. This slice adds a single request interceptor that attaches the session token automatically
and removes the per-call headers and the token-threading.

## In scope / Out of scope

- In scope: a request interceptor in `AxiosHttpClientAdapter` driven by an injected async token
  provider; wiring the provider in `createHttpClient` from `getCurrentSession()`; removing the
  `accessToken` parameter from the leaderboard/progress ports, repos, facades, `ProgressViewModel`,
  `ProgressScreen`, and the screens.
- Out of scope: 401 handling / auto-logout (`MAZ-180`); the mandatory-login gate (`MAZ-179`); secure
  token storage (`MAZ-182`, already merged); auth endpoints (login/register are unauthenticated).

## Behavior

- The interceptor attaches `Authorization: Bearer <token>` when the injected provider returns a
  non-empty token **and** the request has no explicit `Authorization` header. With no token, no header
  is added. An explicit `Authorization` already on the request is never overwritten.
- The token is attached to **every** request (global attach). The public `GET /leaderboard/:levelId`
  may carry the token once logged in; the backend route has no auth middleware and ignores it.
- Repositories and facades no longer receive or forward an `accessToken`.

## Architecture placement (domain → application → presentation; inward-only deps)

- Infrastructure (`AxiosHttpClientAdapter`) gains an injected `tokenProvider: () => Promise<string|null>`
  — it does **not** import `SessionManager`/framework. The interceptor lives inside the adapter.
- Framework (`createHttpClient`) is the composition root that supplies the provider from
  `getCurrentSession()`.
- Ports/facades/ViewModel/Screen drop the `accessToken` argument.

## Clean Architecture contract

- [x] Regla de dependencia — infrastructure depends on an injected function, not on framework.
- [x] Independencia del dominio — domain untouched.
- [x] Application solo orquesta — facades/ports just drop a parameter; no new rules.
- [x] Repositorios: interfaz adentro — ports updated in `application`, impls in `infrastructure`.
- [x] DTOs simples en fronteras — unchanged.
- [x] Invariantes en VO/agregados — n/a.
- [x] MVVM — `ProgressViewModel`/`ProgressScreen` only drop the token they were forwarding.

Layer impact:

- Domain: none.
- Application: `ports/ILeaderboardRepository.ts`, `ports/IRemoteProgressRepository.ts` (drop token); `facades/LeaderboardFacade.ts`, `facades/ProgressFacade.ts` (drop token).
- Infrastructure: `http/AxiosHttpClientAdapter.ts` (interceptor + tokenProvider, replaces dead `defaultHeaders` ctor param); `repositories/HttpLeaderboardRepository.ts`, `repositories/HttpProgressRepository.ts` (drop token + per-call header).
- Presentation (MVVM): `view-models/ProgressViewModel.ts`, `screens/ProgressScreen.tsx` (drop token).
- Framework (composition root): `config/httpClient.ts` (wire tokenProvider); `app/game.tsx`, `app/progress.tsx` (stop passing the token).

Forbidden moves (must stay unchecked):

- [ ] `src/infrastructure` importing `src/framework` (`SessionManager`) — avoided via the injected provider.
- [ ] New entity/use-case/pattern without approval — only a constructor param + an interceptor.

Required tests:

- Infrastructure: interceptor attaches/omits/preserves the token (`AxiosHttpClientAdapter`); repos post without a hand-rolled header.
- Application: facades delegate without a token.

## Edge cases

- No session (provider → null) → no header. Empty-string token → treated as no token. Explicit header present → preserved. Public GET → works with or without the token.

## Acceptance criteria (Given/When/Then)

See `specs/http-auth-interceptor-MAZ-181.feature` `@s1..@s7`. Ticket ACs: token auto-attached (no
per-call code) when a session exists (@s1, @s4, @s5); no header when no session (@s2).

## Decisions

- **Inject an async `tokenProvider` into the adapter** (not import `SessionManager`): keeps
  infrastructure free of framework deps (clean-arch). Async because `SessionManager.get()` reads
  storage. Discarded: importing the session singleton into infrastructure (dependency-rule violation).
- **Global attach** (token on every request, public GET included; backend ignores it on the public
  route): removes all per-call auth code, which is the AC's goal. Discarded: a `skipAuth` per-request
  flag for public GETs — more code for no functional gain.
- **Replace the dead `defaultHeaders` ctor param with `tokenProvider`**: `defaultHeaders` is passed
  nowhere in the codebase; the slot is repurposed.
- **Stack on `MAZ-183`**: both modify the leaderboard/progress facades + their tests; stacking avoids
  a 6-file merge conflict and composes cleanly (merge 183 → develop, then 181).

## Risks / OPEN QUESTIONS

- The base branch lacks `MAZ-182` (secure store); it is orthogonal (storage vs http) so no conflict is
  expected at integration. `getCurrentSession()` is used unchanged regardless of the storage adapter.
