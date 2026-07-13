import { Direction } from "@/domain/value-objects/Direction";
import { InvalidDirectionError } from "@/domain/value-objects/errors";

describe("Direction", () => {
  it("should_expose_grid_delta_when_direction_is_used", () => {
    expect(Direction.Up.rowDelta).toBe(-1);
    expect(Direction.Up.colDelta).toBe(0);
    expect(Direction.Right.colDelta).toBe(1);
  });

  it("should_keep_planar_directions_flat_on_the_depth_axis", () => {
    expect(Direction.Up.zDelta).toBe(0);
    expect(Direction.Down.zDelta).toBe(0);
    expect(Direction.Left.zDelta).toBe(0);
    expect(Direction.Right.zDelta).toBe(0);
  });

  it("should_expose_depth_delta_when_direction_is_on_the_z_axis", () => {
    expect(Direction.Forward.rowDelta).toBe(0);
    expect(Direction.Forward.colDelta).toBe(0);
    expect(Direction.Forward.zDelta).toBe(1);

    expect(Direction.Back.rowDelta).toBe(0);
    expect(Direction.Back.colDelta).toBe(0);
    expect(Direction.Back.zDelta).toBe(-1);
  });

  it("should_expose_all_six_world_axis_directions", () => {
    expect(Direction.all()).toHaveLength(6);
    expect(Direction.all()).toContain(Direction.Forward);
    expect(Direction.all()).toContain(Direction.Back);
  });

  it("should_return_opposite_when_requested", () => {
    expect(Direction.Up.opposite()).toBe(Direction.Down);
    expect(Direction.Left.opposite()).toBe(Direction.Right);
    expect(Direction.Down.opposite()).toBe(Direction.Up);
    expect(Direction.Right.opposite()).toBe(Direction.Left);
    expect(Direction.Forward.opposite()).toBe(Direction.Back);
    expect(Direction.Back.opposite()).toBe(Direction.Forward);
  });

  it("should_resolve_direction_when_name_is_known", () => {
    expect(Direction.fromName("LEFT")).toBe(Direction.Left);
    expect(Direction.fromName("FORWARD")).toBe(Direction.Forward);
    expect(Direction.fromName("BACK")).toBe(Direction.Back);
  });

  it("should_throw_controlled_error_when_name_is_unknown", () => {
    expect(() => Direction.fromName("DIAGONAL")).toThrow(InvalidDirectionError);
  });

  it("should_be_value_equal_only_when_name_matches", () => {
    expect(Direction.Forward.equals(Direction.Forward)).toBe(true);
    expect(Direction.Forward.equals(Direction.Back)).toBe(false);
    expect(Direction.Up.equals(Direction.Down)).toBe(false);
  });
});
