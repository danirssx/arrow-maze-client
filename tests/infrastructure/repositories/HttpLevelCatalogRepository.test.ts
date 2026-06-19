import type { IHttpClient, HttpResponse } from '@/application/ports/IHttpClient';
import { HttpLevelCatalogRepository } from '@/infrastructure/repositories/HttpLevelCatalogRepository';
import type { LevelResponseDto, LevelsResponseDto } from '@/infrastructure/mappers/level-catalog/LevelCatalogDtos';
import { LevelKind } from '@/application/level-build/LevelDefinition';

class FakeHttpClient implements IHttpClient {
  getResponse: unknown = null;
  lastGetUrl: string | null = null;

  async get<T>(url: string): Promise<HttpResponse<T>> {
    this.lastGetUrl = url;
    return { data: this.getResponse as T, status: 200 };
  }
  async post<T>(): Promise<HttpResponse<T>> { return { data: null as T, status: 200 }; }
  async put<T>(): Promise<HttpResponse<T>> { return { data: null as T, status: 200 }; }
  async delete<T>(): Promise<HttpResponse<T>> { return { data: null as T, status: 200 }; }
}

const LEVELS_RESPONSE: LevelsResponseDto = {
  status: 'success',
  data: {
    levels: [
      {
        levelId: '550e8400-e29b-41d4-a716-446655440010',
        name: 'First Knot',
        difficulty: 'EASY',
        arrowCount: 2,
        attempts: 5,
        createdAt: '2026-06-18T00:00:00.000Z',
      },
    ],
  },
};

const LEVEL_RESPONSE: LevelResponseDto = {
  status: 'success',
  data: {
    level: {
      levelId: '550e8400-e29b-41d4-a716-446655440011',
      name: 'Rush',
      description: 'Timed',
      difficulty: 'MEDIUM',
      status: 'PUBLISHED',
      version: 1,
      definition: {
        attempts: 5,
        arrows: [
          {
            id: 'a',
            color: 'blue',
            path: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
            direction: 'RIGHT',
          },
        ],
      },
      timeLimitSeconds: 75,
      createdAt: '2026-06-18T00:00:00.000Z',
      updatedAt: '2026-06-18T00:00:00.000Z',
    },
  },
};

describe('HttpLevelCatalogRepository', () => {
  it('should_load_level_summaries_from_backend', async () => {
    const http = new FakeHttpClient();
    http.getResponse = LEVELS_RESPONSE;
    const repo = new HttpLevelCatalogRepository(http);

    const levels = await repo.getLevels();

    expect(http.lastGetUrl).toBe('/levels');
    expect(levels[0]?.levelId).toBe('550e8400-e29b-41d4-a716-446655440010');
    expect(levels[0]?.arrowCount).toBe(2);
  });

  it('should_map_level_detail_to_client_definition', async () => {
    const http = new FakeHttpClient();
    http.getResponse = LEVEL_RESPONSE;
    const repo = new HttpLevelCatalogRepository(http);

    const definition = await repo.getLevelDefinition('550e8400-e29b-41d4-a716-446655440011');

    expect(http.lastGetUrl).toBe('/levels/550e8400-e29b-41d4-a716-446655440011');
    expect(definition.kind).toBe(LevelKind.Timed);
    expect(definition.timeLimitSeconds).toBe(75);
    expect(definition.arrows).toHaveLength(1);
  });
});
