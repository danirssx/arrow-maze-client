import { HttpLeaderboardRepository } from '@/infrastructure/repositories/HttpLeaderboardRepository';
import type { IHttpClient, HttpRequestConfig, HttpResponse } from '@/application/ports/IHttpClient';
import type { LeaderboardResponseDto } from '@/infrastructure/mappers/leaderboard/LeaderboardDtos';

class FakeHttpClient implements IHttpClient {
  getResponse: unknown = null;
  postResponse: unknown = null;
  lastGetUrl: string | null = null;
  lastGetConfig: HttpRequestConfig | undefined;
  lastPostUrl: string | null = null;
  lastPostBody: unknown = null;
  lastPostConfig: HttpRequestConfig | undefined;
  async get<T>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    this.lastGetUrl = url;
    this.lastGetConfig = config;
    return { data: this.getResponse as T, status: 200 };
  }
  async post<T>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    this.lastPostUrl = url;
    this.lastPostBody = body;
    this.lastPostConfig = config;
    return { data: this.postResponse as T, status: 201 };
  }
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
    expect(http.lastGetUrl).toBe('/leaderboard/level-001');
    expect(http.lastGetConfig).toBeUndefined();
  });

  it('should_submit_score_with_authorization_header_and_without_user_id_body', async () => {
    http.postResponse = { status: 'success', data: null };
    await expect(repo.submitScore({
      leaderboardId: 'lb-1', entryId: 'e-2',
      levelId: 'level-001', usernameSnapshot: 'player',
      score: 800, timeSeconds: 60, movesCount: 20,
    }, 'jwt-token-1')).resolves.not.toThrow();

    expect(http.lastPostUrl).toBe('/leaderboard/scores');
    expect(http.lastPostBody).toEqual({
      leaderboardId: 'lb-1',
      entryId: 'e-2',
      levelId: 'level-001',
      usernameSnapshot: 'player',
      score: 800,
      timeSeconds: 60,
      movesCount: 20,
    });
    expect(http.lastPostBody).not.toHaveProperty('userId');
    expect(http.lastPostConfig).toEqual({
      headers: { Authorization: 'Bearer jwt-token-1' },
    });
  });
});
