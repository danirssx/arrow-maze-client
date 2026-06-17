import { NormalLevel } from "@/domain/level";
import { CellSpec } from "@/domain/value-objects/CellSpec";
import { CellType } from "@/domain/value-objects/CellType";
import { Difficulty } from "@/domain/value-objects/Difficulty";
import { Direction } from "@/domain/value-objects/Direction";
import { LevelTemplate } from "@/domain/value-objects/LevelTemplate";
import { Position } from "@/domain/value-objects/Position";

/**
 * Solvable 2x3 board:
 *   (0,0) Arrow Right -> (0,1) Empty -> (0,2) Empty -> (1,2) Exit
 *   (1,1) is a Wall and (1,0) is left empty (no cell, non-navigable).
 */
function buildSolvableTemplate(): LevelTemplate {
  return LevelTemplate.create({
    id: "level-normal",
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

describe("NormalLevel", () => {
  it("should_produce_victory_when_player_reaches_exit_through_allowed_route", () => {
    const level = new NormalLevel(buildSolvableTemplate(), Position.of(0, 0));

    level.move(Position.of(0, 1));
    level.move(Position.of(0, 2));
    level.move(Position.of(1, 2));
    const result = level.evaluate();

    expect(result.isWon()).toBe(true);
    expect(level.moves).toBe(3);
    expect(level.position.equals(Position.of(1, 2))).toBe(true);
  });

  it("should_stay_playing_when_player_has_not_reached_exit", () => {
    const level = new NormalLevel(buildSolvableTemplate(), Position.of(0, 0));

    level.move(Position.of(0, 1));
    const result = level.evaluate();

    expect(result.isPlaying()).toBe(true);
    expect(result.isWon()).toBe(false);
  });

  it("should_never_produce_defeat_when_level_is_untimed", () => {
    const level = new NormalLevel(buildSolvableTemplate(), Position.of(0, 0));

    const result = level.evaluate();

    expect(result.isLost()).toBe(false);
  });
});
