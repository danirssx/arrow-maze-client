import { DefeatReason, LevelResult } from "@/domain/level";
import { ScoreContext, StandardScoringStrategy } from "@/domain/scoring";

describe("StandardScoringStrategy", () => {
  it("should_award_base_points_when_level_is_won", () => {
    const strategy = new StandardScoringStrategy();
    const context = ScoreContext.create({ result: LevelResult.won(), moves: 5, optimalMoves: 3 });

    const score = strategy.score(context);

    expect(score.value).toBe(1000);
  });

  it("should_score_zero_when_level_is_lost", () => {
    const strategy = new StandardScoringStrategy();
    const context = ScoreContext.create({ result: LevelResult.lost(DefeatReason.Time), moves: 5, optimalMoves: 3 });

    const score = strategy.score(context);

    expect(score.value).toBe(0);
  });

  it("should_score_zero_when_level_is_still_playing", () => {
    const strategy = new StandardScoringStrategy();
    const context = ScoreContext.create({ result: LevelResult.playing(), moves: 1, optimalMoves: 3 });

    const score = strategy.score(context);

    expect(score.value).toBe(0);
  });

  it("should_be_deterministic_when_scoring_the_same_context_twice", () => {
    const strategy = new StandardScoringStrategy();
    const context = ScoreContext.create({ result: LevelResult.won(), moves: 5, optimalMoves: 3 });

    expect(strategy.score(context).value).toBe(strategy.score(context).value);
  });
});
