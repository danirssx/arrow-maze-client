import { manualLevels } from "@/application/level-build/fixtures";
import type { ILevelCatalogRepository, LevelCatalogSummary } from "@/application/ports/ILevelCatalogRepository";
import { LevelSelectViewModel } from "@/presentation/view-models/LevelSelectViewModel";
import { isUuid } from "@/shared/isUuid";

// Subject to human review — presentation ViewModel test

class FakeLevelCatalogRepository implements ILevelCatalogRepository {
  levels: LevelCatalogSummary[] = [
    {
      levelId: "550e8400-e29b-41d4-a716-446655440010",
      name: "First Knot",
      difficulty: "EASY",
      arrowCount: 2,
      attempts: 5,
    },
    {
      levelId: "550e8400-e29b-41d4-a716-446655440011",
      name: "Timed Knot",
      difficulty: "MEDIUM",
      arrowCount: 5,
      attempts: 5,
      timeLimitSeconds: 75,
    },
  ];

  async getLevels(): Promise<readonly LevelCatalogSummary[]> {
    return this.levels;
  }

  async getLevelDefinition(): Promise<typeof manualLevels[number]["definition"]> {
    return manualLevels[0]!.definition;
  }
}

describe("LevelSelectViewModel", () => {
  it("should_expose_every_manual_level_in_order", () => {
    const levels = new LevelSelectViewModel().getLevels();

    expect(levels).toHaveLength(manualLevels.length);
    expect(levels.map((level) => level.order)).toEqual(manualLevels.map((level) => level.order));
  });

  it("should_flag_timed_levels", () => {
    const timed = new LevelSelectViewModel()
      .getLevels()
      .filter((level) => level.timed)
      .map((level) => level.id);

    expect(timed).toContain("550e8400-e29b-41d4-a716-446655440016");
  });

  it("should_expose_only_uuid_level_ids", () => {
    const levels = new LevelSelectViewModel().getLevels();

    for (const level of levels) {
      expect(isUuid(level.id)).toBe(true);
    }
    for (const fixture of manualLevels) {
      expect(isUuid(fixture.definition.id)).toBe(true);
    }
  });

  it("should_resolve_definition_for_a_known_level", () => {
    expect(new LevelSelectViewModel().getDefinition("550e8400-e29b-41d4-a716-446655440010")).toBeDefined();
  });

  it("should_return_undefined_for_an_unknown_level", () => {
    expect(new LevelSelectViewModel().getDefinition("nope")).toBeUndefined();
  });

  it("should_load_remote_levels_when_repository_is_configured", async () => {
    const levels = await new LevelSelectViewModel(new FakeLevelCatalogRepository()).loadLevels();
    expect(levels.map((level) => level.id)).toEqual([
      "550e8400-e29b-41d4-a716-446655440010",
      "550e8400-e29b-41d4-a716-446655440011",
    ]);
    expect(levels[1]?.timed).toBe(true);
  });

  it("should_expose_ready_to_consume_difficulty_fields", async () => {
    const levels = await new LevelSelectViewModel(new FakeLevelCatalogRepository()).loadLevels();

    expect(levels[0]).toMatchObject({ difficultyStars: 1, difficultyLabel: "Easy" });
    expect(levels[1]).toMatchObject({ difficultyStars: 2, difficultyLabel: "Medium" });
    for (const level of levels) {
      expect(level.difficultyStars).toBeGreaterThanOrEqual(1);
      expect(level.difficultyStars).toBeLessThanOrEqual(3);
    }
  });

  it("should_map_manual_levels_to_star_ratings", () => {
    const levels = new LevelSelectViewModel().getLevels();

    for (const level of levels) {
      expect(level.difficultyStars).toBeGreaterThanOrEqual(1);
      expect(level.difficultyStars).toBeLessThanOrEqual(3);
      expect(typeof level.difficultyLabel).toBe("string");
    }
  });

  it("should_expose_a_human_readable_name_for_each_offline_level", () => {
    const levels = new LevelSelectViewModel().getLevels();

    for (const level of levels) {
      expect(typeof level.name).toBe("string");
      expect(level.name.length).toBeGreaterThan(0);
    }
  });

  it("should_expose_the_remote_level_name", async () => {
    const levels = await new LevelSelectViewModel(new FakeLevelCatalogRepository()).loadLevels();

    expect(levels[0]?.name).toBe("First Knot");
    expect(levels[1]?.name).toBe("Timed Knot");
  });
});
