# AI Usage Log: MAZ-159 Client progress merge domain policy

## Task / Problem

Implement Linear ticket `MAZ-159` / `CA-006`: move the completed-level
merge/best-score rule out of `ProgressFacade` and into the client domain layer.
The rule must stay equivalent to backend progress behavior: higher score wins;
if scores tie, faster `timeSeconds` wins; exact ties do not replace the existing
completion.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked to implement `MAZ-159` in a new worktree, following both repos'
`AGENTS.md`, `MEMORY.md`, `Linear_MCP_Guideline.md`, Clean Architecture rules,
AI usage logging, checks, commit, push, PR, and Linear updates. Local guidelines
read: client/backend `AGENTS.md`, `MEMORY.md`, `Linear_MCP_Guideline.md`,
client `docs/tdd.md`, `docs/architecture.md`, `docs/design-patterns.md`,
`docs/reglas_clean_arch.md`, and the configured agent prompts.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | Used its specification checklist to turn the approved Linear issue into a focused spec without expanding scope. | `specs/maz-159-progress-merge-policy.spec.md`, Linear `MAZ-159` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Used its Gherkin contract rules to materialize the approved Linear criteria as stable `@s` scenarios. | `specs/maz-159-progress-merge-policy.feature` |
| TDD Implementer (`.agents/tdd-implementer.md`) | Used | Followed Red-Green-Refactor cycles for domain and application tests, keeping production limited to the failing scenarios. | `tests/domain/progress/ProgressMergePolicy.test.ts`, `tests/application/facades/ProgressFacade.test.ts` |
| Judge (`.agents/judge.md`) | Referenced | Applied its Clean Architecture checklist and ran manual import/search checks. Pre-existing presentation violations were noted as separate future tickets, not changed here. | `npm run verify`, manual `rg` checks |
| Mutation Tester (`.agents/mutation.md`) | Used | Ran scoped Stryker mutation testing for touched domain/application files and recorded the result. | `ai-log/2026-06-21-MAZ-159-mutation.md` |

## Scenario Coverage (@s ↔ test)

- @s1 → `should_preserve_existing_completion_when_new_completion_has_worse_score`
- @s2 → `should_replace_existing_completion_when_scores_tie_and_new_completion_is_faster`
- @s3 → `should_keep_existing_best_completion_when_saving_pending_local_completion`
- @s4 → `should_replace_existing_completion_when_new_completion_has_better_score_even_if_slower`, `should_preserve_existing_completion_when_scores_tie_and_new_completion_is_slower`, `should_preserve_existing_completion_when_score_and_time_are_equal`

## TDD Cycles

- Red: `ProgressMergePolicy` import failed because `@/domain/progress` did not exist.
  Green: added pure domain `CompletedLevel`, `ProgressMergePolicy`, and index export.
- Red: equal score with slower incoming time replaced the existing completion.
  Green: completed-level comparison now breaks ties by lower `timeSeconds`.
- Red: equal score and equal time replaced the existing completion, diverging from backend behavior.
  Green: `ProgressMergePolicy` now replaces only when the incoming completion is strictly better.
- Refactor/coverage: added application tests for local pending saves and sync inputs, plus domain tests for appending different levels and preserving unrelated completions.

## Result Obtained

- Added `src/domain/progress/CompletedLevel.ts`.
- Added `src/domain/progress/ProgressMergePolicy.ts`.
- Added `src/domain/progress/index.ts`.
- Updated `src/application/facades/ProgressFacade.ts` so it delegates completion merge to the domain policy.
- Added `tests/domain/progress/ProgressMergePolicy.test.ts`.
- Expanded `tests/application/facades/ProgressFacade.test.ts`.
- Added executable ticket contract under `specs/maz-159-progress-merge-policy.*`.

## Verification

- `npm test -- --runInBand tests/domain/progress/ProgressMergePolicy.test.ts`
- `npm test -- --runInBand tests/domain/progress/ProgressMergePolicy.test.ts tests/application/facades/ProgressFacade.test.ts`
- `npm run verify` → PASS, 55 suites / 275 tests.
- `npm run mutation -- --mutate "src/domain/progress/CompletedLevel.ts,src/domain/progress/ProgressMergePolicy.ts,src/application/facades/ProgressFacade.ts"` → PASS, 95.59% mutation score.

## Team Modifications Pending Human Review

- Review whether the client should later validate progress completion primitives with dedicated value objects. This ticket kept DTOs flat and moved only the merge rule.
- Manual Clean Architecture checks still report known pre-existing future-ticket violations in presentation (`LevelSelectViewModel`, `SettingsScreen`, `GameViewModel`), matching CA-007/CA-009/CA-011 and intentionally not fixed here.

## Lessons / Limitations

- The first mutation run exposed a subtle backend/client divergence for exact score/time ties. Adding that scenario aligned client behavior with backend `LevelScore.isBetterThan`.
- One surviving domain mutant is equivalent: changing `>` to `>=` inside the branch guarded by `score !==` does not alter behavior.
