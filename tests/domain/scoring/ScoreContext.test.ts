import { LevelResult } from "@/domain/level";
import { InvalidScoreContextError, ScoreContext } from "@/domain/scoring";

describe("ScoreContext", () => {
  it("should_report_efficient_when_moves_are_at_most_optimal", () => {
    const context = ScoreContext.create({ result: LevelResult.won(), moves: 3, optimalMoves: 3 });

    expect(context.isEfficient()).toBe(true);
    expect(context.extraMoves()).toBe(0);
  });

  it("should_report_extra_moves_when_above_optimal", () => {
    const context = ScoreContext.create({ result: LevelResult.won(), moves: 6, optimalMoves: 3 });

    expect(context.isEfficient()).toBe(false);
    expect(context.extraMoves()).toBe(3);
  });

  it("should_floor_remaining_milliseconds_to_whole_seconds", () => {
    const context = ScoreContext.create({
      result: LevelResult.won(),
      moves: 3,
      optimalMoves: 3,
      remainingMs: 4_999
    });

    expect(context.remainingSeconds()).toBe(4);
  });

  it("should_reject_negative_move_count", () => {
    expect(() => ScoreContext.create({ result: LevelResult.won(), moves: -1, optimalMoves: 3 })).toThrow(
      InvalidScoreContextError
    );
  });

  it("should_reject_non_integer_optimal_moves", () => {
    expect(() => ScoreContext.create({ result: LevelResult.won(), moves: 3, optimalMoves: 2.5 })).toThrow(
      InvalidScoreContextError
    );
  });

  it("should_reject_negative_remaining_time", () => {
    expect(() =>
      ScoreContext.create({ result: LevelResult.won(), moves: 3, optimalMoves: 3, remainingMs: -10 })
    ).toThrow(InvalidScoreContextError);
  });
});
