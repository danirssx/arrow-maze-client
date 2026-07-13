// Pattern: Facade — ViewModels interact only with this; never with HTTP directly
import type {
  ILeaderboardRepository,
  Leaderboard,
  LeaderboardEntry,
  SubmitScoreInput,
} from '@/application/ports/ILeaderboardRepository';
import { isUuid } from '@/shared/isUuid';

/** Sentinel levelId for the cross-level aggregate board (not a real level). */
export const GLOBAL_LEADERBOARD_ID = 'global';

export class LeaderboardFacade {
  constructor(private readonly repository: ILeaderboardRepository) {}

  async getTopScores(levelId: string): Promise<Leaderboard> {
    return this.repository.getTopScores(levelId);
  }

  /**
   * Client-side aggregate board (Option B): fetches every level's leaderboard and
   * sums each player's score across levels, then ranks. A single level failing
   * (or missing its board) never fails the whole board — it just contributes
   * nothing. Non-UUID ids are skipped (they would 422 on the backend).
   */
  async getGlobalScores(levelIds: readonly string[]): Promise<Leaderboard> {
    const uniqueLevelIds = [...new Set(levelIds)].filter((id) => isUuid(id));
    const boards = await Promise.all(
      uniqueLevelIds.map((levelId) => this.repository.getTopScores(levelId).catch(() => null)),
    );

    const totals = new Map<string, LeaderboardEntry>();
    for (const board of boards) {
      if (board === null) continue;
      for (const entry of board.entries) {
        const existing = totals.get(entry.userId);
        if (existing === undefined) {
          totals.set(entry.userId, {
            entryId: entry.userId,
            userId: entry.userId,
            usernameSnapshot: entry.usernameSnapshot,
            score: entry.score,
            timeSeconds: entry.timeSeconds,
            movesCount: entry.movesCount,
            rank: 0,
            submittedAt: entry.submittedAt,
          });
        } else {
          existing.score += entry.score;
          existing.timeSeconds += entry.timeSeconds;
          existing.movesCount += entry.movesCount;
          if (entry.submittedAt > existing.submittedAt) {
            existing.usernameSnapshot = entry.usernameSnapshot;
            existing.submittedAt = entry.submittedAt;
          }
        }
      }
    }

    const entries = [...totals.values()]
      .sort((a, b) => b.score - a.score || a.timeSeconds - b.timeSeconds)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return { levelId: GLOBAL_LEADERBOARD_ID, entries };
  }

  async submitScore(input: SubmitScoreInput): Promise<void> {
    // The backend rejects a non-UUID levelId with 422; never POST a slug fallback id.
    if (!isUuid(input.levelId)) return;
    return this.repository.submitScore(input);
  }
}
