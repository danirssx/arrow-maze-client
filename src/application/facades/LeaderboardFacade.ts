// Pattern: Facade — ViewModels interact only with this; never with HTTP directly
import type { ILeaderboardRepository, Leaderboard, SubmitScoreInput } from '@/application/ports/ILeaderboardRepository';

export class LeaderboardFacade {
  constructor(private readonly repository: ILeaderboardRepository) {}

  async getTopScores(levelId: string): Promise<Leaderboard> {
    return this.repository.getTopScores(levelId);
  }

  async submitScore(input: SubmitScoreInput): Promise<void> {
    return this.repository.submitScore(input);
  }
}
