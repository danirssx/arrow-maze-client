import { Score } from "../value-objects/Score";
import type { IScoringStrategy } from "./IScoringStrategy";
import type { ScoreContext } from "./ScoreContext";

type TimeBonusScoringConfig = {
  basePoints?: number;
  pointsPerSecond?: number;
};

/**
 * Strategy pattern — time-bonus scoring.
 *
 * Adds a bonus proportional to the whole seconds left on the clock when a timed
 * level is won. A lost or timed-out result (no remaining time, not won) yields
 * `Score.zero()`, so an expired timer can never emit an invalid high score.
 *
 * Deterministic: the score is a pure function of the won flag, the floored
 * remaining seconds, and the configured constants (defaults base 1000,
 * pointsPerSecond 10).
 */
export class TimeBonusScoringStrategy implements IScoringStrategy {
  private readonly basePoints: number;
  private readonly pointsPerSecond: number;

  constructor(config: TimeBonusScoringConfig = {}) {
    this.basePoints = config.basePoints ?? 1000;
    this.pointsPerSecond = config.pointsPerSecond ?? 10;
  }

  score(context: ScoreContext): Score {
    if (!context.isScorable()) {
      return Score.zero();
    }

    const bonus = context.remainingSeconds() * this.pointsPerSecond;

    return Score.of(this.basePoints + bonus);
  }
}
