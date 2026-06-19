// Pattern: Adapter, Repository
import type { IHttpClient } from '@/application/ports/IHttpClient';
import type { LocalProgress, CompletedLevelData } from '@/application/ports/IProgressRepository';
import type { IRemoteProgressRepository } from '@/application/ports/IRemoteProgressRepository';
import type { ProgressResponseDto } from '@/infrastructure/mappers/progress/ProgressDtos';
import { ProgressMapper } from '@/infrastructure/mappers/progress/ProgressMapper';

export class HttpProgressRepository implements IRemoteProgressRepository {
  constructor(private readonly http: IHttpClient) {}

  async fetchRemote(accessToken: string): Promise<LocalProgress> {
    const res = await this.http.get<ProgressResponseDto>('/progress/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return ProgressMapper.toLocal(res.data);
  }

  async completeLevel(accessToken: string, completedLevel: CompletedLevelData): Promise<void> {
    await this.http.post(`/progress/levels/${completedLevel.levelId}/complete`, {
      score: completedLevel.score,
      timeSeconds: completedLevel.timeSeconds,
      movesCount: completedLevel.movesCount,
      completedAt: completedLevel.completedAt,
    }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  async sync(accessToken: string, completedLevels: CompletedLevelData[]): Promise<LocalProgress> {
    const res = await this.http.put<ProgressResponseDto>('/progress/sync', { completedLevels }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return ProgressMapper.toLocal(res.data);
  }
}
