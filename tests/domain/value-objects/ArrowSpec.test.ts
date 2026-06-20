import { ArrowSpec } from "@/domain/value-objects/ArrowSpec";
import { Direction } from "@/domain/value-objects/Direction";
import { InvalidArrowSpecError } from "@/domain/value-objects/errors";
import { Position } from "@/domain/value-objects/Position";

const path = (...cells: [number, number][]): Position[] => cells.map(([row, col]) => Position.of(row, col));

describe("ArrowSpec", () => {
  it("should_expose_head_as_last_cell_when_created", () => {
    const arrow = ArrowSpec.of("a", "blue", path([0, 0], [0, 1], [0, 2]), Direction.Right);

    expect(arrow.head.equals(Position.of(0, 2))).toBe(true);
    expect(arrow.cells).toHaveLength(3);
  });

  it("should_accept_a_bent_path_when_segments_are_orthogonally_connected", () => {
    const arrow = ArrowSpec.of("a", "green", path([2, 0], [1, 0], [1, 1], [1, 2]), Direction.Right);

    expect(arrow.head.equals(Position.of(1, 2))).toBe(true);
  });

  it("should_throw_when_path_is_empty", () => {
    expect(() => ArrowSpec.of("a", "blue", [], Direction.Right)).toThrow(InvalidArrowSpecError);
  });

  it("should_throw_when_path_is_not_orthogonally_connected", () => {
    expect(() => ArrowSpec.of("a", "blue", path([0, 0], [0, 2]), Direction.Right)).toThrow(InvalidArrowSpecError);
  });

  it("should_throw_when_path_self_intersects", () => {
    expect(() => ArrowSpec.of("a", "blue", path([0, 0], [0, 1], [0, 0]), Direction.Right)).toThrow(
      InvalidArrowSpecError
    );
  });

  it("should_throw_when_head_points_back_into_its_own_body", () => {
    // tail->head: (0,1)->(0,2); head (0,2) pointing Left faces (0,1), the penultimate cell.
    expect(() => ArrowSpec.of("a", "blue", path([0, 1], [0, 2]), Direction.Left)).toThrow(InvalidArrowSpecError);
  });

  it("should_throw_when_id_or_color_is_blank", () => {
    expect(() => ArrowSpec.of("  ", "blue", path([0, 0]), Direction.Up)).toThrow(InvalidArrowSpecError);
    expect(() => ArrowSpec.of("a", "  ", path([0, 0]), Direction.Up)).toThrow(InvalidArrowSpecError);
  });
});
