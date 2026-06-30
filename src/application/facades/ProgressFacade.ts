// Pattern: Facade — ViewModels interact only with this; never with storage or HTTP directly
import type { IProgressRepository, LocalProgress, CompletedLevelData } from '@/application/ports/IProgressRepository';
import type { IRemoteProgressRepository } from '@/application/ports/IRemoteProgressRepository';
import { ProgressMergePolicy } from '@/domain/progress';
import { isUuid } from '@/shared/isUuid';

export class ProgressFacade {
  private readonly progressMergePolicy = new ProgressMergePolicy();

  constructor(
    private readonly local: IProgressRepository,
    private readonly remote: IRemoteProgressRepository,
  ) {}

  async load(userId: string): Promise<LocalProgress> {
    const cached = await this.local.load(userId);
    if (cached !== null) return cached;
    const remote = await this.remote.fetchRemote();
    await this.local.save(remote);
    return remote;
  }

  async saveOffline(progress: LocalProgress): Promise<void> {
    await this.local.save({ ...progress, pendingSync: true });
  }

  async completeLevel(userId: string, completedLevel: CompletedLevelData): Promise<LocalProgress> {
    // The backend rejects a non-UUID levelId with 422; never persist/sync a slug fallback id.
    if (!isUuid(completedLevel.levelId)) {
      const current = await this.local.load(userId);
      return current ?? ProgressFacade.emptyProgress(userId, completedLevel.completedAt);
    }

    const local = await this.local.load(userId);
    const updated = this.mergeCompletion(
      local ?? ProgressFacade.emptyProgress(userId, completedLevel.completedAt),
      completedLevel,
    );
    await this.local.save({ ...updated, pendingSync: true });

    try {
      await this.remote.completeLevel(completedLevel);
      const remote = await this.remote.fetchRemote();
      await this.local.save({ ...remote, pendingSync: false });
      return remote;
    } catch (error) {
      if (!ProgressFacade.isPermanentRejection(error)) throw error;
      // The backend will never accept this payload (e.g. a clearly invalid
      // far-future completedAt from a broken device clock). Keep the level
      // recorded locally but resolve the pending state so the player is never
      // stuck retrying it forever (MAZ-190).
      return this.resolvePending(userId, updated);
    }
  }

  async sync(userId: string): Promise<LocalProgress> {
    const local = await this.local.load(userId);
    const levels: CompletedLevelData[] = local?.completedLevels ?? [];
    try {
      const merged = await this.remote.sync(levels);
      await this.local.save({ ...merged, pendingSync: false });
      return merged;
    } catch (error) {
      if (local === null || !ProgressFacade.isPermanentRejection(error)) throw error;
      return this.resolvePending(userId, local);
    }
  }

  async hasPendingSync(userId: string): Promise<boolean> {
    const local = await this.local.load(userId);
    return local?.pendingSync ?? false;
  }

  // Drain offline progress: if a completion is pending (saved while offline or
  // after a failed victory write), push it to the backend via sync(). Returns
  // whether a drain actually happened so a trigger can avoid needless network.
  async drainPendingProgress(userId: string): Promise<boolean> {
    const pending = await this.hasPendingSync(userId);
    if (!pending) return false;
    await this.sync(userId);
    return true;
  }

  // A permanent rejection (HTTP 422 / 400) will never succeed on retry, so the
  // pending state must be resolved instead of looped. A retryable failure (network
  // / 5xx) keeps pending. The error `code` is duck-typed, mirroring how
  // LeaderboardViewModel reads NOT_FOUND without importing the HttpError type.
  private static isPermanentRejection(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('code' in error)) return false;
    const code = (error as { code?: unknown }).code;
    return code === 'UNPROCESSABLE' || code === 'BAD_REQUEST';
  }

  private async resolvePending(userId: string, progress: LocalProgress): Promise<LocalProgress> {
    const resolved = { ...progress, userId, pendingSync: false };
    await this.local.save(resolved);
    return resolved;
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

  private mergeCompletion(progress: LocalProgress, completedLevel: CompletedLevelData): LocalProgress {
    return {
      ...progress,
      updatedAt: completedLevel.completedAt,
      completedLevels: this.progressMergePolicy.mergeCompletion(progress.completedLevels, completedLevel),
      pendingSync: true,
    };
  }
}
