import { Direction } from "@/domain/value-objects/Direction";
import { InvalidCellSpecError } from "@/domain/value-objects/errors";

describe("Direction", () => {
  it("should_expose_grid_delta_when_direction_is_used", () => {
    expect(Direction.Up.rowDelta).toBe(-1);
    expect(Direction.Up.colDelta).toBe(0);
    expect(Direction.Right.colDelta).toBe(1);
  });

  it("should_return_opposite_when_requested", () => {
    expect(Direction.Up.opposite()).toBe(Direction.Down);
    expect(Direction.Left.opposite()).toBe(Direction.Right);
    expect(Direction.Down.opposite()).toBe(Direction.Up);
    expect(Direction.Right.opposite()).toBe(Direction.Left);
  });

  it("should_resolve_direction_when_name_is_known", () => {
    expect(Direction.fromName("LEFT")).toBe(Direction.Left);
  });

  it("should_throw_controlled_error_when_name_is_unknown", () => {
    expect(() => Direction.fromName("DIAGONAL")).toThrow(InvalidCellSpecError);
  });
});
