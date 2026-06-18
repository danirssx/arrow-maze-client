import { manualLevels } from "@/application/level-build/fixtures";
import { LevelSelectViewModel } from "@/presentation/view-models/LevelSelectViewModel";

// Subject to human review — presentation ViewModel test

describe("LevelSelectViewModel", () => {
  it("should_expose_every_manual_level_in_order", () => {
    const levels = new LevelSelectViewModel().getLevels();

    expect(levels).toHaveLength(manualLevels.length);
    expect(levels.map((level) => level.order)).toEqual(manualLevels.map((level) => level.order));
  });

  it("should_flag_timed_levels", () => {
    const levels = new LevelSelectViewModel().getLevels();
    const timed = levels.filter((level) => level.timed).map((level) => level.id);

    expect(timed).toContain("manual-007-medium-timer");
  });

  it("should_resolve_definition_for_known_level", () => {
    const viewModel = new LevelSelectViewModel();

    expect(viewModel.getDefinition("manual-001-first-turn")).toBeDefined();
  });

  it("should_return_undefined_for_unknown_level", () => {
    const viewModel = new LevelSelectViewModel();

    expect(viewModel.getDefinition("nope")).toBeUndefined();
  });
});
