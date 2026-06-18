import { DefeatReason, LevelResult } from "@/domain/level/LevelResult";
import { ScoreContext } from "@/domain/scoring/ScoreContext";
import { StandardScoringStrategy } from "@/domain/scoring/StandardScoringStrategy";

describe("StandardScoringStrategy", () => {
  it("should_award_base_points_when_won", () => {
    const strategy = new StandardScoringStrategy(1000);

    const score = strategy.score(ScoreContext.create({ result: LevelResult.won(), elapsedMs: 0 }));

    expect(score.value).toBe(1000);
  });

  it("should_award_zero_when_not_won", () => {
    const strategy = new StandardScoringStrategy(1000);

    const score = strategy.score(ScoreContext.create({ result: LevelResult.lost(DefeatReason.OutOfAttempts), elapsedMs: 0 }));

    expect(score.value).toBe(0);
  });
});
