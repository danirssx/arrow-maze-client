import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import type { DifficultyDto } from "@/application/dto/DifficultyDto";

/** Where a daily challenge was produced: the AI generator or the deterministic fallback. */
export type DailyChallengeSource = "gemini" | "fallback";

/**
 * Non-gameplay metadata about today's challenge (its UTC date, difficulty, and
 * whether the backend had to fall back to its deterministic generator). The
 * client only reads it; generation and any secrets stay 100% backend.
 */
export type DailyChallengeMeta = {
  readonly date: string;
  readonly difficulty: DifficultyDto;
  readonly source: DailyChallengeSource;
  readonly fallbackUsed: boolean;
};

/**
 * The once-per-day puzzle the client consumes: a playable `LevelDefinition`
 * (reusing the existing level contract) plus display metadata. The definition's
 * `id` is the deterministic daily seed, deliberately NOT a leaderboard UUID, so
 * the daily flow never submits scores.
 */
export type DailyChallenge = {
  readonly definition: LevelDefinition;
  readonly meta: DailyChallengeMeta;
};

export interface IDailyChallengeRepository {
  getDailyChallenge(): Promise<DailyChallenge>;
}
