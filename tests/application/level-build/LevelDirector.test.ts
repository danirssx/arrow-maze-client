import { NormalLevel, TimedLevel } from "@/domain/level";
import { CellSpec } from "@/domain/value-objects/CellSpec";
import { CellType } from "@/domain/value-objects/CellType";
import { Difficulty } from "@/domain/value-objects/Difficulty";
import { Direction } from "@/domain/value-objects/Direction";
import { LevelTemplate } from "@/domain/value-objects/LevelTemplate";
import { Position } from "@/domain/value-objects/Position";
import {
  ConcreteLevelBuilder,
  InvalidLevelDefinitionError,
  JsonLevelStrategy,
  LevelDirector,
  LevelKind,
  TutorialLevelStrategy,
  UnsolvableLevelError
} from "@/application/level-build";
import type { ILevelStrategy, LevelDefinition } from "@/application/level-build";

function makeDirector(): LevelDirector {
  return new LevelDirector(new ConcreteLevelBuilder());
}

const solvableTimedJson = JSON.stringify({
  id: "json-timed",
  rows: 2,
  cols: 3,
  difficulty: "MEDIUM",
  kind: "TIMED",
  timeLimitSeconds: 30,
  start: { row: 0, col: 0 },
  cells: [
    { row: 0, col: 0, type: "ARROW", direction: "RIGHT" },
    { row: 0, col: 1, type: "EMPTY" },
    { row: 0, col: 2, type: "EMPTY" },
    { row: 1, col: 1, type: "WALL" },
    { row: 1, col: 2, type: "EXIT" }
  ]
});

// Arrow points away from the exit and a wall blocks the rest: no start -> exit path.
const unsolvableJson = JSON.stringify({
  id: "json-unsolvable",
  rows: 1,
  cols: 3,
  difficulty: "EASY",
  kind: "NORMAL",
  start: { row: 0, col: 0 },
  cells: [
    { row: 0, col: 0, type: "ARROW", direction: "LEFT" },
    { row: 0, col: 1, type: "WALL" },
    { row: 0, col: 2, type: "EXIT" }
  ]
});

describe("LevelDirector", () => {
  it("should_build_a_playable_normal_level_when_template_is_valid_and_solvable", () => {
    const built = makeDirector().construct(new TutorialLevelStrategy());

    expect(built.level).toBeInstanceOf(NormalLevel);
    // optimal route (0,0)->(0,1)->(0,2) costs 2 moves, computed by PathfindingService.
    expect(built.optimalMoves).toBe(2);

    built.level.move(Position.of(0, 1));
    built.level.move(Position.of(0, 2));
    expect(built.level.evaluate().isWon()).toBe(true);
  });

  it("should_build_a_timed_level_when_json_definition_requests_one", () => {
    const built = makeDirector().construct(new JsonLevelStrategy(solvableTimedJson));

    expect(built.level).toBeInstanceOf(TimedLevel);
    expect(built.optimalMoves).toBe(3);
  });

  it("should_fail_with_application_error_when_level_has_no_start_to_exit_path", () => {
    const director = makeDirector();

    expect(() => director.construct(new JsonLevelStrategy(unsolvableJson))).toThrow(UnsolvableLevelError);
  });

  it("should_fail_with_application_error_when_json_is_malformed", () => {
    const director = makeDirector();

    expect(() => director.construct(new JsonLevelStrategy("{ not json"))).toThrow(InvalidLevelDefinitionError);
  });

  it("should_fail_when_a_strategy_requests_a_timed_level_without_a_time_limit", () => {
    const timedWithoutLimit: ILevelStrategy = {
      createDefinition(): LevelDefinition {
        return {
          template: LevelTemplate.create({
            id: "timed-no-limit",
            rows: 1,
            cols: 2,
            difficulty: Difficulty.Easy,
            cells: [
              CellSpec.of(Position.of(0, 0), CellType.Arrow, Direction.Right),
              CellSpec.of(Position.of(0, 1), CellType.Exit)
            ]
          }),
          start: Position.of(0, 0),
          kind: LevelKind.Timed
        };
      }
    };

    expect(() => makeDirector().construct(timedWithoutLimit)).toThrow(InvalidLevelDefinitionError);
  });
});
