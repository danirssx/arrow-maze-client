import { Score } from "../value-objects/Score";
import type { IScoringStrategy } from "./IScoringStrategy";
import type { ScoreContext } from "./ScoreContext";

type EfficiencyScoringConfig = {
  basePoints?: number;
  efficiencyBonus?: number;
  penaltyPerExtraMove?: number;
};

/**
 * Strategy pattern — efficiency-based scoring.
 *
 * Rewards solving a level in at most the optimal number of moves (the
 * `optimalMoves` computed by `PathfindingService` over the board graph). When
 * the player matches or beats the optimal path, a flat `efficiencyBonus` is
 * added on top of the base; each extra move beyond the optimum subtracts
 * `penaltyPerExtraMove`. The result is clamped at zero so a long-but-winning run
 * never goes negative, and a non-won result always yields `Score.zero()`.
 *
 * Deterministic: the score is a pure function of moves, optimalMoves, and the
 * configured constants (defaults base 1000, bonus 500, penalty 50).
 */
export class EfficiencyScoringStrategy implements IScoringStrategy {
  private readonly basePoints: number;
  private readonly efficiencyBonus: number;
  private readonly penaltyPerExtraMove: number;

  constructor(config: EfficiencyScoringConfig = {}) {
    this.basePoints = config.basePoints ?? 1000;
    this.efficiencyBonus = config.efficiencyBonus ?? 500;
    this.penaltyPerExtraMove = config.penaltyPerExtraMove ?? 50;
  }

  score(context: ScoreContext): Score {
    if (!context.isScorable()) {
      return Score.zero();
    }

    const bonus = context.isEfficient() ? this.efficiencyBonus : 0;
    const penalty = context.extraMoves() * this.penaltyPerExtraMove;
    const points = Math.max(this.basePoints + bonus - penalty, 0);

    return Score.of(points);
  }
}
