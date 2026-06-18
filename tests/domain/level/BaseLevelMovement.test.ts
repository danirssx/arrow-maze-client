import { IllegalMoveError, InvalidLevelStartError, InvalidMoveCountError, MissingExitError, NormalLevel } from "@/domain/level";
import { CellSpec } from "@/domain/value-objects/CellSpec";
import { CellType } from "@/domain/value-objects/CellType";
import { Difficulty } from "@/domain/value-objects/Difficulty";
import { Direction } from "@/domain/value-objects/Direction";
import { LevelTemplate } from "@/domain/value-objects/LevelTemplate";
import { Position } from "@/domain/value-objects/Position";

function buildSolvableTemplate(): LevelTemplate {
  return LevelTemplate.create({
    id: "level-movement",
    rows: 2,
    cols: 3,
    difficulty: Difficulty.Easy,
    cells: [
      CellSpec.of(Position.of(0, 0), CellType.Arrow, Direction.Right),
      CellSpec.of(Position.of(0, 1), CellType.Empty),
      CellSpec.of(Position.of(0, 2), CellType.Empty),
      CellSpec.of(Position.of(1, 1), CellType.Wall),
      CellSpec.of(Position.of(1, 2), CellType.Exit)
    ]
  });
}

describe("BaseLevel movement constraints", () => {
  it("should_reject_move_when_destination_is_not_connected_in_graph", () => {
    const level = new NormalLevel(buildSolvableTemplate(), Position.of(0, 0));

    expect(() => level.move(Position.of(0, 2))).toThrow(IllegalMoveError);
  });

  it("should_not_mutate_state_when_move_is_rejected", () => {
    const level = new NormalLevel(buildSolvableTemplate(), Position.of(0, 0));

    expect(() => level.move(Position.of(1, 0))).toThrow(IllegalMoveError);
    expect(level.position.equals(Position.of(0, 0))).toBe(true);
    expect(level.moves).toBe(0);
  });

  it("should_reject_arrow_cell_move_against_its_direction", () => {
    const level = new NormalLevel(buildSolvableTemplate(), Position.of(0, 0));

    // The arrow at (0,0) only points Right, so moving Down is not a graph edge.
    expect(() => level.move(Position.of(1, 0))).toThrow(IllegalMoveError);
  });

  it("should_reject_construction_when_start_is_not_a_navigable_cell", () => {
    expect(() => new NormalLevel(buildSolvableTemplate(), Position.of(1, 1))).toThrow(InvalidLevelStartError);
  });

  it("should_reject_construction_when_template_has_no_exit", () => {
    const template = LevelTemplate.create({
      id: "no-exit",
      rows: 1,
      cols: 2,
      difficulty: Difficulty.Easy,
      cells: [
        CellSpec.of(Position.of(0, 0), CellType.Arrow, Direction.Right),
        CellSpec.of(Position.of(0, 1), CellType.Empty)
      ]
    });

    expect(() => new NormalLevel(template, Position.of(0, 0))).toThrow(MissingExitError);
  });

  it("should_reject_restore_when_position_is_not_navigable", () => {
    const level = new NormalLevel(buildSolvableTemplate(), Position.of(0, 0));

    expect(() => level.restoreProgress(Position.of(1, 1), 0)).toThrow(InvalidLevelStartError);
  });

  it("should_reject_restore_when_move_count_is_negative_or_fractional", () => {
    const level = new NormalLevel(buildSolvableTemplate(), Position.of(0, 0));

    expect(() => level.restoreProgress(Position.of(0, 0), -1)).toThrow(InvalidMoveCountError);
    expect(() => level.restoreProgress(Position.of(0, 0), 1.5)).toThrow(InvalidMoveCountError);
  });
});
