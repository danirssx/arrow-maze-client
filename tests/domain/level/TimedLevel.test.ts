import { DefeatReason, InvalidTimeLimitError, TimedLevel } from "@/domain/level";
import { CellSpec } from "@/domain/value-objects/CellSpec";
import { CellType } from "@/domain/value-objects/CellType";
import { Difficulty } from "@/domain/value-objects/Difficulty";
import { Direction } from "@/domain/value-objects/Direction";
import { LevelTemplate } from "@/domain/value-objects/LevelTemplate";
import { Position } from "@/domain/value-objects/Position";

function buildSolvableTemplate(): LevelTemplate {
  return LevelTemplate.create({
    id: "level-timed",
    rows: 2,
    cols: 3,
    difficulty: Difficulty.Medium,
    cells: [
      CellSpec.of(Position.of(0, 0), CellType.Arrow, Direction.Right),
      CellSpec.of(Position.of(0, 1), CellType.Empty),
      CellSpec.of(Position.of(0, 2), CellType.Empty),
      CellSpec.of(Position.of(1, 1), CellType.Wall),
      CellSpec.of(Position.of(1, 2), CellType.Exit)
    ]
  });
}

/** Mutable fake clock so elapsed time is fully deterministic. */
function fakeClock(start: number): { now: () => number; advanceSeconds: (seconds: number) => void } {
  let current = start;
  return {
    now: () => current,
    advanceSeconds: (seconds: number) => {
      current += seconds * 1000;
    }
  };
}

describe("TimedLevel", () => {
  it("should_produce_defeat_by_time_when_limit_is_reached_before_exit", () => {
    const clock = fakeClock(1_000);
    const level = new TimedLevel(buildSolvableTemplate(), Position.of(0, 0), 10, { clock: clock.now });

    clock.advanceSeconds(10);
    const result = level.evaluate();

    expect(result.isLost()).toBe(true);
    expect(result.reason).toBe(DefeatReason.Time);
  });

  it("should_stay_playing_when_time_has_not_expired_and_exit_not_reached", () => {
    const clock = fakeClock(1_000);
    const level = new TimedLevel(buildSolvableTemplate(), Position.of(0, 0), 10, { clock: clock.now });

    clock.advanceSeconds(9);
    const result = level.evaluate();

    expect(result.isPlaying()).toBe(true);
    expect(level.remainingMs).toBe(1_000);
  });

  it("should_produce_victory_when_exit_is_reached_before_time_expires", () => {
    const clock = fakeClock(1_000);
    const level = new TimedLevel(buildSolvableTemplate(), Position.of(0, 0), 10, { clock: clock.now });

    level.move(Position.of(0, 1));
    level.move(Position.of(0, 2));
    level.move(Position.of(1, 2));
    clock.advanceSeconds(5);
    const result = level.evaluate();

    expect(result.isWon()).toBe(true);
  });

  it("should_reject_construction_when_time_limit_is_not_positive", () => {
    expect(() => new TimedLevel(buildSolvableTemplate(), Position.of(0, 0), 0)).toThrow(InvalidTimeLimitError);
  });
});
