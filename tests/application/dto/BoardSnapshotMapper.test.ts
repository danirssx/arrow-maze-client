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
});
