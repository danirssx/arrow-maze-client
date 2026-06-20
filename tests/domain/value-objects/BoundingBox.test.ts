import { BoundingBox } from "@/domain/value-objects/BoundingBox";
import { InvalidBoundingBoxError } from "@/domain/value-objects/errors";
import { Position } from "@/domain/value-objects/Position";

describe("BoundingBox", () => {
  it("should_span_min_and_max_when_built_from_positions_including_negatives", () => {
    const box = BoundingBox.fromPositions([Position.of(-1, 2), Position.of(3, -4), Position.of(0, 0)]);

    expect(box.minRow).toBe(-1);
    expect(box.maxRow).toBe(3);
    expect(box.minCol).toBe(-4);
    expect(box.maxCol).toBe(2);
    expect(box.rows).toBe(5);
    expect(box.cols).toBe(7);
  });

  it("should_report_containment_when_position_is_inside", () => {
    const box = BoundingBox.fromPositions([Position.of(0, 0), Position.of(2, 2)]);

    expect(box.contains(Position.of(1, 1))).toBe(true);
    expect(box.contains(Position.of(3, 3))).toBe(false);
  });

  it("should_throw_when_no_positions_are_given", () => {
    expect(() => BoundingBox.fromPositions([])).toThrow(InvalidBoundingBoxError);
  });
});
