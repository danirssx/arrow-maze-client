import { mapBoardSnapshot } from "@/application/dto/BoardSnapshotMapper";
import { LevelKind } from "@/application/level-build/LevelDefinition";
import { manualLevels } from "@/application/level-build/fixtures";
import { ArrowSpec } from "@/domain/value-objects/ArrowSpec";
import { Difficulty } from "@/domain/value-objects/Difficulty";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

describe("mapBoardSnapshot", () => {
  it("should_map_arrows_with_head_direction_and_bounds", () => {
    const definition = {
      id: "x",
      difficulty: Difficulty.Easy,
      kind: LevelKind.Normal,
      arrows: [ArrowSpec.of("a", "blue", [Position.of(0, 0), Position.of(0, 1)], Direction.Right)]
    };

    const snapshot = mapBoardSnapshot(definition);

    expect(snapshot.arrows).toHaveLength(1);
    expect(snapshot.arrows[0]!.id).toBe("a");
    expect(snapshot.arrows[0]!.direction).toBe("RIGHT");
    expect(snapshot.arrows[0]!.head).toEqual({ row: 0, column: 1 });
    expect(snapshot.bounds).toEqual({ minRow: 0, minCol: 0, maxRow: 0, maxCol: 1 });
  });

  it("should_map_3d_arrow_coordinates_and_depth_bounds_when_definition_is_volumetric", () => {
    const definition = {
      id: "volumetric",
      difficulty: Difficulty.Hard,
      kind: LevelKind.Normal,
      dimensions: 3 as const,
      arrows: [
        ArrowSpec.of(
          "depth",
          "cyan",
          [Position.of(0, 0, 0), Position.of(0, 0, 1), Position.of(0, 0, 2)],
          Direction.Forward
        )
      ]
    };

    const snapshot = mapBoardSnapshot(definition);

    expect(snapshot.arrows[0]!.cells).toEqual([
      { row: 0, column: 0, z: 0 },
      { row: 0, column: 0, z: 1 },
      { row: 0, column: 0, z: 2 }
    ]);
    expect(snapshot.arrows[0]!.head).toEqual({ row: 0, column: 0, z: 2 });
    expect(snapshot.bounds).toEqual({ minRow: 0, minCol: 0, maxRow: 0, maxCol: 0, minZ: 0, maxZ: 2 });
  });

  it("should_infer_depth_coordinates_when_any_arrow_cell_has_nonzero_z", () => {
    const definition = {
      id: "implicit-3d",
      difficulty: Difficulty.Hard,
      kind: LevelKind.Normal,
      arrows: [
        ArrowSpec.of(
          "mixed",
          "purple",
          [Position.of(0, 0), Position.of(0, 1), Position.of(0, 1, 1)],
          Direction.Forward
        ),
        ArrowSpec.of("flat", "blue", [Position.of(1, 0), Position.of(1, 1)], Direction.Right)
      ]
    };

    const snapshot = mapBoardSnapshot(definition);

    expect(snapshot.arrows[0]!.cells[0]).toEqual({ row: 0, column: 0, z: 0 });
    expect(snapshot.arrows[0]!.head).toEqual({ row: 0, column: 1, z: 1 });
    expect(snapshot.arrows[1]!.cells[0]).toEqual({ row: 1, column: 0, z: 0 });
    expect(snapshot.bounds).toEqual({ minRow: 0, minCol: 0, maxRow: 1, maxCol: 1, minZ: 0, maxZ: 1 });
  });

  it("should_keep_zero_depth_coordinates_when_dimensions_explicitly_mark_a_3d_slab", () => {
    const definition = {
      id: "zero-depth-slab",
      difficulty: Difficulty.Hard,
      kind: LevelKind.Normal,
      dimensions: 3 as const,
      arrows: [ArrowSpec.of("flat3d", "teal", [Position.of(0, 0), Position.of(0, 1)], Direction.Right)]
    };

    const snapshot = mapBoardSnapshot(definition);

    expect(snapshot.arrows[0]!.cells).toEqual([
      { row: 0, column: 0, z: 0 },
      { row: 0, column: 1, z: 0 }
    ]);
    expect(snapshot.bounds).toEqual({ minRow: 0, minCol: 0, maxRow: 0, maxCol: 1, minZ: 0, maxZ: 0 });
  });

  it("should_map_a_manual_level_definition", () => {
    const fixture = manualLevels[0]!;

    const snapshot = mapBoardSnapshot(fixture.definition);

    expect(snapshot.arrows).toHaveLength(fixture.arrowCount);
    expect(snapshot.bounds).not.toBeNull();
  });

  it("should_include_board_shape_cells_and_union_bounds", () => {
    const definition = {
      id: "shaped",
      difficulty: Difficulty.Easy,
      kind: LevelKind.Normal,
      arrows: [ArrowSpec.of("a", "blue", [Position.of(0, 0), Position.of(0, 1)], Direction.Right)],
      boardShape: {
        type: "CELL_MASK" as const,
        cells: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 2, col: 3 }
        ]
      }
    };

    const snapshot = mapBoardSnapshot(definition);

    expect(snapshot.boardShape).toBeDefined();
    expect(snapshot.boardShape).toHaveLength(3);
    expect(snapshot.boardShape![0]).toEqual({ row: 0, column: 0 });
    // bounds frame the union of arrow cells (0,0)-(0,1) and shape cell (2,3)
    expect(snapshot.bounds).toEqual({ minRow: 0, minCol: 0, maxRow: 2, maxCol: 3 });
  });

  it("should_include_board_shape_depth_cells_and_depth_bounds", () => {
    const definition = {
      id: "shaped-3d",
      difficulty: Difficulty.Hard,
      kind: LevelKind.Normal,
      arrows: [ArrowSpec.of("a", "blue", [Position.of(0, 0), Position.of(0, 1)], Direction.Right)],
      boardShape: {
        type: "CELL_MASK" as const,
        cells: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 1, col: 1, z: 2 }
        ]
      }
    };

    const snapshot = mapBoardSnapshot(definition);

    expect(snapshot.boardShape).toEqual([
      { row: 0, column: 0, z: 0 },
      { row: 0, column: 1, z: 0 },
      { row: 1, column: 1, z: 2 }
    ]);
    expect(snapshot.arrows[0]!.cells[0]).toEqual({ row: 0, column: 0, z: 0 });
    expect(snapshot.bounds).toEqual({ minRow: 0, minCol: 0, maxRow: 1, maxCol: 1, minZ: 0, maxZ: 2 });
  });

  it("should_omit_board_shape_when_definition_has_none", () => {
    const definition = {
      id: "x",
      difficulty: Difficulty.Easy,
      kind: LevelKind.Normal,
      arrows: [ArrowSpec.of("a", "blue", [Position.of(0, 0)], Direction.Up)]
    };

    const snapshot = mapBoardSnapshot(definition);

    expect(snapshot.boardShape).toBeUndefined();
  });

  it("should_return_null_bounds_when_definition_has_no_visible_cells", () => {
    const definition = {
      id: "empty",
      difficulty: Difficulty.Easy,
      kind: LevelKind.Normal,
      arrows: []
    };

    const snapshot = mapBoardSnapshot(definition);

    expect(snapshot.arrows).toEqual([]);
    expect(snapshot.bounds).toBeNull();
  });
});
