# AI Usage Log: AM-022 Command History and Undo

## Task / Problem

Resolve MAZ-93 / AM-022 by implementing the approved Command pattern for reversible gameplay moves in the mobile domain engine.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to implement MAZ-93 while reviewing both repository `AGENTS.md` files, `MEMORY.md`, `Linear_MCP_Guideline.md`, AI usage logging, validation, memory/agent updates, commit, push, PR, and Linear update rules.

## Result Obtained

Added pure domain command components in `src/domain/command`:

- `ICommand`, the reversible command contract.
- `MoveCommand`, which delegates movement validation to `GameContext`/`BaseLevel` and restores a deterministic snapshot on undo.
- `CommandHistory`, a LIFO history that records only successfully executed commands.
- Controlled command errors for empty history, undo-before-execute, and double execution.

Extended `BaseLevel` with graph-backed `canMoveTo` and validated `restoreProgress`, and extended `GameContext` with snapshot/restore support for phase and result. Added command tests covering valid moves, invalid graph moves, deterministic undo, winning-move undo, empty history, double execution, and undo-before-execute.

## Verification

- `npm test -- --runInBand tests/domain/command/MoveCommand.test.ts`
- `npm run verify`

## Team Modifications Pending Human Review

- Confirm whether AM-026 should wrap `CommandHistory` inside `GameFacade` as session state or instantiate it per active level.
- Confirm whether future collectable effects need command-specific effect snapshots when AM-024 scoring/AM-026 gameplay orchestration expands beyond position and lifecycle state.

## Lessons / Limitations

Undo belongs in the domain command layer because it must protect movement invariants and replay/rollback deterministically. Presentation should trigger undo through future application use cases, not by mutating `BaseLevel` or `GameContext` directly.
