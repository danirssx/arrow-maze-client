import { DefeatReason, LevelResult } from "@/domain/level/LevelResult";
import { ScoreContext } from "@/domain/scoring/ScoreContext";
import { InvalidScoreContextError } from "@/domain/scoring/errors";

describe("ScoreContext", () => {
  it("should_be_scorable_only_when_won", () => {
    expect(ScoreContext.create({ result: LevelResult.won(), elapsedMs: 0 }).isScorable()).toBe(true);
    expect(ScoreContext.create({ result: LevelResult.playing(), elapsedMs: 0 }).isScorable()).toBe(false);
    expect(ScoreContext.create({ result: LevelResult.lost(DefeatReason.OutOfAttempts), elapsedMs: 0 }).isScorable()).toBe(
      false
    );
  });

  it("should_floor_elapsed_seconds", () => {
    expect(ScoreContext.create({ result: LevelResult.won(), elapsedMs: 4999 }).elapsedSeconds()).toBe(4);
  });

  it("should_throw_when_elapsed_is_negative", () => {
    expect(() => ScoreContext.create({ result: LevelResult.won(), elapsedMs: -1 })).toThrow(InvalidScoreContextError);
  });
});
