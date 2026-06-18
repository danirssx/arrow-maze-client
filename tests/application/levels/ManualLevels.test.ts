import { ConcreteLevelBuilder, LevelDirector, LevelKind } from "@/application/level-build";
import { manualLevels } from "@/application/level-build/fixtures";
import { CellType } from "@/domain/value-objects/CellType";
import { Difficulty } from "@/domain/value-objects/Difficulty";

const difficultyWeight = {
  [Difficulty.Easy]: 1,
  [Difficulty.Medium]: 2,
  [Difficulty.Hard]: 3
} as const;

function progressionScore(index: number): number {
  const level = manualLevels[index];
  if (level === undefined) {
    throw new Error(`Missing manual level at index ${index}.`);
  }
  const { template, kind, timeLimitSeconds } = level.definition;
  const walls = template.cells.filter((cell) => cell.type === CellType.Wall).length;
  const timedBonus = kind === LevelKind.Timed ? Math.max(1, Math.floor((120 - (timeLimitSeconds ?? 120)) / 10)) : 0;

  return (
    difficultyWeight[template.difficulty] * 1000 +
    template.rows * template.cols +
    level.expectedOptimalMoves * 20 +
    walls * 5 +
    timedBonus
  );
}

describe("manualLevels fixtures", () => {
  it("should_define_exactly_15_unique_manual_levels_when_loaded", () => {
    const ids = manualLevels.map((level) => level.id);

    expect(manualLevels).toHaveLength(15);
    expect(new Set(ids).size).toBe(15);
    expect(manualLevels.map((level) => level.order)).toEqual([...Array.from({ length: 15 }, (_, index) => index + 1)]);
  });

  it("should_build_every_manual_level_when_validated_by_level_director", () => {
    const director = new LevelDirector(new ConcreteLevelBuilder());

    for (const fixture of manualLevels) {
      const built = director.construct({
        createDefinition: () => fixture.definition
      });

      expect(built.optimalMoves).toBe(fixture.expectedOptimalMoves);
      expect(built.level.position.equals(fixture.definition.start)).toBe(true);
    }
  });

  it("should_include_start_exit_time_limit_version_and_expected_optimal_moves_when_declared", () => {
    for (const fixture of manualLevels) {
      const { template, kind, timeLimitSeconds } = fixture.definition;
      const exitCount = template.cells.filter((cell) => cell.type === CellType.Exit).length;

      expect(fixture.version).toBeGreaterThanOrEqual(1);
      expect(fixture.expectedOptimalMoves).toBeGreaterThan(0);
      expect(template.cellAt(fixture.definition.start)).toBeDefined();
      expect(exitCount).toBe(1);

      if (kind === LevelKind.Timed) {
        expect(timeLimitSeconds).toBeGreaterThan(0);
      } else {
        expect(timeLimitSeconds).toBeUndefined();
      }
    }
  });

  it("should_increase_difficulty_progressively_when_levels_are_ordered", () => {
    for (let index = 1; index < manualLevels.length; index += 1) {
      expect(progressionScore(index)).toBeGreaterThanOrEqual(progressionScore(index - 1));
    }
  });
});
