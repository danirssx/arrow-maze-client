import { CellSpec } from "@/domain/value-objects/CellSpec";
import { CellType } from "@/domain/value-objects/CellType";
import { Difficulty } from "@/domain/value-objects/Difficulty";
import { Direction } from "@/domain/value-objects/Direction";
import {
  InvalidLevelTemplateError,
  PositionOutOfBoundsError
} from "@/domain/value-objects/errors";
import { LevelTemplate } from "@/domain/value-objects/LevelTemplate";
import { Position } from "@/domain/value-objects/Position";

function buildTemplate(cells = [CellSpec.of(Position.of(0, 0), CellType.Arrow, Direction.Down)]) {
  return LevelTemplate.create({
    id: "level-1",
    rows: 3,
    cols: 3,
    difficulty: Difficulty.Easy,
    cells
  });
}

describe("LevelTemplate", () => {
  it("should_expose_dimensions_and_cells_when_created", () => {
    const template = buildTemplate();

    expect(template.rows).toBe(3);
    expect(template.cols).toBe(3);
    expect(template.difficulty).toBe(Difficulty.Easy);
    expect(template.cells).toHaveLength(1);
  });

  it("should_throw_controlled_error_when_dimensions_are_not_positive", () => {
    expect(() =>
      LevelTemplate.create({ id: "x", rows: 0, cols: 3, difficulty: Difficulty.Easy, cells: [] })
    ).toThrow(InvalidLevelTemplateError);
  });

  it("should_throw_controlled_error_when_a_cell_is_outside_the_board", () => {
    const outOfBoard = CellSpec.of(Position.of(5, 5), CellType.Wall);

    expect(() => buildTemplate([outOfBoard])).toThrow(InvalidLevelTemplateError);
  });

  it("should_throw_controlled_error_when_two_cells_share_a_position", () => {
    const cells = [
      CellSpec.of(Position.of(1, 1), CellType.Empty),
      CellSpec.of(Position.of(1, 1), CellType.Wall)
    ];

    expect(() => buildTemplate(cells)).toThrow(InvalidLevelTemplateError);
  });

  it("should_return_spec_when_querying_an_existing_in_bounds_cell", () => {
    const template = buildTemplate();

    expect(template.cellAt(Position.of(0, 0))?.type).toBe(CellType.Arrow);
    expect(template.cellAt(Position.of(2, 2))).toBeUndefined();
  });

  it("should_fail_in_controlled_way_when_querying_a_position_outside_the_board", () => {
    const template = buildTemplate();

    expect(() => template.cellAt(Position.of(9, 9))).toThrow(PositionOutOfBoundsError);
  });
});
