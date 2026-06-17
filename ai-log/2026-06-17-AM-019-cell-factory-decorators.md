# AI Usage Log: AM-019 Cell Factory and Decorators

## Task / Problem

Resolve MAZ-90 / AM-019 by adding domain-level cell decorators and a centralized cell factory after AM-018 introduced board value objects, Composite cells, and the directed graph.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to implement MAZ-90 while following `AGENTS.md` in both repositories, `MEMORY.md`, `Linear_MCP_Guideline.md`, AI usage logging, validation, commit, push, PR, and Linear update rules.

## Result Obtained

Added pure domain components:

- `CellDecorator` as the base Decorator wrapper for `ICell`.
- `LockedCellDecorator`, which blocks movement without modifying wrapped cell classes.
- `CollectableCellDecorator`, which adds deterministic collectable state.
- `ICellFactory` and `CellFactory`, centralizing `CellSpec` to concrete cell creation.

Adjusted the `ICell.direction` contract to be explicitly `Direction | undefined` and updated `Cell` / `ArrowCell` so decorators can preserve arrow directions under `exactOptionalPropertyTypes`.

## Verification

- `npm test -- --runInBand tests/domain/cells/CellFactory.test.ts tests/domain/cells/CellDecorator.test.ts`
- `npm test -- --runInBand tests/domain/cells/CellFactory.test.ts tests/domain/cells/CellDecorator.test.ts tests/domain/board/BoardGraph.test.ts`
- `npm run typecheck`

## Team Modifications Pending Human Review

- Confirm whether locked cells should always be graph-blocking or later support an unlock policy in AM-020/AM-022.
- Confirm whether collectables should have scoring value metadata in AM-024 or remain ID-only until scoring is implemented.

## Lessons / Limitations

The factory intentionally centralizes the only cell-type switch introduced by this ticket. Decorators remain domain-pure and can be used by `BoardGroup` / `BoardGraphBuilder` without presentation or storage dependencies.
