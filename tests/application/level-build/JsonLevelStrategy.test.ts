import { CellType } from "@/domain/value-objects/CellType";
import { Position } from "@/domain/value-objects/Position";
import { InvalidLevelDefinitionError, JsonLevelStrategy, LevelKind } from "@/application/level-build";

const validNormal = {
  id: "json-normal",
  rows: 2,
  cols: 3,
  difficulty: "EASY",
  kind: "NORMAL",
  start: { row: 0, col: 0 },
  cells: [
    { row: 0, col: 0, type: "ARROW", direction: "RIGHT" },
    { row: 0, col: 1, type: "EMPTY" },
    { row: 0, col: 2, type: "EMPTY" },
    { row: 1, col: 1, type: "WALL" },
    { row: 1, col: 2, type: "EXIT" }
  ]
};

describe("JsonLevelStrategy", () => {
  it("should_map_valid_json_to_a_level_definition", () => {
    const definition = new JsonLevelStrategy(JSON.stringify(validNormal)).createDefinition();

    expect(definition.kind).toBe(LevelKind.Normal);
    expect(definition.template.id).toBe("json-normal");
    expect(definition.template.cells).toHaveLength(5);
    expect(definition.start.equals(Position.of(0, 0))).toBe(true);
    expect(definition.template.cellAt(Position.of(0, 0))?.type).toBe(CellType.Arrow);
  });

  it("should_reject_unknown_cell_type", () => {
    const broken = { ...validNormal, cells: [{ row: 0, col: 0, type: "LAVA" }] };

    expect(() => new JsonLevelStrategy(JSON.stringify(broken)).createDefinition()).toThrow(
      InvalidLevelDefinitionError
    );
  });

  it("should_reject_arrow_cell_without_direction", () => {
    const broken = { ...validNormal, cells: [{ row: 0, col: 0, type: "ARROW" }] };

    expect(() => new JsonLevelStrategy(JSON.stringify(broken)).createDefinition()).toThrow(
      InvalidLevelDefinitionError
    );
  });

  it("should_reject_timed_kind_without_time_limit", () => {
    const broken = { ...validNormal, kind: "TIMED" };

    expect(() => new JsonLevelStrategy(JSON.stringify(broken)).createDefinition()).toThrow(
      InvalidLevelDefinitionError
    );
  });

  it("should_reject_a_cell_outside_the_board", () => {
    const broken = { ...validNormal, cells: [{ row: 9, col: 9, type: "EXIT" }] };

    expect(() => new JsonLevelStrategy(JSON.stringify(broken)).createDefinition()).toThrow(
      InvalidLevelDefinitionError
    );
  });

  it("should_reject_when_cells_is_not_an_array", () => {
    const broken = { ...validNormal, cells: "nope" };

    expect(() => new JsonLevelStrategy(JSON.stringify(broken)).createDefinition()).toThrow(
      InvalidLevelDefinitionError
    );
  });

  it("should_reject_when_start_is_not_an_object", () => {
    const broken = { ...validNormal, start: 5 };

    expect(() => new JsonLevelStrategy(JSON.stringify(broken)).createDefinition()).toThrow(
      InvalidLevelDefinitionError
    );
  });

  it("should_reject_when_a_dimension_is_not_an_integer", () => {
    const broken = { ...validNormal, rows: 2.5 };

    expect(() => new JsonLevelStrategy(JSON.stringify(broken)).createDefinition()).toThrow(
      InvalidLevelDefinitionError
    );
  });

  it("should_reject_when_top_level_payload_is_not_an_object", () => {
    expect(() => new JsonLevelStrategy("42").createDefinition()).toThrow(InvalidLevelDefinitionError);
  });
});
