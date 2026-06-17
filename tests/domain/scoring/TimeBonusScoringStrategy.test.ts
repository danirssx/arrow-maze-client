import { DefeatReason, LevelResult } from "@/domain/level";
import { ScoreContext, TimeBonusScoringStrategy } from "@/domain/scoring";

describe("TimeBonusScoringStrategy", () => {
  it("should_add_bonus_per_remaining_second_when_level_is_won", () => {
    const strategy = new TimeBonusScoringStrategy();
    const context = ScoreContext.create({
      result: LevelResult.won(),
      moves: 4,
      optimalMoves: 3,
      remainingMs: 7_500
    });

    const score = strategy.score(context);

    // base 1000 + floor(7500/1000) * 10 = 1000 + 70.
    expect(score.value).toBe(1070);
  });

  it("should_score_base_only_when_no_time_remains", () => {
    const strategy = new TimeBonusScoringStrategy();
    const context = ScoreContext.create({ result: LevelResult.won(), moves: 4, optimalMoves: 3, remainingMs: 0 });

    const score = strategy.score(context);

    expect(score.value).toBe(1000);
  });

  it("should_not_produce_high_score_when_timed_level_was_lost_by_time", () => {
    const strategy = new TimeBonusScoringStrategy();
    const context = ScoreContext.create({
      result: LevelResult.lost(DefeatReason.Time),
      moves: 4,
      optimalMoves: 3,
      remainingMs: 0
    });

    const score = strategy.score(context);

    expect(score.value).toBe(0);
  });
});
