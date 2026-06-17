import { Score } from "../value-objects/Score";
import type { IScoringStrategy } from "./IScoringStrategy";
import type { ScoreContext } from "./ScoreContext";

/**
 * Strategy pattern — baseline scoring.
 *
 * Awards a flat base score for a won level and nothing otherwise. A lost or
 * timed-out result yields `Score.zero()`, so it can never emit an invalid high
 * score.
 *
 * Deterministic: the score depends only on whether the level was won and the
 * configured `basePoints` (default 1000).
 */
export class StandardScoringStrategy implements IScoringStrategy {
  constructor(private readonly basePoints: number = 1000) {}

  score(context: ScoreContext): Score {
    if (!context.isScorable()) {
      return Score.zero();
    }
    return Score.of(this.basePoints);
  }
}
