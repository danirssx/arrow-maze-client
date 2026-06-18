# AI Usage Log: AM-031 Domain-to-ViewModel Observer Contract

## Task / Problem

Resolve MAZ-102 / AM-031 by defining the contract that lets a future `GameViewModel` observe the
domain without leaking UI into the domain or forcing presentation to read domain internals
(`BoardGraph`, level classes). Provide UI-neutral event DTOs, an observer bridge, a board
snapshot mapper, and document the `GameViewModel` responsibilities.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to implement MAZ-102 following `AGENTS.md` in both repositories, `MEMORY.md`,
`Linear_MCP_Guideline.md`, AI usage logging (with the agent-role table), validation, checking
whether `MEMORY.md`/`AGENTS.md` need updates, commit, push, PR, and Linear update rules.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Spec taken from Linear AM-031; `.agents/spec-partner.md` conventions followed. | Linear MAZ-102 |
| Planner/Slicer | Referenced | Ticket already planned/sliced in the tickets plan. | Linear MAZ-102 |
| TDD Implementer | Used | Built the contract guided by mapper/bridge/facade tests covering both acceptance criteria. | `tests/application/game/GameEventContract.test.ts`, PR #20 |
| Judge | Referenced | Self-review via `.agents/judge.md` checklist + `npm run verify`; coordination with the presentation owner flagged for AM-045. | Linear comment, `npm run verify` |
| Mutation Tester | Not used | No mutation run for this boundary ticket. | N/A |

## Result Obtained

New application module `src/application/dto` (UI-neutral domain→presentation boundary):

- `GameEventDto` — discriminated union mirroring domain `GameEvent` with plain payloads
  (`PositionDto`, `GameResultDto`); reuses the domain `GameEventType` string discriminator.
- `IGameEventListener` — presentation-facing observer interface, with documented `GameViewModel`
  responsibilities (subscribe via the facade, translate DTOs to UI state, never import
  `BoardGraph`/level classes/`Position`/`LevelResult`).
- `GameEventMapper.mapGameEvent` — single domain `GameEvent` → `GameEventDto` translation point.
- `GameEventBridge` — implements the domain `IGameObserver`, maps events, and forwards DTOs to an
  `IGameEventListener` (keeps presentation from implementing the domain observer directly).
- `BoardSnapshotDto` + `mapBoardSnapshot` — UI-neutral board layout (dimensions, start, exit,
  cells with type and direction name) mapped from a `LevelDefinition`, so screens render the grid
  without reading `BoardGraph`/`BoardGroup`.

Facade integration (`src/application/facades/GameFacade.ts`):

- `addEventListener` / `removeEventListener` and `getBoardSnapshot`.
- The facade owns one `GameEventBridge` that it (re)registers on each new level (start/restart)
  and fans out to all listeners. The level definition is captured once at start (single
  `createDefinition` call) to back the board snapshot, with no domain or use-case changes.

The domain layer was not modified (kept pure); the bridge subscribes through the existing
`BaseLevel`/`IObservable` API.

## Verification

- `npm test -- --runInBand tests/application/game/GameEventContract.test.ts` (11 tests:
  event mapping, bridge forwarding, board snapshot mapping, facade subscribe/win/remove,
  board-snapshot and pre-start error cases).
- `npm run verify` (lint + typecheck + coverage): 211 tests across 29 suites passing, 0 lint
  errors (remaining output is pre-existing warnings only). `application/dto` 100% and
  `application/facades` 100% statements.

## Team Modifications Pending Human Review

- Definition of Done requires coordination with the presentation owner (Daniella Cruz) before
  AM-045: confirm the `GameEventDto`/`BoardSnapshotDto` shapes and the `IGameEventListener`
  contract match the planned `GameViewModel`/MVVM design. Flagged in the Linear comment.
- Decide whether `GameSnapshotDto` should also carry the current `score` (open question from
  AM-029) so the ViewModel reads it from one snapshot.

## Lessons / Limitations

Bridging the domain `IGameObserver` into a DTO-only `IGameEventListener` at the application
boundary lets presentation stay free of domain imports while keeping the domain observer pure.
Capturing the `LevelDefinition` once at `startLevel` (and reusing it for the board snapshot)
avoided exposing the board through the domain `BaseLevel` API, keeping all changes within the
ticket's touch paths (`application/dto`, `application/facades`).
