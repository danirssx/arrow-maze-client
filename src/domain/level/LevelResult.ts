/**
 * DefeatReason value object.
 *
 * Closed set of the reasons a level can be lost. Modeled as a frozen const map
 * plus a union type so the value stays a plain serializable string shared with
 * presentation and the backend score catalog. New defeat conditions (out of
 * moves, trap, etc.) extend this map without touching the level hierarchy.
 */
export const DefeatReason = {
  Time: "TIME"
} as const;

export type DefeatReason = (typeof DefeatReason)[keyof typeof DefeatReason];

/**
 * LevelStatus value object.
 *
 * The three terminal-or-ongoing states a level evaluation can produce.
 */
export const LevelStatus = {
  Playing: "PLAYING",
  Won: "WON",
  Lost: "LOST"
} as const;

export type LevelStatus = (typeof LevelStatus)[keyof typeof LevelStatus];

/**
 * LevelResult value object (immutable).
 *
 * Outcome of evaluating a level at a point in time. Created only through the
 * named factories so an inconsistent combination (e.g. a lost result without a
 * reason, or a won result carrying one) cannot exist.
 */
export class LevelResult {
  private constructor(
    readonly status: LevelStatus,
    readonly reason?: DefeatReason
  ) {}

  static playing(): LevelResult {
    return new LevelResult(LevelStatus.Playing);
  }

  static won(): LevelResult {
    return new LevelResult(LevelStatus.Won);
  }

  static lost(reason: DefeatReason): LevelResult {
    return new LevelResult(LevelStatus.Lost, reason);
  }

  isPlaying(): boolean {
    return this.status === LevelStatus.Playing;
  }

  isWon(): boolean {
    return this.status === LevelStatus.Won;
  }

  isLost(): boolean {
    return this.status === LevelStatus.Lost;
  }
}
