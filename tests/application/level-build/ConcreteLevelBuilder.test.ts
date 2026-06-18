import { ConcreteLevelBuilder } from "@/application/level-build/ConcreteLevelBuilder";
import { InvalidLevelDefinitionError, LevelBuildStateError } from "@/application/level-build/errors";
import { ArrowSpec } from "@/domain/value-objects/ArrowSpec";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

const arrow = (id: string, cells: [number, number][], direction: Direction): ArrowSpec =>
  ArrowSpec.of(id, "blue", cells.map(([row, col]) => Position.of(row, col)), direction);

describe("ConcreteLevelBuilder", () => {
  it("should_build_a_normal_level_with_default_attempts", () => {
    const built = new ConcreteLevelBuilder()
      .withId("L")
      .withArrows([arrow("a", [[0, 0], [0, 1]], Direction.Right)])
      .asNormal()
      .build();

    expect(built.level.id).toBe("L");
    expect(built.level.activeArrowCount).toBe(1);
    expect(built.level.attemptsRemaining).toBe(5);
  });

  it("should_use_the_provided_attempts_budget", () => {
    const built = new ConcreteLevelBuilder()
      .withId("L")
      .withArrows([arrow("a", [[0, 0]], Direction.Up)])
      .withAttempts(3)
      .asNormal()
      .build();

    expect(built.level.attemptsRemaining).toBe(3);
  });

  it("should_build_a_timed_level", () => {
    const built = new ConcreteLevelBuilder()
      .withId("T")
      .withArrows([arrow("a", [[0, 0]], Direction.Up)])
      .asTimed(30)
      .build();

    expect(built.level.activeArrowCount).toBe(1);
  });

  it("should_throw_when_no_arrows_are_provided", () => {
    expect(() => new ConcreteLevelBuilder().withId("L").withArrows([]).asNormal().build()).toThrow(
      InvalidLevelDefinitionError
    );
  });

  it("should_throw_when_arrow_ids_are_duplicated", () => {
    const arrows = [arrow("a", [[0, 0]], Direction.Up), arrow("a", [[1, 1]], Direction.Up)];

    expect(() => new ConcreteLevelBuilder().withId("L").withArrows(arrows).asNormal().build()).toThrow(
      InvalidLevelDefinitionError
    );
  });

  it("should_throw_when_built_before_setup", () => {
    expect(() => new ConcreteLevelBuilder().build()).toThrow(LevelBuildStateError);
  });
});
