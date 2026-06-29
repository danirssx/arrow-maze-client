# AI Usage Log: MAZ-181 — Centralize Bearer token attachment via an HTTP interceptor

## Task / Problem

`AxiosHttpClientAdapter` had no request interceptor; the Bearer header was hand-rolled at every authed
call site (`HttpProgressRepository`, `HttpLeaderboardRepository`) and the token was threaded from
screens (`app/game.tsx`, `app/progress.tsx` → `ProgressScreen` → `ProgressViewModel.load` →
`ProgressFacade.load`). Fragile and easy to forget on new endpoints. This slice adds a single request
interceptor that attaches the session token automatically and removes the per-call headers and the
token-threading.

## Tool and Model

Claude Opus 4.8 (1M context) via Claude Code CLI.

## Prompt Used

User requested starting MAZ-181 following the team workflow (review both AGENTS.md, new worktree,
root MEMORY.md + Linear_MCP_Guideline.md, register AI usage, run all checks, update MEMORY/AGENTS,
commit/push/PR/Linear). The `.feature` (@s1..@s7) and the 4 decisions (inject an async token provider;
global attach; full threading removal; stack on MAZ-183) were human-approved before TDD.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | Followed AGENTS §0.2; read the HTTP/token wiring end-to-end and distilled the CA spec. | `specs/http-auth-interceptor-MAZ-181.spec.md` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Authored 7 `@s` scenarios (interceptor attach/omit/preserve, repos drop hand-rolled header, facades delegate without a token); single human gate. | `specs/http-auth-interceptor-MAZ-181.feature` |
| TDD Implementer (`.agents/tdd-implementer.md`) | Referenced | Red→Green→Refactor in 4 batches: interceptor → repos → ports+facades → presentation/screens. | tests, src, this entry |
| Judge (`.agents/judge.md`) | Referenced | Self-review vs `docs/reglas_clean_arch.md`: infrastructure depends on an injected provider (not `SessionManager`); facades/ports only drop a parameter; domain untouched; `@s → test` complete. Verdict: PASS. | this entry, spec CA block |
| Mutation Tester (`.agents/mutation.md`) | Referenced | Stryker scoped to the changed files. Killed the interceptor's empty-string + baseURL survivors. Application gate (the two changed facades): 95.12% (LeaderboardFacade 100%). | `reports/mutation/index.html` |

## Scenario Coverage (@s ↔ test)

| Scenario | Test | File |
|----------|------|------|
| @s1 — attach Bearer when token exists | `should_attach_bearer_token_when_session_token_exists` | `tests/infrastructure/http/AxiosHttpClientAdapter.test.ts` |
| @s2 — no header when no token | `should_not_attach_authorization_when_there_is_no_token` (+ empty-string case) | `…/AxiosHttpClientAdapter.test.ts` |
| @s3 — never override explicit Authorization | `should_not_override_an_explicit_authorization_header` | `…/AxiosHttpClientAdapter.test.ts` |
| @s4 — leaderboard repo no hand-rolled header | `should_submit_score_without_a_hand_rolled_authorization_header` | `tests/infrastructure/repositories/HttpLeaderboardRepository.test.ts` |
| @s5 — progress repo no hand-rolled header | `should_post_completed_level_without_a_hand_rolled_authorization_header` | `tests/infrastructure/repositories/HttpProgressRepository.test.ts` |
| @s6 — leaderboard facade delegates without a token | `should_delegate_submit_score_to_repository_with_only_the_input_when_level_id_is_a_uuid` | `tests/application/facades/LeaderboardFacade.test.ts` |
| @s7 — progress facade completes without a token | `should_complete_level_remotely_and_cache_latest_progress` | `tests/application/facades/ProgressFacade.test.ts` |

## Result Obtained

**Infrastructure:**
- `AxiosHttpClientAdapter` — new `AuthTokenProvider` type + an async request interceptor that attaches `Authorization: Bearer <token>` when the injected provider returns a non-empty token and the request has no explicit Authorization. Replaced the dead `defaultHeaders` ctor param with `tokenProvider`.
- `HttpLeaderboardRepository.submitScore(input)` and `HttpProgressRepository.fetchRemote/completeLevel/sync` — dropped the `accessToken` param + the hand-rolled header.

**Framework:** `createHttpClient` wires the provider from `getCurrentSession()`.

**Application:** `ILeaderboardRepository`, `IRemoteProgressRepository`, `LeaderboardFacade`, `ProgressFacade` — dropped the `accessToken` parameter (MAZ-183's UUID guards preserved).

**Presentation:** `ProgressViewModel.load(userId)`, `ProgressScreen` (dropped `accessToken` prop), `app/progress.tsx`, `app/game.tsx` — stopped threading the token.

**Test infra:** added a global AsyncStorage mock to `jest.setup.ts` (the http client now transitively imports the session/storage layer; the native binding is null in Jest). The local mock in `AsyncStorageAdapter.test.ts` still wins for that file.

## Verification

- `npm run verify` — lint 0, typecheck 0, **60 suites / 311 tests** passing.
- Scoped Stryker: the interceptor's new logic is fully killed; the **application gate (changed facades) = 95.12%** (LeaderboardFacade 100%, ProgressFacade 94.44%).
  - Remaining survivors are **pre-existing and outside the default Stryker `mutate` scope** (domain+application only): `ProgressFacade.ts:67/76` (`pendingSync` overwritten downstream — equivalent, inherited from MAZ-183), and in infrastructure (outside the gate) the adapter's untouched `put`/`delete`/`toAxiosConfig`/`mapError` paths and `HttpProgressRepository.fetchRemote/sync` (never had request-shape tests). None are in this ticket's new logic.

## Team Modifications Pending Human Review

1. **Global attach:** the interceptor adds the token to every request, including the public `GET /leaderboard/:levelId`. That route has no backend auth middleware and ignores the header; this removes all per-call auth code (the AC's goal). If strict no-token on public GETs is wanted, add a per-request `skipAuth` opt-out later.
2. **Base branch:** stacked on `fix/mobile-uuid-levelid-MAZ-183` (shared facades/tests). Merge order: 183 → develop, then 181. The base lacks MAZ-182 (secure store), which is orthogonal (storage vs http) — no conflict expected at integration.

## Lessons / Limitations

- Infrastructure must not import framework (`SessionManager`); injecting an async `tokenProvider` keeps the dependency rule intact while letting the interceptor read the live session.
- Wiring `httpClient → getCurrentSession` pulls the AsyncStorage native module into any test importing the http client; a global Jest mock for AsyncStorage is the correct fix (standard RN practice) and future-proofs MAZ-179/180.
- Stryker's anchor/boolean mutations on the token guard (`token !== ''`) are real — added an empty-string interceptor test to kill them.
