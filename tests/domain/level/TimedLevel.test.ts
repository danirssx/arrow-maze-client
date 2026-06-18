import { ArrowEntity } from "@/domain/board/ArrowEntity";
import { BoardGroup } from "@/domain/board/BoardGroup";
import { DefeatReason } from "@/domain/level/LevelResult";
import { TimedLevel } from "@/domain/level/TimedLevel";
import { InvalidTimeLimitError } from "@/domain/level/errors";
import { ArrowSpec } from "@/domain/value-objects/ArrowSpec";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

const arrow = (id: string, cells: [number, number][], direction: Direction): ArrowEntity =>
  new ArrowEntity(ArrowSpec.of(id, "blue", cells.map(([row, col]) => Position.of(row, col)), direction));

describe("TimedLevel", () => {
  it("should_keep_playing_before_the_time_limit", () => {
    let now = 0;
    const level = new TimedLevel("T1", new BoardGroup([arrow("a", [[0, 0]], Direction.Up)]), 3, 10, { clock: () => now });

    now = 5000;

    expect(level.evaluate().isPlaying()).toBe(true);
    expect(level.remainingMs).toBe(5000);
  });

  it("should_lose_by_time_when_the_limit_elapses", () => {
    let now = 0;
    const level = new TimedLevel("T1", new BoardGroup([arrow("a", [[0, 0]], Direction.Up)]), 3, 10, { clock: () => now });

    now = 10000;
    const result = level.evaluate();

    expect(result.isLost()).toBe(true);
    expect(result.reason).toBe(DefeatReason.Time);
  });

  it("should_reject_a_non_positive_time_limit", () => {
    expect(() => new TimedLevel("T1", new BoardGroup([]), 3, 0)).toThrow(InvalidTimeLimitError);
  });
});
