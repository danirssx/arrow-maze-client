// Pattern: Adapter, Repository
import type { IHttpClient } from '@/application/ports/IHttpClient';
import type { LocalProgress, CompletedLevelData } from '@/application/ports/IProgressRepository';
import type { IRemoteProgressRepository } from '@/application/ports/IRemoteProgressRepository';
import type { ProgressResponseDto } from '@/infrastructure/mappers/progress/ProgressDtos';
import { ProgressMapper } from '@/infrastructure/mappers/progress/ProgressMapper';

export class HttpProgressRepository implements IRemoteProgressRepository {
  constructor(private readonly http: IHttpClient) {}

  async fetchRemote(): Promise<LocalProgress> {
    const res = await this.http.get<ProgressResponseDto>('/progress/me');
    return ProgressMapper.toLocal(res.data);
  }

  async completeLevel(completedLevel: CompletedLevelData): Promise<void> {
    await this.http.post(`/progress/levels/${completedLevel.levelId}/complete`, {
      score: completedLevel.score,
      timeSeconds: completedLevel.timeSeconds,
      movesCount: completedLevel.movesCount,
      completedAt: completedLevel.completedAt,
    });
  }

  async sync(completedLevels: CompletedLevelData[]): Promise<LocalProgress> {
    const res = await this.http.put<ProgressResponseDto>('/progress/sync', { completedLevels });
    return ProgressMapper.toLocal(res.data);
  }
}
