# Spec: Resolve progress sync on a permanent rejection (MAZ-190 — client)

## Problem

The backend `CompletedAt` validation (MAZ-176) rejected any future timestamp. When a
device clock was slightly ahead of the server, victory completions returned HTTP 422
and the client kept the progress `pendingSync: true` forever — every drain
(`ProgressFacade.sync`, MAZ-185) re-sent the same future timestamp and got the same
422, so the user stayed "pending sync" indefinitely.

The backend branch for MAZ-190 now tolerates a small clock-skew window, which fixes
the realistic case. This client change handles the remaining edge: a **permanent**
rejection (e.g. a genuinely broken device clock that is hours ahead, or any other
non-retryable 4xx) must not leave the user stuck on "pending" forever.

## Chosen policy (team decision)

In `ProgressFacade`, distinguish a **permanent rejection** (HTTP 422 `UNPROCESSABLE`
or 400 `BAD_REQUEST`) from a **retryable failure** (network / 5xx):

- On a permanent rejection of a completion write (`completeLevel`) or a drain
  (`sync`), resolve the pending state (`pendingSync: false`) and keep the level
  recorded locally, instead of looping forever. The completion stays visible to the
  player; the client simply stops retrying a payload the server will never accept.
- On a retryable failure, keep `pendingSync: true` and rethrow, so the existing drain
  triggers (foreground / reconnect, MAZ-185) retry it later.

Rejection is detected by duck-typing the thrown error's `code` field, the same way
`LeaderboardViewModel` already does for `NOT_FOUND` (MAZ-184) — the application layer
never imports the infrastructure `HttpError` type.

## Scope

- `src/application/facades/ProgressFacade.ts` — non-retryable classification +
  pending resolution in `completeLevel` and `sync`.
- `tests/application/facades/ProgressFacade.test.ts` — accepted-skew (delegated to
  backend) is unchanged; new tests cover permanent-rejection resolution and that
  retryable failures still retain pending.

## Out of scope

- Backend clock-skew tolerance (backend MAZ-190 branch).
- Re-stamping the client timestamp: the client cannot know the true server time, and
  the backend tolerance already absorbs realistic skew.
