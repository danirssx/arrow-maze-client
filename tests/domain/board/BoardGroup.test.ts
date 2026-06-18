import { ArrowCell } from "@/domain/board/ArrowCell";
import { BoardGroup } from "@/domain/board/BoardGroup";
import { DuplicateCellError } from "@/domain/board/errors";
import { EmptyCell } from "@/domain/board/EmptyCell";
import { ExitCell } from "@/domain/board/ExitCell";
import { WallCell } from "@/domain/board/WallCell";
import { CellType } from "@/domain/value-objects/CellType";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

function buildBoard(): BoardGroup {
  return new BoardGroup([
    new ArrowCell(Position.of(0, 0), Direction.Right),
    new WallCell(Position.of(0, 1)),
    new EmptyCell(Position.of(1, 0)),
    new ExitCell(Position.of(1, 1))
  ]);
}

describe("BoardGroup (Composite)", () => {
  it("should_report_total_leaf_count_when_queried_for_size", () => {
    expect(buildBoard().size).toBe(4);
  });

  it("should_treat_nested_groups_uniformly_when_composing_subgroups", () => {
    const nested = new BoardGroup([
      new EmptyCell(Position.of(0, 0)),
      new BoardGroup([new WallCell(Position.of(0, 1)), new ExitCell(Position.of(0, 2))])
    ]);

    expect(nested.size).toBe(3);
    expect(nested.toCells()).toHaveLength(3);
  });

  it("should_find_the_cell_when_position_exists", () => {
    const board = buildBoard();

    const cell = board.find(Position.of(1, 1));

    expect(cell?.type).toBe(CellType.Exit);
    expect(cell?.isExit()).toBe(true);
  });

  it("should_return_undefined_when_position_is_empty_within_the_board", () => {
    const board = buildBoard();

    expect(board.has(Position.of(2, 2))).toBe(false);
    expect(board.find(Position.of(2, 2))).toBeUndefined();
  });

  it("should_expose_cell_behavior_without_any_ui_knowledge", () => {
    const board = buildBoard();

    expect(board.find(Position.of(0, 1))?.isBlocking()).toBe(true);
    expect(board.find(Position.of(1, 0))?.isBlocking()).toBe(false);
  });

  it("should_preserve_arrow_direction_when_cell_is_retrieved", () => {
    const board = buildBoard();

    const arrow = board.find(Position.of(0, 0));

    expect(arrow?.type).toBe(CellType.Arrow);
    expect(arrow?.direction).toBe(Direction.Right);
  });

  it("should_fail_in_controlled_way_when_two_cells_share_a_position", () => {
    const board = new BoardGroup([new EmptyCell(Position.of(0, 0))]);

    expect(() => board.add(new WallCell(Position.of(0, 0)))).toThrow(DuplicateCellError);
  });
});

describe("Leaf cells (Composite)", () => {
  it("should_behave_as_single_node_when_used_directly", () => {
    const exit = new ExitCell(Position.of(2, 2));

    expect(exit.size).toBe(1);
    expect(exit.has(Position.of(2, 2))).toBe(true);
    expect(exit.find(Position.of(2, 2))).toBe(exit);
    expect(exit.find(Position.of(0, 0))).toBeUndefined();
    expect(exit.toCells()).toEqual([exit]);
  });
});
