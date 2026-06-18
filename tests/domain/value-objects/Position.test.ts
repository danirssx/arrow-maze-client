import { Direction } from "@/domain/value-objects/Direction";
import { InvalidPositionError } from "@/domain/value-objects/errors";
import { Position } from "@/domain/value-objects/Position";

describe("Position", () => {
  it("should_create_position_when_coordinates_are_integers", () => {
    const position = Position.of(2, 3);

    expect(position.row).toBe(2);
    expect(position.col).toBe(3);
    expect(position.toKey()).toBe("2,3");
  });

  it("should_allow_negative_coordinates_when_board_is_unbounded", () => {
    const position = Position.of(-2, -5);

    expect(position.row).toBe(-2);
    expect(position.col).toBe(-5);
    expect(position.toKey()).toBe("-2,-5");
  });

  it("should_throw_controlled_error_when_coordinates_are_not_integers", () => {
    expect(() => Position.of(1.5, 0)).toThrow(InvalidPositionError);
  });

  it("should_return_translated_position_when_direction_is_applied", () => {
    const moved = Position.of(1, 1).translate(Direction.Right);

    expect(moved.equals(Position.of(1, 2))).toBe(true);
  });

  it("should_translate_into_negative_space_when_moving_past_the_origin", () => {
    const moved = Position.of(0, 0).translate(Direction.Up);

    expect(moved.equals(Position.of(-1, 0))).toBe(true);
  });

  it("should_be_value_equal_when_coordinates_match", () => {
    expect(Position.of(4, 5).equals(Position.of(4, 5))).toBe(true);
    expect(Position.of(4, 5).equals(Position.of(5, 4))).toBe(false);
  });
});
