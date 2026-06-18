import { ArrowEntity } from "@/domain/board/ArrowEntity";
import { BoardGroup } from "@/domain/board/BoardGroup";
import { CollisionService } from "@/domain/board/CollisionService";
import { ArrowNotFoundError } from "@/domain/board/errors";
import { ArrowSpec } from "@/domain/value-objects/ArrowSpec";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

const arrow = (id: string, cells: [number, number][], direction: Direction): ArrowEntity =>
  new ArrowEntity(ArrowSpec.of(id, "blue", cells.map(([row, col]) => Position.of(row, col)), direction));

describe("CollisionService", () => {
  const service = new CollisionService();

  it("should_allow_extraction_when_the_forward_ray_is_clear", () => {
    const a = arrow("a", [[0, 0], [0, 1]], Direction.Right); // head (0,1), ray right is empty
    const board = new BoardGroup([a]);

    expect(service.canExtract(board, "a")).toBe(true);
  });

  it("should_block_extraction_when_another_active_arrow_lies_on_the_ray", () => {
    const a = arrow("a", [[0, 0], [0, 1]], Direction.Right); // head (0,1), ray covers (0,2),(0,3)...
    const b = arrow("b", [[2, 3], [1, 3], [0, 3]], Direction.Up); // body occupies (0,3) on a's ray
    const board = new BoardGroup([a, b]);

    expect(service.canExtract(board, "a")).toBe(false);
  });

  it("should_allow_extraction_again_once_the_blocker_is_extracted", () => {
    const a = arrow("a", [[0, 0], [0, 1]], Direction.Right);
    const b = arrow("b", [[2, 3], [1, 3], [0, 3]], Direction.Up);
    const board = new BoardGroup([a, b]);

    b.extract();

    expect(service.canExtract(board, "a")).toBe(true);
  });

  it("should_never_be_blocked_by_its_own_body", () => {
    // tail->head: (0,0)->(0,1)->(1,1)->(1,0); head (1,0) Up faces (0,0), one of its own cells.
    const a = arrow("a", [[0, 0], [0, 1], [1, 1], [1, 0]], Direction.Up);
    const board = new BoardGroup([a]);

    expect(service.canExtract(board, "a")).toBe(true);
  });

  it("should_block_even_when_the_blocking_cell_is_shared_by_two_arrows", () => {
    const a = arrow("a", [[0, 0], [0, 1]], Direction.Right); // ray covers (0,2)
    const b = arrow("b", [[0, 2]], Direction.Up); // occupies (0,2)
    const c = arrow("c", [[0, 2]], Direction.Down); // overlaps (0,2)
    const board = new BoardGroup([a, b, c]);

    expect(service.canExtract(board, "a")).toBe(false);
  });

  it("should_respect_negative_coordinates_on_the_ray", () => {
    const a = arrow("a", [[0, 0], [-1, 0]], Direction.Up); // head (-1,0), ray covers (-2,0),(-3,0)...
    const b = arrow("b", [[-3, -1], [-3, 0], [-3, 1]], Direction.Up); // occupies (-3,0) on a's ray
    const board = new BoardGroup([a, b]);

    expect(service.canExtract(board, "a")).toBe(false);
  });

  it("should_throw_when_the_arrow_is_unknown", () => {
    const board = new BoardGroup([]);

    expect(() => service.canExtract(board, "ghost")).toThrow(ArrowNotFoundError);
  });
});
