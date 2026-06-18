import { ConcreteLevelBuilder, LevelDirector, LevelKind } from "@/application/level-build";
import type { ILevelStrategy, LevelDefinition } from "@/application/level-build";
import { manualLevels } from "@/application/level-build/fixtures";
import { NormalLevel, TimedLevel } from "@/domain/level";

function strategyFor(definition: LevelDefinition): ILevelStrategy {
  return { createDefinition: () => definition };
}

describe("LevelDirector over manual level fixtures", () => {
  it.each(manualLevels)(
    "should_build_a_solvable_level_with_expected_optimal_moves_for_$id",
    (fixture) => {
      const director = new LevelDirector(new ConcreteLevelBuilder());

      const built = director.construct(strategyFor(fixture.definition));

      expect(built.optimalMoves).toBe(fixture.expectedOptimalMoves);
    }
  );

  it.each(manualLevels)("should_build_the_concrete_level_kind_declared_by_$id", (fixture) => {
    const director = new LevelDirector(new ConcreteLevelBuilder());

    const built = director.construct(strategyFor(fixture.definition));

    if (fixture.definition.kind === LevelKind.Timed) {
      expect(built.level).toBeInstanceOf(TimedLevel);
    } else {
      expect(built.level).toBeInstanceOf(NormalLevel);
    }
  });
});
