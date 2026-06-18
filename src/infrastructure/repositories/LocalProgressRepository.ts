// Pattern: Repository, Adapter
import type { IProgressRepository, LocalProgress } from '@/application/ports/IProgressRepository';
import type { ILocalStorage } from '@/application/ports/ILocalStorage';

const progressKey = (userId: string) => `arrow_maze_progress_${userId}`;

export class LocalProgressRepository implements IProgressRepository {
  constructor(private readonly storage: ILocalStorage) {}

  async load(userId: string): Promise<LocalProgress | null> {
    const raw = await this.storage.getItem(progressKey(userId));
    if (raw === null) return null;
    return JSON.parse(raw) as LocalProgress;
  }

  async save(progress: LocalProgress): Promise<void> {
    await this.storage.setItem(progressKey(progress.userId), JSON.stringify(progress));
  }

  async markPendingSync(userId: string): Promise<void> {
    const progress = await this.load(userId);
    if (progress === null) return;
    await this.save({ ...progress, pendingSync: true });
  }

  async clearPendingSync(userId: string): Promise<void> {
    const progress = await this.load(userId);
    if (progress === null) return;
    await this.save({ ...progress, pendingSync: false });
  }
}
