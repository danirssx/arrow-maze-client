import {
  ArrowCell,
  BoardGraphBuilder,
  BoardGroup,
  EmptyCell,
  ExitCell,
  PathfindingService,
  WallCell
} from "@/domain/board";
import { DefeatReason, LevelResult } from "@/domain/level";
import { EfficiencyScoringStrategy, ScoreContext } from "@/domain/scoring";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

/**
 * Solvable 2x3 board whose only path (0,0)->(0,1)->(0,2)->(1,2) costs 3 moves,
 * so `optimalMoves` is derived from the graph rather than hard-coded.
 */
function optimalMovesFromGraph(): number {
  const board = new BoardGroup([
    new ArrowCell(Position.of(0, 0), Direction.Right),
    new EmptyCell(Position.of(0, 1)),
    new EmptyCell(Position.of(0, 2)),
    new WallCell(Position.of(1, 1)),
    new ExitCell(Position.of(1, 2))
  ]);
  const graph = new BoardGraphBuilder().build(board, 2, 3);
  const optimal = new PathfindingService().calculateOptimalMoves(graph, Position.of(0, 0), Position.of(1, 2));
  if (optimal === undefined) {
    throw new Error("Test board must be solvable.");
  }
  return optimal;
}

describe("EfficiencyScoringStrategy", () => {
  it("should_apply_efficiency_bonus_when_moves_match_optimal_computed_by_pathfinding", () => {
    const strategy = new EfficiencyScoringStrategy();
    const optimalMoves = optimalMovesFromGraph();
    const context = ScoreContext.create({ result: LevelResult.won(), moves: optimalMoves, optimalMoves });

    const score = strategy.score(context);

    // base 1000 + efficiency bonus 500, no penalty.
    expect(score.value).toBe(1500);
  });

  it("should_subtract_penalty_for_each_move_beyond_optimal", () => {
    const strategy = new EfficiencyScoringStrategy();
    const optimalMoves = optimalMovesFromGraph();
    const context = ScoreContext.create({ result: LevelResult.won(), moves: optimalMoves + 2, optimalMoves });

    const score = strategy.score(context);

    // base 1000 + no bonus - 2 * 50 penalty.
    expect(score.value).toBe(900);
  });

  it("should_clamp_score_at_zero_when_penalty_exceeds_base", () => {
    const strategy = new EfficiencyScoringStrategy({ basePoints: 100, efficiencyBonus: 0, penaltyPerExtraMove: 50 });
    const context = ScoreContext.create({ result: LevelResult.won(), moves: 10, optimalMoves: 3 });

    const score = strategy.score(context);

    expect(score.value).toBe(0);
  });

  it("should_not_produce_high_score_when_result_is_defeat", () => {
    const strategy = new EfficiencyScoringStrategy();
    const context = ScoreContext.create({ result: LevelResult.lost(DefeatReason.Time), moves: 2, optimalMoves: 5 });

    const score = strategy.score(context);

    expect(score.value).toBe(0);
  });
});
