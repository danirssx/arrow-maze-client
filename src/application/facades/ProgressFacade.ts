// Pattern: Facade — ViewModels interact only with this; never with storage or HTTP directly
import type { IProgressRepository, LocalProgress, CompletedLevelData } from '@/application/ports/IProgressRepository';
import type { HttpProgressRepository } from '@/infrastructure/repositories/HttpProgressRepository';

export class ProgressFacade {
  constructor(
    private readonly local: IProgressRepository,
    private readonly remote: HttpProgressRepository,
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
}
