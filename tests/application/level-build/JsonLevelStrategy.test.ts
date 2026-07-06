import { ConcreteLevelBuilder } from "@/application/level-build/ConcreteLevelBuilder";
import { JsonLevelStrategy } from "@/application/level-build/JsonLevelStrategy";
import { LevelDirector } from "@/application/level-build/LevelDirector";
import { InvalidLevelDefinitionError } from "@/application/level-build/errors";
import { Difficulty } from "@/domain/value-objects/Difficulty";

const validJson = JSON.stringify({
  id: "json-1",
  difficulty: Difficulty.Easy,
  kind: "NORMAL",
  attempts: 4,
  arrows: [
    { id: "a", color: "blue", direction: "RIGHT", path: [{ row: 0, col: 0 }, { row: 0, col: 1 }] },
    { id: "b", color: "green", direction: "UP", path: [{ row: 0, col: 2 }] }
  ]
});

describe("JsonLevelStrategy", () => {
  it("should_parse_a_valid_arrow_level", () => {
    const definition = new JsonLevelStrategy(validJson).createDefinition();

    expect(definition.id).toBe("json-1");
    expect(definition.arrows).toHaveLength(2);
    expect(definition.attempts).toBe(4);
  });

  it("should_build_a_playable_level_from_the_parsed_definition", () => {
    const built = new LevelDirector(new ConcreteLevelBuilder()).construct(new JsonLevelStrategy(validJson));

    expect(built.level.activeArrowCount).toBe(2);
  });

  it("should_throw_on_invalid_json", () => {
    expect(() => new JsonLevelStrategy("{not json").createDefinition()).toThrow(InvalidLevelDefinitionError);
  });

  it("should_throw_on_an_unknown_direction", () => {
    const bad = JSON.stringify({
      id: "x",
      difficulty: Difficulty.Easy,
      kind: "NORMAL",
      arrows: [{ id: "a", color: "blue", direction: "DIAGONAL", path: [{ row: 0, col: 0 }] }]
    });

    expect(() => new JsonLevelStrategy(bad).createDefinition()).toThrow(InvalidLevelDefinitionError);
  });

  it("should_throw_on_a_disconnected_arrow_path", () => {
    const bad = JSON.stringify({
      id: "x",
      difficulty: Difficulty.Easy,
      kind: "NORMAL",
      arrows: [{ id: "a", color: "blue", direction: "RIGHT", path: [{ row: 0, col: 0 }, { row: 0, col: 2 }] }]
    });

    expect(() => new JsonLevelStrategy(bad).createDefinition()).toThrow(InvalidLevelDefinitionError);
  });

  describe("boardShape (Option A)", () => {
    const shapedJson = JSON.stringify({
      id: "shaped-1",
      difficulty: Difficulty.Easy,
      kind: "NORMAL",
      attempts: 4,
      arrows: [
        { id: "a", color: "blue", direction: "RIGHT", path: [{ row: 0, col: 0 }, { row: 0, col: 1 }] },
        { id: "b", color: "green", direction: "UP", path: [{ row: 0, col: 2 }] }
      ],
      boardShape: {
        type: "CELL_MASK",
        cells: [
          { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
          { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }
        ]
      }
    });

    const withShape = (boardShape: unknown) =>
      JSON.stringify({
        id: "x",
        difficulty: Difficulty.Easy,
        kind: "NORMAL",
        arrows: [{ id: "a", color: "blue", direction: "UP", path: [{ row: 0, col: 0 }] }],
        boardShape
      });

    it("should_parse_a_valid_board_shape", () => {
      const definition = new JsonLevelStrategy(shapedJson).createDefinition();
      expect(definition.boardShape).toBeDefined();
      expect(definition.boardShape!.type).toBe("CELL_MASK");
      expect(definition.boardShape!.cells).toHaveLength(6);
    });

    it("should_build_a_playable_level_from_a_shaped_definition", () => {
      const built = new LevelDirector(new ConcreteLevelBuilder()).construct(
        new JsonLevelStrategy(shapedJson)
      );
      expect(built.level.activeArrowCount).toBe(2);
    });

    it("should_omit_board_shape_when_absent", () => {
      const definition = new JsonLevelStrategy(validJson).createDefinition();
      expect(definition.boardShape).toBeUndefined();
    });

    it("should_throw_when_board_shape_has_duplicate_cells", () => {
      const bad = withShape({ type: "CELL_MASK", cells: [{ row: 0, col: 0 }, { row: 0, col: 0 }] });
      expect(() => new JsonLevelStrategy(bad).createDefinition()).toThrow(InvalidLevelDefinitionError);
    });

    it("should_throw_when_an_arrow_cell_is_outside_the_mask", () => {
      const bad = withShape({ type: "CELL_MASK", cells: [{ row: 5, col: 5 }] });
      expect(() => new JsonLevelStrategy(bad).createDefinition()).toThrow(InvalidLevelDefinitionError);
    });

    it("should_throw_when_board_shape_type_is_not_cell_mask", () => {
      const bad = withShape({ type: "HEXAGON", cells: [{ row: 0, col: 0 }] });
      expect(() => new JsonLevelStrategy(bad).createDefinition()).toThrow(InvalidLevelDefinitionError);
    });

    it("should_throw_when_board_shape_exceeds_the_maximum_cells", () => {
      const cells = Array.from({ length: 601 }, (_, i) => ({ row: 0, col: i }));
      const bad = withShape({ type: "CELL_MASK", cells });
      expect(() => new JsonLevelStrategy(bad).createDefinition()).toThrow(InvalidLevelDefinitionError);
    });

    it("should_throw_when_board_shape_cells_is_empty", () => {
      const bad = withShape({ type: "CELL_MASK", cells: [] });
      expect(() => new JsonLevelStrategy(bad).createDefinition()).toThrow(InvalidLevelDefinitionError);
    });
  });
});
