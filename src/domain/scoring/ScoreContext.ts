import type { LevelResult } from "../level/LevelResult";
import { InvalidScoreContextError } from "./errors";

type ScoreContextParams = {
  result: LevelResult;
  elapsedMs: number;
};

/**
 * ScoreContext value object (immutable).
 *
 * The deterministic inputs every scoring strategy reads: the final `LevelResult`
 * and the elapsed time (ms) taken to clear the level. In the untangle game the
 * score is a function of time only (faster = higher), so the maze-era
 * move/optimal-move inputs are gone. `create` validates that elapsed time is a
 * non-negative number, so a malformed context fails in a controlled way.
 */
export class ScoreContext {
  private constructor(
    readonly result: LevelResult,
    readonly elapsedMs: number
  ) {}

  static create(params: ScoreContextParams): ScoreContext {
    if (!Number.isFinite(params.elapsedMs) || params.elapsedMs < 0) {
      throw new InvalidScoreContextError(`elapsedMs must be a non-negative number, received ${params.elapsedMs}.`);
    }
    return new ScoreContext(params.result, params.elapsedMs);
  }

  /** True when the level was won and a positive score is allowed. */
  isScorable(): boolean {
    return this.result.isWon();
  }

  /** Elapsed time in whole seconds, floored. */
  elapsedSeconds(): number {
    return Math.floor(this.elapsedMs / 1000);
  }
}
