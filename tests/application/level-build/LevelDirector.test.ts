import { ConcreteLevelBuilder } from "@/application/level-build/ConcreteLevelBuilder";
import { LevelDirector } from "@/application/level-build/LevelDirector";
import { LevelKind } from "@/application/level-build/LevelDefinition";
import { TutorialLevelStrategy } from "@/application/level-build/TutorialLevelStrategy";
import { InvalidLevelDefinitionError } from "@/application/level-build/errors";
import type { ILevelStrategy } from "@/application/level-build/ILevelStrategy";
import { ArrowSpec } from "@/domain/value-objects/ArrowSpec";
import { Difficulty } from "@/domain/value-objects/Difficulty";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

describe("LevelDirector", () => {
  it("should_construct_the_tutorial_level", () => {
    const director = new LevelDirector(new ConcreteLevelBuilder());

    const built = director.construct(new TutorialLevelStrategy());

    expect(built.level.id).toBe("tutorial-1");
    expect(built.level.activeArrowCount).toBe(2);
  });

  it("should_throw_when_a_timed_definition_lacks_a_time_limit", () => {
    const strategy: ILevelStrategy = {
      createDefinition: () => ({
        id: "bad-timed",
        difficulty: Difficulty.Easy,
        arrows: [ArrowSpec.of("a", "blue", [Position.of(0, 0)], Direction.Up)],
        kind: LevelKind.Timed
      })
    };
    const director = new LevelDirector(new ConcreteLevelBuilder());

    expect(() => director.construct(strategy)).toThrow(InvalidLevelDefinitionError);
  });
});
