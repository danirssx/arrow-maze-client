# AI Usage Log: MAZ-215 Home account polish contract

## Task / Problem

Prepare the executable contract for Linear ticket `MAZ-215`, which redesigns
the mobile Home account area and removes the unused coin badge. The ticket
touches `src/presentation`, so the repository requires a spec with Clean
Architecture contract and human approval of Gherkin scenarios before TDD.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked to work on `MAZ-215`, read both repository `AGENTS.md` files,
read `MEMORY.md` and `Linear_MCP_Guideline.md`, use a new worktree, register AI
usage, validate checks, update memory/AGENTS if needed, commit/push/PR, update
Linear, and review all affected tickets because this is a refactor/polish.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | Read and applied the rule that `src`-touching work needs a local spec with scope, behavior, Clean Architecture placement, and risks. | `specs/mobile-home-polish-MAZ-215.spec.md`, Linear issue `MAZ-215` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Read and applied the rule to distill stable `@s1..@s6` executable scenarios before TDD. | `specs/mobile-home-polish-MAZ-215.feature` |
| TDD Implementer (`.agents/tdd-implementer.md`) | Referenced | Read and applied the precondition that production code must wait for human-approved Gherkin scenarios. | No production changes |
| Judge (`.agents/judge.md`) | Referenced | Read and applied the Clean Architecture contract requirements expected by review. | `specs/mobile-home-polish-MAZ-215.spec.md` |
| Mutation Tester (`.agents/mutation.md`) | Not used | No production code changed, so mutation testing is not applicable yet. | N/A |

## Scenario Coverage (@s -> test)

Implementation not started. Planned coverage:

- @s1 -> pending HomeScreen authenticated account area test.
- @s2 -> pending HomeScreen logout press test.
- @s3 -> SettingsScreen logout availability test, likely extending existing coverage.
- @s4 -> pending HomeScreen unauthenticated/no account test.
- @s5 -> pending HomeScreen no coin badge/no visual coin reference test.
- @s6 -> pending import/responsibility inspection plus review evidence.

## Result Obtained

- Created `specs/mobile-home-polish-MAZ-215.spec.md`.
- Created `specs/mobile-home-polish-MAZ-215.feature`.
- Confirmed Linear `MAZ-215` is Backlog and scoped to `arrow-maze-client`.
- Reviewed affected client context: MAZ-193 truthful Home copy, current
  `HomeScreen`, `SettingsScreen`, `app/index.tsx`, and presentation tests.
- Confirmed backend changes are not needed for this ticket.

## Verification

- `git fetch origin develop` for both repos.
- Linear read-only GraphQL query for `MAZ-215`.
- Local source inspection with `rg` and `sed`.
- No `src`, `app`, or `tests` files were modified yet.
- `npm ci` (installed dependencies in the new worktree).
- `npm run verify` GREEN (82 suites / 459 tests). Existing React Native
  `act(...)` console warnings appeared in unrelated Settings/BoardView tests.

## Team Modifications Pending Human Review

- Approve or edit the `@s1..@s6` Gherkin scenarios before implementation.
- Decide whether the Home logout action should reuse existing text-only styling
  or become a stronger button-like presentation in the TDD implementation.

## Lessons / Limitations

- MAZ-215 is concrete, but it is still in Linear Backlog and has no approved
  local `.feature`; production work must wait for the human approval gate.
- The ticket is presentation-only. Coin economy, auth semantics, and backend
  behavior stay outside this slice.
