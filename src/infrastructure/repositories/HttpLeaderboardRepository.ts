// Pattern: Adapter, Repository
import type { ILeaderboardRepository, Leaderboard, SubmitScoreInput } from '@/application/ports/ILeaderboardRepository';
import type { IHttpClient } from '@/application/ports/IHttpClient';
import type { LeaderboardResponseDto } from '@/infrastructure/mappers/leaderboard/LeaderboardDtos';

export class HttpLeaderboardRepository implements ILeaderboardRepository {
  constructor(private readonly http: IHttpClient) {}

  async getTopScores(levelId: string): Promise<Leaderboard> {
    const res = await this.http.get<LeaderboardResponseDto>(`/leaderboard/${levelId}`);
    const { data } = res.data;
    return {
      leaderboardId: data.leaderboardId,
      levelId: data.levelId,
      updatedAt: data.updatedAt,
      entries: data.entries,
    };
  }

  async submitScore(input: SubmitScoreInput): Promise<void> {
    // The Bearer token is attached centrally by the http client interceptor.
    await this.http.post('/leaderboard/scores', input);
  }
}
