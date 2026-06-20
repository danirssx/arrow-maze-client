import { LevelResult } from "@/domain/level/LevelResult";
import { ScoreContext } from "@/domain/scoring/ScoreContext";
import { TimeScoringStrategy } from "@/domain/scoring/TimeScoringStrategy";

describe("TimeScoringStrategy", () => {
  it("should_award_full_base_when_solved_instantly", () => {
    const strategy = new TimeScoringStrategy({ basePoints: 1000, pointsPerSecond: 10 });

    const score = strategy.score(ScoreContext.create({ result: LevelResult.won(), elapsedMs: 0 }));

    expect(score.value).toBe(1000);
  });

  it("should_subtract_points_per_elapsed_second", () => {
    const strategy = new TimeScoringStrategy({ basePoints: 1000, pointsPerSecond: 10 });

    const score = strategy.score(ScoreContext.create({ result: LevelResult.won(), elapsedMs: 30000 }));

    expect(score.value).toBe(700);
  });

  it("should_clamp_at_zero_for_very_slow_solves", () => {
    const strategy = new TimeScoringStrategy({ basePoints: 100, pointsPerSecond: 10 });

    const score = strategy.score(ScoreContext.create({ result: LevelResult.won(), elapsedMs: 999_999 }));

    expect(score.value).toBe(0);
  });

  it("should_award_zero_when_not_won", () => {
    const strategy = new TimeScoringStrategy();

    const score = strategy.score(ScoreContext.create({ result: LevelResult.playing(), elapsedMs: 0 }));

    expect(score.value).toBe(0);
  });
});
