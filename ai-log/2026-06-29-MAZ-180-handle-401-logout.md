# AI Usage Log: MAZ-180 — Handle 401: clear session and redirect to login

## Task / Problem

There was no 401 handling: `AxiosHttpClientAdapter` mapped a 401 to `HttpError('UNAUTHORIZED')` (a generic
error) and nothing cleared the session or redirected. An expired/invalid token left a stale session in
storage while authed calls silently failed and the user still "appeared" logged in. This slice makes a
401 on an authed request clear the session and route the user to `/login`.

## Tool and Model

Claude Opus 4.8 (1M context) via Claude Code CLI.

## Prompt Used

User requested starting MAZ-180 following the team workflow (review both AGENTS.md, new worktree,
root MEMORY.md + Linear_MCP_Guideline.md, register AI usage, run all checks, update MEMORY/AGENTS,
commit/push/PR/Linear). The `.feature` (@s1..@s6) and the 4 decisions (notify-don't-navigate via an
Observer + the AuthGate; fire only on authed 401s and re-reject; pure Observer module; base on develop)
were human-approved before TDD.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | Followed AGENTS §0.2; read the AuthGate (MAZ-179) + adapter + session wiring and distilled the CA spec. | `specs/handle-401-logout-MAZ-180.spec.md` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Authored 6 `@s` scenarios (interceptor fires/ignores/re-rejects, Observer notify/unsubscribe, AuthGate clear+redirect); single human gate. | `specs/handle-401-logout-MAZ-180.feature` |
| TDD Implementer (`.agents/tdd-implementer.md`) | Referenced | Red→Green→Refactor in batches: Observer → adapter response interceptor → httpClient wiring + AuthGate subscription. | tests, src, this entry |
| Judge (`.agents/judge.md`) | Referenced | Self-review vs `docs/reglas_clean_arch.md`: infra depends on an injected callback (not session/navigation); the AuthGate owns the session lifecycle; no imperative nav (no redirect bounce); domain/application untouched; `@s → test` complete. Verdict: PASS. | this entry, spec CA block |
| Mutation Tester (`.agents/mutation.md`) | Referenced | Stryker scoped to the new logic. Killed all 5 new-logic survivors in the adapter (success pass-through, optional-chain network path, undefined-headers guard, lowercase `authorization` branch). `sessionInvalidation.ts` 100%. | `reports/mutation/index.html` |

## Scenario Coverage (@s ↔ test)

| Scenario | Test | File |
|----------|------|------|
| @s1 — authed 401 → onUnauthorized fired | `should_call_onUnauthorized_and_rethrow_when_an_authed_request_returns_401` | `tests/infrastructure/http/AxiosHttpClientAdapter.test.ts` |
| @s2 — 401 without Authorization → not fired | `should_not_call_onUnauthorized_when_the_request_had_no_authorization_header` | `…/AxiosHttpClientAdapter.test.ts` |
| @s3 — non-401 → not fired | `should_not_call_onUnauthorized_on_a_non_401_error` | `…/AxiosHttpClientAdapter.test.ts` |
| @s4 — interceptor re-rejects | `…rejects.toBe(error)` assertion in every interceptor test | `…/AxiosHttpClientAdapter.test.ts` |
| @s5 — Observer notify/unsubscribe | `should_call_subscribed_listener_when_notified` (+ unsubscribe / all-subscribers / no-subscribers) | `tests/framework/auth/sessionInvalidation.test.ts` |
| @s6 — AuthGate clears + redirects on invalidation | `should_clear_session_and_redirect_to_login_when_session_is_invalidated` | `tests/framework/auth/AuthGate.test.tsx` |

## Result Obtained

- **New** `src/framework/auth/sessionInvalidation.ts` — a pure, dependency-free Observer channel (`onSessionInvalidated`/`notifySessionInvalidated`).
- `src/infrastructure/http/AxiosHttpClientAdapter.ts` — new `UnauthorizedHandler` type + a response interceptor that, on a 401 whose request carried an `Authorization` header (capital or lowercase), calls `onUnauthorized` then re-rejects; anonymous 401s and non-401s are ignored. Replaced the dead `defaultHeaders` ctor param with `onUnauthorized`.
- `src/framework/config/httpClient.ts` — wires `onUnauthorized = notifySessionInvalidated`.
- `src/framework/auth/AuthGate.tsx` — subscribes to `onSessionInvalidated` and reacts via its existing `clearSession()` (clears storage + React state), which makes its existing `<Redirect href="/login" />` fire reactively. No imperative navigation.

## Verification

- `npm run verify` — lint 0, typecheck 0, **66 suites / 349 tests** passing.
- Scoped Stryker on the new logic: `sessionInvalidation.ts` **100%**; the adapter's new interceptor + `hadAuthorization` are fully killed (5 edge-case mutants killed: success pass-through, `error.response?` optional chain, undefined-headers guard, lowercase `authorization`).
  - The adapter's overall file score is dragged by **pre-existing** `put`/`delete`/`toAxiosConfig`/`mapError` gaps that this ticket did not touch; all of these framework/infra files are **outside the default Stryker `mutate` scope** (domain+application).

## Team Modifications Pending Human Review

1. **Notify-don't-navigate:** the 401 handler emits a session-invalidation event; the AuthGate (the session owner) clears + redirects. This avoids the redirect bounce that an imperative `router.replace('/login')` would cause (the gate's React session state stays non-null on the `/login` route → `/login → / → /login`).
2. **Base = develop** (not stacked on MAZ-181). MAZ-181 (unmerged) also extends the adapter constructor; the eventual merge combines the two optional params into `(baseURL, tokenProvider?, onUnauthorized?)` — mechanical.
3. **No refresh yet** (MAZ-175 deferred): a 401 always forces re-login. When MAZ-175 ships, the interceptor can refresh-and-retry before notifying.

## Lessons / Limitations

- Infrastructure must not import the session/storage layer or navigation; an injected callback + a pure Observer keeps the dependency rule intact and lets the AuthGate own the clear+redirect.
- Reacting through the gate's React session state (not imperative nav) is what prevents the redirect bounce — the gate only redirects to `/login` when its in-memory `session` is null.
- Stryker surfaced real edge cases on the `hadAuthorization`/optional-chain logic (lowercase header, undefined headers, missing `response`); added targeted tests to kill them.
