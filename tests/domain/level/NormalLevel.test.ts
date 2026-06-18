import { ArrowEntity } from "@/domain/board/ArrowEntity";
import { BoardGroup } from "@/domain/board/BoardGroup";
import { DefeatReason } from "@/domain/level/LevelResult";
import { NormalLevel } from "@/domain/level/NormalLevel";
import { ArrowNotExtractableError, InvalidAttemptsError } from "@/domain/level/errors";
import { ArrowSpec } from "@/domain/value-objects/ArrowSpec";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

const arrow = (id: string, cells: [number, number][], direction: Direction): ArrowEntity =>
  new ArrowEntity(ArrowSpec.of(id, "blue", cells.map(([row, col]) => Position.of(row, col)), direction));

describe("NormalLevel", () => {
  it("should_win_when_all_arrows_are_extracted", () => {
    const level = new NormalLevel("L1", new BoardGroup([arrow("a", [[0, 0], [0, 1]], Direction.Right)]), 3);

    expect(level.evaluate().isPlaying()).toBe(true);
    level.extractArrow("a");

    expect(level.evaluate().isWon()).toBe(true);
    expect(level.activeArrowCount).toBe(0);
  });

  it("should_throw_when_extracting_a_blocked_arrow", () => {
    const a = arrow("a", [[0, 0], [0, 1]], Direction.Right); // ray covers (0,2)
    const b = arrow("b", [[0, 2]], Direction.Up);
    const level = new NormalLevel("L1", new BoardGroup([a, b]), 3);

    expect(() => level.extractArrow("a")).toThrow(ArrowNotExtractableError);
    expect(level.activeArrowCount).toBe(2);
  });

  it("should_decrement_attempts_only_once_per_arrow_on_failed_taps", () => {
    const level = new NormalLevel("L1", new BoardGroup([arrow("a", [[0, 0]], Direction.Up)]), 3);

    expect(level.registerFailedAttempt("a")).toBe(true);
    expect(level.attemptsRemaining).toBe(2);
    expect(level.registerFailedAttempt("a")).toBe(false);
    expect(level.attemptsRemaining).toBe(2);
  });

  it("should_lose_with_out_of_attempts_when_the_budget_is_exhausted", () => {
    const a = arrow("a", [[0, 0]], Direction.Up);
    const b = arrow("b", [[5, 5]], Direction.Up);
    const level = new NormalLevel("L1", new BoardGroup([a, b]), 1);

    level.registerFailedAttempt("a");
    const result = level.evaluate();

    expect(result.isLost()).toBe(true);
    expect(result.reason).toBe(DefeatReason.OutOfAttempts);
  });

  it("should_restore_an_extracted_arrow", () => {
    const level = new NormalLevel("L1", new BoardGroup([arrow("a", [[0, 0], [0, 1]], Direction.Right)]), 3);

    level.extractArrow("a");
    expect(level.activeArrowCount).toBe(0);
    level.restoreArrow("a");
    expect(level.activeArrowCount).toBe(1);
  });

  it("should_reject_a_non_positive_attempts_budget", () => {
    expect(() => new NormalLevel("L1", new BoardGroup([]), 0)).toThrow(InvalidAttemptsError);
  });
});
