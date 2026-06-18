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
});
