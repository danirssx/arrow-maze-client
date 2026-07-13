import { ArrowEntity } from "@/domain/board/ArrowEntity";
import { BoardGroup } from "@/domain/board/BoardGroup";
import { CollisionService } from "@/domain/board/CollisionService";
import { ArrowNotFoundError } from "@/domain/board/errors";
import { ArrowSpec } from "@/domain/value-objects/ArrowSpec";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

const arrow = (id: string, cells: [number, number][], direction: Direction): ArrowEntity =>
  new ArrowEntity(ArrowSpec.of(id, "blue", cells.map(([row, col]) => Position.of(row, col)), direction));

const arrow3 = (id: string, cells: [number, number, number][], direction: Direction): ArrowEntity =>
  new ArrowEntity(ArrowSpec.of(id, "blue", cells.map(([row, col, z]) => Position.of(row, col, z)), direction));

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

  it("should_allow_extraction_when_the_depth_ray_is_clear", () => {
    const a = arrow3("a", [[0, 0, 0], [0, 0, 1]], Direction.Forward); // head (0,0,1), depth ray empty
    const board = new BoardGroup([a]);

    expect(service.canExtract(board, "a")).toBe(true);
  });

  it("should_block_extraction_when_another_active_arrow_lies_on_the_depth_ray", () => {
    const a = arrow3("a", [[0, 0, 0], [0, 0, 1]], Direction.Forward); // ray covers (0,0,2),(0,0,3)...
    const b = arrow3("b", [[0, 0, 3]], Direction.Up); // occupies (0,0,3) strictly ahead in depth
    const board = new BoardGroup([a, b]);

    expect(service.canExtract(board, "a")).toBe(false);
  });

  it("should_not_be_blocked_by_a_planar_cell_at_a_different_depth", () => {
    const a = arrow("a", [[0, 0], [0, 1]], Direction.Right); // head (0,1,0), horizontal ray at z=0
    const b = arrow3("b", [[0, 3, 2]], Direction.Up); // same row, ahead in col, but z=2 != 0
    const board = new BoardGroup([a, b]);

    expect(service.canExtract(board, "a")).toBe(true);
  });

  it("should_not_be_blocked_by_a_depth_ray_cell_off_the_shared_column", () => {
    const a = arrow3("a", [[0, 0, 0], [0, 0, 1]], Direction.Forward); // depth ray at row 0, col 0
    const b = arrow3("b", [[0, 1, 3]], Direction.Up); // ahead in depth but col 1 != 0
    const board = new BoardGroup([a, b]);

    expect(service.canExtract(board, "a")).toBe(true);
  });

  it("should_not_be_blocked_on_a_row_ray_by_a_cell_at_a_different_depth", () => {
    const a = arrow3("a", [[0, 0, 0], [-1, 0, 0]], Direction.Up); // head (-1,0,0), row ray upward at z=0
    const b = arrow3("b", [[-3, 0, 5]], Direction.Up); // same row-line, ahead, but z=5 != 0
    const board = new BoardGroup([a, b]);

    expect(service.canExtract(board, "a")).toBe(true);
  });

  it("should_not_be_blocked_on_a_row_ray_by_a_cell_off_the_shared_column", () => {
    const a = arrow3("a", [[0, 0, 0], [-1, 0, 0]], Direction.Up); // head (-1,0,0), col 0
    const b = arrow3("b", [[-3, 1, 0]], Direction.Up); // ahead in row but col 1 != 0
    const board = new BoardGroup([a, b]);

    expect(service.canExtract(board, "a")).toBe(true);
  });

  it("should_not_be_blocked_on_a_column_ray_by_a_cell_off_the_shared_row", () => {
    const a = arrow("a", [[0, 0], [0, 1]], Direction.Right); // head (0,1,0), row 0
    const b = arrow3("b", [[2, 3, 0]], Direction.Up); // ahead in col but row 2 != 0
    const board = new BoardGroup([a, b]);

    expect(service.canExtract(board, "a")).toBe(true);
  });

  it("should_not_be_blocked_on_a_depth_ray_by_a_cell_off_the_shared_row", () => {
    const a = arrow3("a", [[0, 0, 0], [0, 0, 1]], Direction.Forward); // depth ray at row 0, col 0
    const b = arrow3("b", [[1, 0, 3]], Direction.Up); // ahead in depth but row 1 != 0
    const board = new BoardGroup([a, b]);

    expect(service.canExtract(board, "a")).toBe(true);
  });

  it("should_not_be_blocked_when_an_overlapping_arrow_sits_exactly_on_the_head", () => {
    const a = arrow("a", [[0, 0], [0, 1]], Direction.Right); // head (0,1,0)
    const b = arrow3("b", [[0, 1, 0]], Direction.Up); // overlaps the head cell, not strictly ahead
    const board = new BoardGroup([a, b]);

    expect(service.canExtract(board, "a")).toBe(true);
  });

  it("should_return_false_when_the_arrow_is_already_extracted", () => {
    const a = arrow("a", [[0, 0], [0, 1]], Direction.Right);
    const board = new BoardGroup([a]);

    a.extract();

    expect(service.canExtract(board, "a")).toBe(false);
  });

  it("should_throw_when_the_arrow_is_unknown", () => {
    const board = new BoardGroup([]);

    expect(() => service.canExtract(board, "ghost")).toThrow(ArrowNotFoundError);
  });
});
