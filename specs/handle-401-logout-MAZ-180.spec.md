# Spec — Handle 401: clear session and redirect to login (Client / Mobile)

Date: 2026-06-29
Ticket: `MAZ-180`
Source: M9 audit — client-auth defect #5. Depends on MAZ-179 (AuthGate). Coordinates with MAZ-175 (refresh).
Status: approved (human gate). The `@s` scenarios in `specs/handle-401-logout-MAZ-180.feature` are the executable contract.
Base: `origin/develop` (has MAZ-179's `AuthGate`). MAZ-181's request interceptor is unmerged/stale; this slice is independent of it.

## Purpose

There is no 401 handling: `AxiosHttpClientAdapter` maps a 401 to `HttpError('UNAUTHORIZED')` which only
renders a generic error. Nothing clears the session or redirects, so an expired/invalid token leaves a
**stale session in storage** while authed calls silently fail and the user still "appears" logged in.
This slice makes a 401 on an authed request clear the session and route the user to `/login`.

## In scope / Out of scope

- In scope: a response interceptor in `AxiosHttpClientAdapter` driven by an injected `onUnauthorized`
  callback (fires only on a 401 whose request carried an `Authorization` header, and always re-rejects);
  a small session-invalidation Observer; wiring `createHttpClient` to notify it; the `AuthGate`
  reacting by clearing the session (→ its existing reactive redirect to `/login`).
- Out of scope: refresh-and-retry (MAZ-175 — when it ships, the interceptor can refresh before
  notifying); the login gate itself (MAZ-179, already in develop); the request interceptor / token
  attachment (MAZ-181).

## Behavior

- On a 401 response whose request had an `Authorization` header, the adapter calls `onUnauthorized()`,
  then re-rejects the error so callers still receive `HttpError('UNAUTHORIZED')`.
- A 401 **without** an `Authorization` header (login/register, public GET) does **not** trigger it; a
  non-401 error never triggers it (transient errors preserve the session).
- `onUnauthorized` is wired to `notifySessionInvalidated()`. The `AuthGate` (the session owner)
  subscribes and reacts via its existing `clearSession()` (clears storage + React state), which makes
  its existing `<Redirect href="/login" />` fire. No imperative navigation is used.

## Architecture placement (domain → application → presentation; inward-only deps)

- Infrastructure (`AxiosHttpClientAdapter`) gains an injected `onUnauthorized: () => void | Promise<void>`
  — it does **not** import the session/storage layer or navigation. The 401 detection lives in the adapter.
- Framework: `src/framework/auth/sessionInvalidation.ts` — a pure Observer channel (no imports).
  `createHttpClient` wires `onUnauthorized = notifySessionInvalidated`. The `AuthGate` subscribes and
  owns the clear+redirect.

## Clean Architecture contract

- [x] Regla de dependencia — infra depends on an injected callback + (via the wiring) a pure Observer module.
- [x] Independencia del dominio — domain untouched.
- [x] Application solo orquesta — no application change.
- [x] Repositorios — unchanged.
- [x] DTOs simples — unchanged.
- [x] Invariantes en VO/agregados — n/a; "401 → invalidate" is a transport/auth-lifecycle concern, owned by the AuthGate.
- [x] MVVM — the AuthGate (framework) owns the session lifecycle; no business rule added to views.

Layer impact:

- Domain: none.
- Application: none.
- Infrastructure: `http/AxiosHttpClientAdapter.ts` (response interceptor + `onUnauthorized` ctor param; replaces the dead `defaultHeaders` param).
- Framework: new `auth/sessionInvalidation.ts` (Observer); `config/httpClient.ts` (wire `onUnauthorized`); `auth/AuthGate.tsx` (subscribe → `clearSession`).

Forbidden moves (must stay unchecked):

- [ ] `src/infrastructure` importing `src/framework`/session/navigation — avoided via the injected callback.
- [ ] Imperative navigation that races the gate's React session state (redirect bounce) — avoided; the gate redirects reactively from session state.
- [ ] New entity/use-case without approval — only an Observer channel + an interceptor.

Required tests:

- Infrastructure: response interceptor fires `onUnauthorized` on authed 401 only; re-rejects.
- Framework: the Observer notifies/unsubscribes; the AuthGate clears + redirects on invalidation.

## Edge cases

- 401 with auth → logout. 401 without auth (login bad-credentials, public GET) → preserved. Non-401 →
  preserved. No `onUnauthorized` injected → adapter behaves as today (no interceptor). No AuthGate mounted
  (not a real app state; the gate is the root layout) → notification is a no-op.

## Acceptance criteria (Given/When/Then)

See `specs/handle-401-logout-MAZ-180.feature` `@s1..@s6`. Ticket ACs: authed 401 → session cleared +
routed to `/login` (@s1 + @s6); transient non-401 → session preserved (@s3).

## Decisions

- **Notify, don't navigate.** `onUnauthorized` emits a session-invalidation event; the AuthGate clears
  the session (storage + React state) and its existing reactive redirect sends the user to `/login`.
  Discarded: imperative `router.replace('/login')` from the adapter wiring — it races the gate's React
  session state (still non-null on the `/login` route) and bounces `/login → / → /login`.
- **Fire only on authed 401s** (request had an `Authorization` header): a login bad-credentials 401 or a
  public GET must not log the user out. Re-reject so callers still get `HttpError('UNAUTHORIZED')`.
- **Pure Observer module** (`sessionInvalidation.ts`, zero imports): keeps `httpClient` from importing the
  session/storage layer, so no extra Jest mock is needed and the dependency rule stays clean.
- **Replace the dead `defaultHeaders` ctor param with `onUnauthorized`** (mirrors MAZ-181's `tokenProvider`).
- **Base on develop**, not stacked on MAZ-181: develop has the AuthGate; the response interceptor is
  independent of MAZ-181's request interceptor.

## Risks / OPEN QUESTIONS

- MAZ-181 (unmerged) also extends the adapter constructor; the eventual merge combines the two optional
  params into `(baseURL, tokenProvider?, onUnauthorized?)` — a mechanical resolution.
- No refresh path yet (MAZ-175). Until then a 401 always forces re-login; acceptable per the audit.
