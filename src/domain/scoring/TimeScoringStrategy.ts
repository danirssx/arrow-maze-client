import { Score } from "../value-objects/Score";
import type { IScoringStrategy } from "./IScoringStrategy";
import type { ScoreContext } from "./ScoreContext";

type TimeScoringConfig = {
  basePoints?: number;
  pointsPerSecond?: number;
};

/**
 * Strategy pattern — time-based scoring (untangle puzzle).
 *
 * `score = max(0, basePoints − elapsedSeconds · pointsPerSecond)`. Higher is
 * better: solving faster yields more points. A non-won result yields
 * `Score.zero()`, so a defeat can never emit a positive (invalid) score.
 *
 * Deterministic: a pure function of the won flag, the floored elapsed seconds,
 * and the configured constants (defaults base 1000, pointsPerSecond 10). The
 * attempts budget is a defeat mechanic and intentionally does NOT affect score.
 */
export class TimeScoringStrategy implements IScoringStrategy {
  private readonly basePoints: number;
  private readonly pointsPerSecond: number;

  constructor(config: TimeScoringConfig = {}) {
    this.basePoints = config.basePoints ?? 1000;
    this.pointsPerSecond = config.pointsPerSecond ?? 10;
  }

  score(context: ScoreContext): Score {
    if (!context.isScorable()) {
      return Score.zero();
    }
    const penalty = context.elapsedSeconds() * this.pointsPerSecond;
    return Score.of(Math.max(this.basePoints - penalty, 0));
  }
}
