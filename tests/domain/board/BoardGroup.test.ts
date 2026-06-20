import { ArrowEntity } from "@/domain/board/ArrowEntity";
import { BoardGroup } from "@/domain/board/BoardGroup";
import { DuplicateArrowError } from "@/domain/board/errors";
import { ArrowSpec } from "@/domain/value-objects/ArrowSpec";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

const arrow = (id: string, cells: [number, number][], direction: Direction): ArrowEntity =>
  new ArrowEntity(ArrowSpec.of(id, "blue", cells.map(([row, col]) => Position.of(row, col)), direction));

describe("BoardGroup", () => {
  it("should_index_overlapping_arrows_on_a_shared_cell", () => {
    const a = arrow("a", [[0, 0], [0, 1], [0, 2]], Direction.Right); // occupies (0,2)
    const b = arrow("b", [[2, 2], [1, 2], [0, 2]], Direction.Up); // also occupies (0,2)
    const board = new BoardGroup([a, b]);

    const at = board
      .activeArrowsAt(Position.of(0, 2))
      .map((found) => found.id)
      .sort();

    expect(at).toEqual(["a", "b"]);
  });

  it("should_count_only_active_arrows", () => {
    const a = arrow("a", [[0, 0]], Direction.Up);
    const b = arrow("b", [[5, 5]], Direction.Up);
    const board = new BoardGroup([a, b]);
    expect(board.activeArrowCount()).toBe(2);

    a.extract();

    expect(board.activeArrowCount()).toBe(1);
    expect(board.activeArrowsAt(Position.of(0, 0))).toHaveLength(0);
  });

  it("should_reject_duplicate_arrow_ids", () => {
    const a = arrow("dup", [[0, 0]], Direction.Up);
    const b = arrow("dup", [[1, 1]], Direction.Up);

    expect(() => new BoardGroup([a, b])).toThrow(DuplicateArrowError);
  });

  it("should_frame_active_arrows_and_become_undefined_when_board_is_empty", () => {
    const a = arrow("a", [[1, 1], [1, 2]], Direction.Right);
    const board = new BoardGroup([a]);

    const bounds = board.activeBounds();
    expect(bounds?.minRow).toBe(1);
    expect(bounds?.maxCol).toBe(2);

    a.extract();

    expect(board.activeBounds()).toBeUndefined();
  });
});
