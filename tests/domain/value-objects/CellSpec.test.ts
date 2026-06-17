import { CellSpec } from "@/domain/value-objects/CellSpec";
import { CellType } from "@/domain/value-objects/CellType";
import { Direction } from "@/domain/value-objects/Direction";
import { InvalidCellSpecError } from "@/domain/value-objects/errors";
import { Position } from "@/domain/value-objects/Position";

describe("CellSpec", () => {
  it("should_create_arrow_spec_when_direction_is_provided", () => {
    const spec = CellSpec.of(Position.of(0, 0), CellType.Arrow, Direction.Up);

    expect(spec.type).toBe(CellType.Arrow);
    expect(spec.direction).toBe(Direction.Up);
  });

  it("should_throw_controlled_error_when_arrow_has_no_direction", () => {
    expect(() => CellSpec.of(Position.of(0, 0), CellType.Arrow)).toThrow(InvalidCellSpecError);
  });

  it("should_throw_controlled_error_when_non_arrow_has_direction", () => {
    expect(() => CellSpec.of(Position.of(0, 0), CellType.Wall, Direction.Up)).toThrow(
      InvalidCellSpecError
    );
  });

  it("should_be_value_equal_when_position_type_and_direction_match", () => {
    const a = CellSpec.of(Position.of(1, 1), CellType.Arrow, Direction.Left);
    const b = CellSpec.of(Position.of(1, 1), CellType.Arrow, Direction.Left);

    expect(a.equals(b)).toBe(true);
  });
});
