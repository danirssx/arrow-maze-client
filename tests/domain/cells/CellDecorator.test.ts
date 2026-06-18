import { ArrowCell, BoardGroup, EmptyCell, ExitCell } from "@/domain/board";
import { CollectableCellDecorator, LockedCellDecorator } from "@/domain/decorators";
import { BoardGraphBuilder } from "@/domain/board/BoardGraphBuilder";
import { CellType } from "@/domain/value-objects/CellType";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

describe("Cell decorators", () => {
  it("should_delegate_cell_contract_when_base_decorator_wraps_cell", () => {
    const cell = new CollectableCellDecorator(new ArrowCell(Position.of(0, 0), Direction.Right), "coin-1");

    expect(cell.position.equals(Position.of(0, 0))).toBe(true);
    expect(cell.type).toBe(CellType.Arrow);
    expect(cell.direction).toBe(Direction.Right);
    expect(cell.size).toBe(1);
    expect(cell.find(Position.of(0, 0))).toBe(cell);
    expect(cell.find(Position.of(1, 1))).toBeUndefined();
    expect(cell.toCells()).toEqual([cell]);
    expect(cell.unwrap()).toBeInstanceOf(ArrowCell);
  });

  it("should_delegate_exit_behavior_when_base_decorator_wraps_exit_cell", () => {
    const cell = new CollectableCellDecorator(new ExitCell(Position.of(0, 0)), "trophy-1");

    expect(cell.isExit()).toBe(true);
    expect(cell.isBlocking()).toBe(false);
  });

  it("should_block_movement_when_locked_decorator_wraps_walkable_cell", () => {
    const locked = new LockedCellDecorator(new EmptyCell(Position.of(0, 1)));
    const board = new BoardGroup([
      new ArrowCell(Position.of(0, 0), Direction.Right),
      locked,
      new EmptyCell(Position.of(0, 2))
    ]);

    const graph = new BoardGraphBuilder().build(board, 1, 3);

    expect(locked.isBlocking()).toBe(true);
    expect(graph.hasNode(Position.of(0, 1))).toBe(false);
    expect(graph.canMove(Position.of(0, 0), Position.of(0, 1))).toBe(false);
  });

  it("should_keep_wrapped_behavior_when_collectable_decorator_is_collected", () => {
    const collectable = new CollectableCellDecorator(new EmptyCell(Position.of(1, 1)), "gem-1");

    expect(collectable.isCollectable()).toBe(true);
    expect(collectable.isBlocking()).toBe(false);

    collectable.collect();

    expect(collectable.isCollected()).toBe(true);
    expect(collectable.isCollectable()).toBe(false);
    expect(collectable.isBlocking()).toBe(false);
  });
});
