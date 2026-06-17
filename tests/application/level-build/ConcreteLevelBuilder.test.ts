import { TimedLevel } from "@/domain/level";
import { CellSpec } from "@/domain/value-objects/CellSpec";
import { CellType } from "@/domain/value-objects/CellType";
import { Difficulty } from "@/domain/value-objects/Difficulty";
import { Direction } from "@/domain/value-objects/Direction";
import { LevelTemplate } from "@/domain/value-objects/LevelTemplate";
import { Position } from "@/domain/value-objects/Position";
import {
  ConcreteLevelBuilder,
  InvalidLevelDefinitionError,
  LevelBuildStateError
} from "@/application/level-build";

function solvableTemplate(): LevelTemplate {
  return LevelTemplate.create({
    id: "builder-solvable",
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

function noExitTemplate(): LevelTemplate {
  return LevelTemplate.create({
    id: "builder-no-exit",
    rows: 1,
    cols: 2,
    difficulty: Difficulty.Easy,
    cells: [
      CellSpec.of(Position.of(0, 0), CellType.Arrow, Direction.Right),
      CellSpec.of(Position.of(0, 1), CellType.Empty)
    ]
  });
}

describe("ConcreteLevelBuilder", () => {
  it("should_build_timed_level_and_compute_optimal_moves_when_configured", () => {
    const built = new ConcreteLevelBuilder()
      .reset()
      .useTemplate(solvableTemplate())
      .startingAt(Position.of(0, 0))
      .asTimed(20)
      .build();

    expect(built.level).toBeInstanceOf(TimedLevel);
    expect(built.optimalMoves).toBe(3);
  });

  it("should_reject_build_when_no_template_was_set", () => {
    expect(() => new ConcreteLevelBuilder().startingAt(Position.of(0, 0)).build()).toThrow(LevelBuildStateError);
  });

  it("should_reject_build_when_no_start_was_set", () => {
    expect(() => new ConcreteLevelBuilder().useTemplate(solvableTemplate()).build()).toThrow(LevelBuildStateError);
  });

  it("should_reject_build_when_start_is_not_a_navigable_cell", () => {
    const builder = new ConcreteLevelBuilder().useTemplate(solvableTemplate()).startingAt(Position.of(1, 1));

    expect(() => builder.build()).toThrow(InvalidLevelDefinitionError);
  });

  it("should_reject_build_when_template_has_no_exit", () => {
    const builder = new ConcreteLevelBuilder().useTemplate(noExitTemplate()).startingAt(Position.of(0, 0));

    expect(() => builder.build()).toThrow(InvalidLevelDefinitionError);
  });

  it("should_reject_timed_build_when_time_limit_is_not_positive", () => {
    const builder = new ConcreteLevelBuilder()
      .useTemplate(solvableTemplate())
      .startingAt(Position.of(0, 0))
      .asTimed(0);

    expect(() => builder.build()).toThrow(InvalidLevelDefinitionError);
  });
});
