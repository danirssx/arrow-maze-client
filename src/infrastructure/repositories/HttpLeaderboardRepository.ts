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
      ...(data.leaderboardId !== undefined ? { leaderboardId: data.leaderboardId } : {}),
      levelId: data.levelId,
      ...(data.updatedAt !== undefined ? { updatedAt: data.updatedAt } : {}),
      entries: data.entries,
    };
  }

  async submitScore(input: SubmitScoreInput, accessToken: string): Promise<void> {
    await this.http.post('/leaderboard/scores', input, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
}
