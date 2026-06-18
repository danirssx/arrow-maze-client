import { HttpLeaderboardRepository } from '@/infrastructure/repositories/HttpLeaderboardRepository';
import type { IHttpClient, HttpResponse } from '@/application/ports/IHttpClient';
import type { LeaderboardResponseDto } from '@/infrastructure/mappers/leaderboard/LeaderboardDtos';

class FakeHttpClient implements IHttpClient {
  getResponse: unknown = null;
  postResponse: unknown = null;
  async get<T>(): Promise<HttpResponse<T>> { return { data: this.getResponse as T, status: 200 }; }
  async post<T>(): Promise<HttpResponse<T>> { return { data: this.postResponse as T, status: 201 }; }
  async put<T>(): Promise<HttpResponse<T>> { return { data: null as T, status: 200 }; }
  async delete<T>(): Promise<HttpResponse<T>> { return { data: null as T, status: 200 }; }
}

const LEADERBOARD_FIXTURE: LeaderboardResponseDto = {
  status: 'success',
  data: {
    leaderboardId: 'lb-1',
    levelId: 'level-001',
    updatedAt: '2026-06-18T00:00:00.000Z',
    entries: [
      { entryId: 'e-1', userId: 'user-1', usernameSnapshot: 'player', score: 1500, timeSeconds: 45, movesCount: 30, rank: 1, submittedAt: '2026-06-18T00:00:00.000Z' },
    ],
  },
};

describe('HttpLeaderboardRepository', () => {
  let http: FakeHttpClient;
  let repo: HttpLeaderboardRepository;

  beforeEach(() => {
    http = new FakeHttpClient();
    repo = new HttpLeaderboardRepository(http);
  });

  it('should_return_leaderboard_with_entries', async () => {
    http.getResponse = LEADERBOARD_FIXTURE;
    const result = await repo.getTopScores('level-001');
    expect(result.levelId).toBe('level-001');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.rank).toBe(1);
  });

  it('should_call_submit_score_without_throwing', async () => {
    http.postResponse = { status: 'success', data: null };
    await expect(repo.submitScore({
      leaderboardId: 'lb-1', entryId: 'e-2', userId: 'user-1',
      levelId: 'level-001', usernameSnapshot: 'player',
      score: 800, timeSeconds: 60, movesCount: 20,
    })).resolves.not.toThrow();
  });
});
