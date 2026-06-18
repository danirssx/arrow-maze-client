import type { LevelResult } from "../level/LevelResult";
import { InvalidScoreContextError } from "./errors";

type ScoreContextParams = {
  result: LevelResult;
  moves: number;
  optimalMoves: number;
  remainingMs?: number;
};

/**
 * ScoreContext value object (immutable).
 *
 * The deterministic inputs every scoring strategy reads: the final
 * `LevelResult`, how many moves the player used, the `optimalMoves` for the
 * level (computed by `PathfindingService` over the board graph or validated in
 * `LevelTemplate`), and the remaining time in milliseconds for timed levels.
 *
 * `ScoreContext.create` validates the numeric invariants (non-negative integer
 * move counts and non-negative remaining time), so a malformed context fails in
 * a controlled way instead of producing a nonsensical score.
 */
export class ScoreContext {
  private constructor(
    readonly result: LevelResult,
    readonly moves: number,
    readonly optimalMoves: number,
    readonly remainingMs: number
  ) {}

  static create(params: ScoreContextParams): ScoreContext {
    const remainingMs = params.remainingMs ?? 0;

    if (!Number.isInteger(params.moves) || params.moves < 0) {
      throw new InvalidScoreContextError(`moves must be a non-negative integer, received ${params.moves}.`);
    }
    if (!Number.isInteger(params.optimalMoves) || params.optimalMoves < 0) {
      throw new InvalidScoreContextError(
        `optimalMoves must be a non-negative integer, received ${params.optimalMoves}.`
      );
    }
    if (!Number.isFinite(remainingMs) || remainingMs < 0) {
      throw new InvalidScoreContextError(`remainingMs must be a non-negative number, received ${remainingMs}.`);
    }

    return new ScoreContext(params.result, params.moves, params.optimalMoves, remainingMs);
  }

  /** True when the level was won and a positive high score is allowed. */
  isScorable(): boolean {
    return this.result.isWon();
  }

  /** Extra moves beyond the optimal path; zero when the player matched or beat it. */
  extraMoves(): number {
    return Math.max(this.moves - this.optimalMoves, 0);
  }

  /** True when the player solved the level in at most the optimal number of moves. */
  isEfficient(): boolean {
    return this.moves <= this.optimalMoves;
  }

  /** Remaining time in whole seconds, floored. */
  remainingSeconds(): number {
    return Math.floor(this.remainingMs / 1000);
  }
}
