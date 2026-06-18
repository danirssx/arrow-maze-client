// Pattern: Adapter
import type { LocalProgress } from '@/application/ports/IProgressRepository';
import type { ProgressResponseDto } from './ProgressDtos';

export class ProgressMapper {
  static toLocal(dto: ProgressResponseDto, pendingSync = false): LocalProgress {
    return {
      progressId: dto.data.progressId,
      userId: dto.data.userId,
      version: dto.data.version,
      updatedAt: dto.data.updatedAt,
      completedLevels: dto.data.completedLevels.map((cl) => ({
        levelId: cl.levelId,
        score: cl.score,
        timeSeconds: cl.timeSeconds,
        movesCount: cl.movesCount,
        completedAt: cl.completedAt,
      })),
      pendingSync,
    };
  }
}
