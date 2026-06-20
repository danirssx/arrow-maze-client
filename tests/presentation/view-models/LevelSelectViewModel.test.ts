import { manualLevels } from "@/application/level-build/fixtures";
import type { ILevelCatalogRepository, LevelCatalogSummary } from "@/application/ports/ILevelCatalogRepository";
import { LevelSelectViewModel } from "@/presentation/view-models/LevelSelectViewModel";

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

    expect(timed).toContain("manual-007-rush");
  });

  it("should_resolve_definition_for_a_known_level", () => {
    expect(new LevelSelectViewModel().getDefinition("manual-001-first-knot")).toBeDefined();
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
});
