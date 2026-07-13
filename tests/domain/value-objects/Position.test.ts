import { Direction } from "@/domain/value-objects/Direction";
import { InvalidPositionError } from "@/domain/value-objects/errors";
import { Position } from "@/domain/value-objects/Position";

describe("Position", () => {
  it("should_create_position_when_coordinates_are_integers", () => {
    const position = Position.of(2, 3);

    expect(position.row).toBe(2);
    expect(position.col).toBe(3);
    expect(position.z).toBe(0);
    expect(position.toKey()).toBe("2,3,0");
  });

  it("should_default_depth_to_zero_when_created_without_z", () => {
    const position = Position.of(2, 3);

    expect(position.z).toBe(0);
  });

  it("should_store_explicit_depth_when_z_is_provided", () => {
    const position = Position.of(2, 3, 4);

    expect(position.row).toBe(2);
    expect(position.col).toBe(3);
    expect(position.z).toBe(4);
    expect(position.toKey()).toBe("2,3,4");
  });

  it("should_allow_negative_coordinates_when_board_is_unbounded", () => {
    const position = Position.of(-2, -5, -7);

    expect(position.row).toBe(-2);
    expect(position.col).toBe(-5);
    expect(position.z).toBe(-7);
    expect(position.toKey()).toBe("-2,-5,-7");
  });

  it("should_throw_controlled_error_when_coordinates_are_not_integers", () => {
    expect(() => Position.of(1.5, 0)).toThrow(InvalidPositionError);
  });

  it("should_throw_controlled_error_when_depth_is_not_an_integer", () => {
    expect(() => Position.of(0, 0, 1.5)).toThrow(InvalidPositionError);
  });

  it("should_return_translated_position_when_direction_is_applied", () => {
    const moved = Position.of(1, 1).translate(Direction.Right);

    expect(moved.equals(Position.of(1, 2))).toBe(true);
  });

  it("should_preserve_depth_when_translated_by_a_planar_direction", () => {
    const moved = Position.of(1, 1, 3).translate(Direction.Right);

    expect(moved.equals(Position.of(1, 2, 3))).toBe(true);
    expect(moved.z).toBe(3);
  });

  it("should_translate_into_negative_space_when_moving_past_the_origin", () => {
    const moved = Position.of(0, 0).translate(Direction.Up);

    expect(moved.equals(Position.of(-1, 0))).toBe(true);
  });

  it("should_be_value_equal_when_coordinates_match", () => {
    expect(Position.of(4, 5).equals(Position.of(4, 5))).toBe(true);
    expect(Position.of(4, 5).equals(Position.of(5, 4))).toBe(false);
  });

  it("should_not_be_value_equal_when_depth_differs", () => {
    expect(Position.of(4, 5, 0).equals(Position.of(4, 5, 1))).toBe(false);
    expect(Position.of(4, 5, 1).equals(Position.of(4, 5, 1))).toBe(true);
  });
});
