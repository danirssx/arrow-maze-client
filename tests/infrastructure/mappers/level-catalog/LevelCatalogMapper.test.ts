import type { LevelDetailDto, LevelSummaryDto } from "@/infrastructure/mappers/level-catalog/LevelCatalogDtos";
import { LevelCatalogMapper } from "@/infrastructure/mappers/level-catalog/LevelCatalogMapper";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

const detail = (definition: LevelDetailDto["definition"], extra: Partial<LevelDetailDto> = {}): LevelDetailDto => ({
  levelId: "lvl-1",
  name: "Level 1",
  description: "",
  difficulty: "EASY",
  status: "PUBLISHED",
  version: 1,
  definition,
  createdAt: "2026-07-13T00:00:00.000Z",
  updatedAt: "2026-07-13T00:00:00.000Z",
  ...extra,
});

describe("LevelCatalogMapper.toDefinition", () => {
  it("should_default_depth_to_zero_when_arrow_path_omits_z", () => {
    const dto = detail({
      attempts: 5,
      arrows: [{ id: "a", color: "blue", path: [{ row: 0, col: 0 }, { row: 0, col: 1 }], direction: "RIGHT" }],
    });

    const def = LevelCatalogMapper.toDefinition(dto);

    expect(def.arrows[0]?.cells[0]?.equals(Position.of(0, 0, 0))).toBe(true);
  });

  it("should_parse_explicit_depth_when_arrow_path_includes_z", () => {
    const dto = detail({
      attempts: 5,
      arrows: [
        { id: "a", color: "blue", path: [{ row: 0, col: 0, z: 1 }, { row: 0, col: 0, z: 2 }], direction: "FORWARD" },
      ],
    });

    const def = LevelCatalogMapper.toDefinition(dto);

    expect(def.arrows[0]?.cells[1]?.equals(Position.of(0, 0, 2))).toBe(true);
  });

  it("should_map_the_depth_axis_direction", () => {
    const dto = detail({
      attempts: 5,
      arrows: [{ id: "a", color: "blue", path: [{ row: 0, col: 0, z: 0 }], direction: "FORWARD" }],
    });

    const def = LevelCatalogMapper.toDefinition(dto);

    expect(def.arrows[0]?.direction).toBe(Direction.Forward);
  });

  it("should_default_dimensions_to_two_when_absent", () => {
    const dto = detail({
      attempts: 5,
      arrows: [{ id: "a", color: "blue", path: [{ row: 0, col: 0 }], direction: "UP" }],
    });

    const def = LevelCatalogMapper.toDefinition(dto);

    expect(def.dimensions).toBe(2);
  });

  it("should_surface_three_dimensions_when_present", () => {
    const dto = detail(
      { attempts: 5, arrows: [{ id: "a", color: "blue", path: [{ row: 0, col: 0 }], direction: "UP" }] },
      { dimensions: 3 }
    );

    const def = LevelCatalogMapper.toDefinition(dto);

    expect(def.dimensions).toBe(3);
  });

  it("should_build_a_timed_level_when_a_time_limit_is_present", () => {
    const dto = detail(
      { attempts: 3, arrows: [{ id: "a", color: "blue", path: [{ row: 0, col: 0 }], direction: "UP" }] },
      { timeLimitSeconds: 90 }
    );

    const def = LevelCatalogMapper.toDefinition(dto);

    expect(def.kind).toBe("TIMED");
    expect(def.timeLimitSeconds).toBe(90);
  });

  it("should_build_a_normal_level_without_a_time_limit_when_absent", () => {
    const dto = detail({
      attempts: 3,
      arrows: [{ id: "a", color: "blue", path: [{ row: 0, col: 0 }], direction: "UP" }],
    });

    const def = LevelCatalogMapper.toDefinition(dto);

    expect(def.kind).toBe("NORMAL");
    expect(def.timeLimitSeconds).toBeUndefined();
  });

  it("should_parse_depth_on_board_shape_cells", () => {
    const dto = detail({
      attempts: 5,
      arrows: [{ id: "a", color: "blue", path: [{ row: 0, col: 0, z: 1 }], direction: "UP" }],
      boardShape: { type: "CELL_MASK", cells: [{ row: 0, col: 0, z: 1 }] },
    });

    const def = LevelCatalogMapper.toDefinition(dto);

    expect(def.boardShape?.cells[0]?.z).toBe(1);
  });
});

describe("LevelCatalogMapper.toSummary", () => {
  const summaryDto = (extra: Partial<LevelSummaryDto> = {}): LevelSummaryDto => ({
    levelId: "lvl-1",
    name: "Level 1",
    difficulty: "MEDIUM",
    arrowCount: 12,
    attempts: 5,
    createdAt: "2026-07-13T00:00:00.000Z",
    ...extra,
  });

  it("should_map_core_summary_fields", () => {
    const summary = LevelCatalogMapper.toSummary(summaryDto());

    expect(summary.levelId).toBe("lvl-1");
    expect(summary.name).toBe("Level 1");
    expect(summary.difficulty).toBe("MEDIUM");
    expect(summary.arrowCount).toBe(12);
    expect(summary.attempts).toBe(5);
  });

  it("should_include_time_limit_on_summary_when_present", () => {
    const summary = LevelCatalogMapper.toSummary(summaryDto({ timeLimitSeconds: 120 }));

    expect(summary.timeLimitSeconds).toBe(120);
  });

  it("should_omit_time_limit_on_summary_when_absent", () => {
    const summary = LevelCatalogMapper.toSummary(summaryDto());

    expect(summary.timeLimitSeconds).toBeUndefined();
  });
});
