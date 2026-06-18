import { ArrowCell, EmptyCell, ExitCell, WallCell } from "@/domain/board";
import { CellFactory } from "@/domain/factory";
import { CellSpec } from "@/domain/value-objects/CellSpec";
import { CellType } from "@/domain/value-objects/CellType";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";
import { InvalidCellSpecError } from "@/domain/value-objects/errors";

describe("CellFactory", () => {
  const factory = new CellFactory();

  it("should_create_arrow_cell_when_spec_type_is_arrow", () => {
    const cell = factory.create(CellSpec.of(Position.of(0, 0), CellType.Arrow, Direction.Right));

    expect(cell).toBeInstanceOf(ArrowCell);
    expect(cell.position.equals(Position.of(0, 0))).toBe(true);
    expect(cell.direction).toBe(Direction.Right);
  });

  it("should_create_wall_cell_when_spec_type_is_wall", () => {
    const cell = factory.create(CellSpec.of(Position.of(1, 0), CellType.Wall));

    expect(cell).toBeInstanceOf(WallCell);
    expect(cell.isBlocking()).toBe(true);
  });

  it("should_create_empty_cell_when_spec_type_is_empty", () => {
    const cell = factory.create(CellSpec.of(Position.of(1, 1), CellType.Empty));

    expect(cell).toBeInstanceOf(EmptyCell);
    expect(cell.isBlocking()).toBe(false);
  });

  it("should_create_exit_cell_when_spec_type_is_exit", () => {
    const cell = factory.create(CellSpec.of(Position.of(2, 2), CellType.Exit));

    expect(cell).toBeInstanceOf(ExitCell);
    expect(cell.isExit()).toBe(true);
  });

  it("should_reject_arrow_spec_when_direction_is_missing", () => {
    const spec = {
      position: Position.of(0, 0),
      type: CellType.Arrow,
      direction: undefined
    } as unknown as CellSpec;

    expect(() => factory.create(spec)).toThrow(InvalidCellSpecError);
  });

  it("should_reject_unknown_cell_type_when_spec_is_malformed", () => {
    const spec = {
      position: Position.of(0, 0),
      type: "PORTAL",
      direction: undefined
    } as unknown as CellSpec;

    expect(() => factory.create(spec)).toThrow(InvalidCellSpecError);
  });
});
