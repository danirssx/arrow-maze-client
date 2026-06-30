import type { IHttpClient, HttpRequestConfig, HttpResponse } from '@/application/ports/IHttpClient';
import { HttpProgressRepository } from '@/infrastructure/repositories/HttpProgressRepository';
import type { ProgressResponseDto } from '@/infrastructure/mappers/progress/ProgressDtos';

class FakeHttpClient implements IHttpClient {
  getResponse: unknown = null;
  putResponse: unknown = null;
  lastPostUrl: string | null = null;
  lastPostBody: unknown = null;
  lastPostConfig: HttpRequestConfig | undefined;

  async get<T>(): Promise<HttpResponse<T>> { return { data: this.getResponse as T, status: 200 }; }
  async post<T>(url: string, body?: unknown, config?: HttpRequestConfig): Promise<HttpResponse<T>> {
    this.lastPostUrl = url;
    this.lastPostBody = body;
    this.lastPostConfig = config;
    return { data: null as T, status: 201 };
  }
  async put<T>(): Promise<HttpResponse<T>> { return { data: this.putResponse as T, status: 200 }; }
  async delete<T>(): Promise<HttpResponse<T>> { return { data: null as T, status: 200 }; }
}

const PROGRESS_RESPONSE: ProgressResponseDto = {
  status: 'success',
  data: {
    progressId: 'p-1',
    userId: 'u-1',
    version: 1,
    updatedAt: '2026-06-18T00:00:00.000Z',
    completedLevels: [],
  },
};

describe('HttpProgressRepository', () => {
  it('should_post_completed_level_without_hand_rolled_authorization_header', async () => {
    const http = new FakeHttpClient();
    http.getResponse = PROGRESS_RESPONSE;
    const repo = new HttpProgressRepository(http);

    await repo.completeLevel({
      levelId: '550e8400-e29b-41d4-a716-446655440010',
      score: 900,
      timeSeconds: 10,
      movesCount: 2,
      completedAt: '2026-06-18T00:00:00.000Z',
    });

    expect(http.lastPostUrl).toBe('/progress/levels/550e8400-e29b-41d4-a716-446655440010/complete');
    expect(http.lastPostBody).toEqual({
      score: 900,
      timeSeconds: 10,
      movesCount: 2,
      completedAt: '2026-06-18T00:00:00.000Z',
    });
    expect(http.lastPostConfig).toBeUndefined();
  });
});
