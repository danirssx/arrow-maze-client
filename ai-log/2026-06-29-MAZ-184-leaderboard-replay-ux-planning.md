# AI Usage Log: MAZ-184 Leaderboard empty state and replay submit UX planning

## Task / Problem

Client ticket `MAZ-184`: prepare the executable contract for mapping empty
leaderboards to an empty UI state and surfacing victory leaderboard submit
outcomes instead of swallowing failures.

## Tool and Model

Codex CLI / GPT-5.

## Prompt Used

User asked to work on MAZ-184 following both repo `AGENTS.md` files, the root
`MEMORY.md`, `Linear_MCP_Guideline.md`, a fresh worktree, AI usage logging,
checks, commit/push/PR, Linear update, and review of affected tickets. Linear
was read through the local GraphQL script without exposing secrets.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | Read and applied the role constraints to distill the Linear issue and code context into a local spec. No separate agent session was run. | `specs/leaderboard-replay-ux-MAZ-184.spec.md` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Read and applied the Gherkin/planning rules to create tagged executable scenarios. No separate planner session was run. | `specs/leaderboard-replay-ux-MAZ-184.feature` |
| TDD Implementer (`.agents/tdd-implementer.md`) | Not used | MAZ-184 is still in Linear Backlog and the executable contract has not been human-approved, so TDD is intentionally blocked. | N/A |
| Judge (`.agents/judge.md`) | Not used | No PR/code judge review was run for this planning-only change. | N/A |
| Mutation Tester (`.agents/mutation.md`) | Not used | No production code changed. | N/A |

## Scenario Coverage (@s -> test)

Not applicable yet. This is a planning/contract-only commit. The future
implementation must map:

| Scenario | Future concrete test target |
| --- | --- |
| `@s1` | `LeaderboardViewModel` + `LeaderboardScreen` empty-state tests |
| `@s2` | `LeaderboardViewModel` + `LeaderboardScreen` error-state tests |
| `@s3` | Existing non-UUID no-request ViewModel behavior |
| `@s4` | Victory submit success UI test |
| `@s5` | Victory submit failure UI test |
| `@s6` | Victory side-effect orchestration test |
| `@s7` | Non-UUID submit skipped-state test |

## Result Obtained

- Created `specs/leaderboard-replay-ux-MAZ-184.spec.md`.
- Created `specs/leaderboard-replay-ux-MAZ-184.feature` with `@s1..@s7`.
- Identified implementation blockers and affected tickets:
  - `MAZ-172`: replay submit depends on backend best-score upsert behavior.
  - `MAZ-173`: empty leaderboard backend read contract is not implemented yet.
  - `MAZ-179`: auth gate is already present on the current client base.
  - `MAZ-180`: global 401 handling remains out of scope.
  - `MAZ-183`: UUID level id guarantee remains the owner of slug fallback fixes.

## Verification

- Planning-only change; no `src`, `app`, or `tests` files were modified.
- `npm ci` was run in the new worktree because the sibling checkout's
  `node_modules` did not include the MAZ-182 `expo-secure-store` dependency.
- `npm run verify` GREEN (lint, typecheck, coverage; 63 suites / 327 tests).
  Existing React Native `Animated(View)` act warnings still appear in unrelated
  UI coverage tests.

## Team Modifications Pending Human Review

- Approve or amend the executable scenarios `@s1..@s7`.
- Choose where the UI-safe `NOT_FOUND` classification should live before TDD:
  application facade/result shape or infrastructure adapter mapping.
- Decide whether victory submit failure needs a retry button or only visible
  warning copy in this slice.

## Lessons / Limitations

- The current backend success response cannot distinguish "new best" from
  "already recorded"; the spec intentionally requires generic success copy.
- MAZ-184 should not hide real submit failures, but it also should not couple
  presentation directly to concrete HTTP/adapter errors.
