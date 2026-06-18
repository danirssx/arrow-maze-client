# AI Usage Log: AM-027 Manual Levels and Difficulty Progression

## Task / Problem

Resolve MAZ-98 / AM-027 by adding 15 manual, builder-compatible mobile levels with version metadata, expected optimal moves, start/exit definitions, time limits where applicable, and progressive difficulty.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to implement MAZ-98 while reviewing both repository `AGENTS.md` files, `MEMORY.md`, `Linear_MCP_Guideline.md`, previous ticket state, AI usage logging, validation, memory/agent updates, commit, push, PR, and Linear update rules.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Linear already contained the approved scope, out-of-scope boundaries, layer, patterns, dependencies, and acceptance criteria. No new spec interview was needed. | MAZ-98 description |
| Planner/Slicer | Referenced | Linear already contained the AM-027 slice and dependency on AM-025; no new ticket slicing was performed. | MAZ-98, MEMORY dependency check |
| TDD Implementer | Used | Wrote fixture validation tests first, then implemented the manual levels and reran targeted plus full verification. | `tests/application/levels/ManualLevels.test.ts`, `npm test -- --runInBand tests/application/levels/ManualLevels.test.ts`, `npm run verify` |
| Judge | Referenced | Performed a pre-PR self-audit against application-layer boundaries, approved Builder-compatible data, tests, conventional commit, and AI log presence. | `src/application/level-build/fixtures`, this log |
| Mutation Tester | Not used | Mutation testing is not configured yet; no Stryker run was performed. | N/A |

## Result Obtained

Added manual level fixtures in `src/application/level-build/fixtures`:

- 15 ordered level fixtures.
- `version`, `expectedOptimalMoves`, and `LevelDefinition` metadata per level.
- Easy, Medium, and Hard difficulty groups.
- Timed levels for later medium/hard progression.
- Directed arrow paths ending in exactly one exit, with wall cells for obstacle complexity.
- `manualLevels` and `manualLevelDefinitions` exports.

Added application tests to validate count, unique IDs, order, builder construction, start/exit presence, time-limit consistency, expected optimal moves, and monotonic progression score.

## Verification

- `npm test -- --runInBand tests/application/levels/ManualLevels.test.ts`
- `npm run typecheck`
- `npm run verify`

## Team Modifications Pending Human Review

- Confirm whether backend AM-011 should seed from this exact fixture shape or receive a serialized mapper/export in a later ticket.
- Confirm whether UI level selection should display `version` and `expectedOptimalMoves`, or treat those as internal metadata for validation/scoring only.

## Lessons / Limitations

Keeping manual levels under `application/level-build/fixtures` avoids treating level definitions as presentation assets while preserving compatibility with `LevelDirector`. The builder remains the source of truth for solvability and optimal-move validation.
