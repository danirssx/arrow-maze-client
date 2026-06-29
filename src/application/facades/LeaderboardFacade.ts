// Pattern: Facade — ViewModels interact only with this; never with HTTP directly
import type { ILeaderboardRepository, Leaderboard, SubmitScoreInput } from '@/application/ports/ILeaderboardRepository';
import { isUuid } from '@/shared/isUuid';

export class LeaderboardFacade {
  constructor(private readonly repository: ILeaderboardRepository) {}

  async getTopScores(levelId: string): Promise<Leaderboard> {
    return this.repository.getTopScores(levelId);
  }

  async submitScore(input: SubmitScoreInput): Promise<void> {
    // The backend rejects a non-UUID levelId with 422; never POST a slug fallback id.
    if (!isUuid(input.levelId)) return;
    return this.repository.submitScore(input);
  }
}
