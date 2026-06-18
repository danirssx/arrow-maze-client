# AI Usage Log: AM-018 Directed Board Graph

## Task / Problem

Extend AM-018 / MAZ-89 after the planning update that added directed graph and pathfinding logic to the mobile board domain.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to update Linear tickets with the new board graph scope and then continue implementing MAZ-89.

## Result Obtained

Added pure domain graph components in `src/domain/board`:

- `BoardGraph`, a directed movement graph over navigable board positions.
- `BoardGraphBuilder`, translating Composite board cells into directed edges.
- `PathfindingService`, providing BFS-based reachability, shortest path, and `optimalMoves` calculation.
- `PositionNotInGraphError` for controlled graph mutation failures.

Movement semantics implemented for AM-018:

- `WallCell` does not become a graph node.
- `ExitCell` is a terminal node.
- `ArrowCell` creates only one outgoing edge in its arrow direction.
- `EmptyCell` creates outgoing edges to navigable cardinal neighbors.

## Verification

- `npm test -- --runInBand tests/domain/board/BoardGraph.test.ts tests/domain/board/BoardGroup.test.ts`
- `npm run verify`

## Team Modifications Pending Human Review

- Confirm whether future level templates will introduce an explicit `StartCell`; AM-018 currently receives start and exit positions as pathfinding inputs.
- Confirm whether empty cells should remain four-directional or receive stricter movement rules in AM-020/AM-022.

## Lessons / Limitations

The graph belongs in `src/domain/board` because movement validity is a game-domain invariant. Application and presentation layers should consume graph-backed results through later builders/facades instead of inspecting graph internals directly.
