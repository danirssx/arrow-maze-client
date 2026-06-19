// Pattern: Facade — ViewModels interact only with this; never with storage or HTTP directly
import type { IProgressRepository, LocalProgress, CompletedLevelData } from '@/application/ports/IProgressRepository';
import type { IRemoteProgressRepository } from '@/application/ports/IRemoteProgressRepository';

export class ProgressFacade {
  constructor(
    private readonly local: IProgressRepository,
    private readonly remote: IRemoteProgressRepository,
  ) {}

  async load(userId: string, accessToken: string): Promise<LocalProgress> {
    const cached = await this.local.load(userId);
    if (cached !== null) return cached;
    const remote = await this.remote.fetchRemote(accessToken);
    await this.local.save(remote);
    return remote;
  }

  async saveOffline(progress: LocalProgress): Promise<void> {
    await this.local.save({ ...progress, pendingSync: true });
  }

  async completeLevel(userId: string, accessToken: string, completedLevel: CompletedLevelData): Promise<LocalProgress> {
    const local = await this.local.load(userId);
    const updated = ProgressFacade.mergeCompletion(
      local ?? ProgressFacade.emptyProgress(userId, completedLevel.completedAt),
      completedLevel,
    );
    await this.local.save({ ...updated, pendingSync: true });

    await this.remote.completeLevel(accessToken, completedLevel);
    const remote = await this.remote.fetchRemote(accessToken);
    await this.local.save({ ...remote, pendingSync: false });
    return remote;
  }

  async sync(userId: string, accessToken: string): Promise<LocalProgress> {
    const local = await this.local.load(userId);
    const levels: CompletedLevelData[] = local?.completedLevels ?? [];
    const merged = await this.remote.sync(accessToken, levels);
    await this.local.save({ ...merged, pendingSync: false });
    return merged;
  }

  async hasPendingSync(userId: string): Promise<boolean> {
    const local = await this.local.load(userId);
    return local?.pendingSync ?? false;
  }

  private static emptyProgress(userId: string, timestamp: string): LocalProgress {
    return {
      progressId: `local-${userId}`,
      userId,
      version: 0,
      updatedAt: timestamp,
      completedLevels: [],
      pendingSync: true,
    };
  }

  private static mergeCompletion(progress: LocalProgress, completedLevel: CompletedLevelData): LocalProgress {
    const existing = progress.completedLevels.find((level) => level.levelId === completedLevel.levelId);
    const keepExisting =
      existing !== undefined &&
      (existing.score > completedLevel.score ||
        (existing.score === completedLevel.score && existing.timeSeconds <= completedLevel.timeSeconds));

    return {
      ...progress,
      updatedAt: completedLevel.completedAt,
      completedLevels: [
        ...progress.completedLevels.filter((level) => level.levelId !== completedLevel.levelId),
        keepExisting ? existing : completedLevel,
      ],
      pendingSync: true,
    };
  }
}
