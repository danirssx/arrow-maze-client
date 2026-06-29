import { LocalProgressRepository } from '@/infrastructure/repositories/LocalProgressRepository';
import type { ILocalStorage } from '@/application/ports/ILocalStorage';
import type { LocalProgress } from '@/application/ports/IProgressRepository';

class FakeStorage implements ILocalStorage {
  private store = new Map<string, string>();
  async getItem(key: string): Promise<string | null> { return this.store.get(key) ?? null; }
  async setItem(key: string, value: string): Promise<void> { this.store.set(key, value); }
  async removeItem(key: string): Promise<void> { this.store.delete(key); }
  async clear(): Promise<void> { this.store.clear(); }
}

const BASE_PROGRESS: LocalProgress = {
  progressId: 'p-1',
  userId: 'user-1',
  version: 1,
  updatedAt: '2026-06-18T00:00:00.000Z',
  completedLevels: [
    { levelId: '550e8400-e29b-41d4-a716-446655440010', score: 100, timeSeconds: 30, movesCount: 10, completedAt: '2026-06-18T00:00:00.000Z' },
  ],
  pendingSync: false,
};

describe('LocalProgressRepository', () => {
  let storage: FakeStorage;
  let repo: LocalProgressRepository;

  beforeEach(() => {
    storage = new FakeStorage();
    repo = new LocalProgressRepository(storage);
  });

  it('should_return_null_when_no_progress_saved', async () => {
    expect(await repo.load('user-1')).toBeNull();
  });

  it('should_return_saved_progress', async () => {
    await repo.save(BASE_PROGRESS);
    const loaded = await repo.load('user-1');
    expect(loaded?.progressId).toBe('p-1');
    expect(loaded?.completedLevels).toHaveLength(1);
  });

  it('should_mark_pending_sync_when_progress_exists', async () => {
    await repo.save(BASE_PROGRESS);
    await repo.markPendingSync('user-1');
    const loaded = await repo.load('user-1');
    expect(loaded?.pendingSync).toBe(true);
  });

  it('should_clear_pending_sync', async () => {
    await repo.save({ ...BASE_PROGRESS, pendingSync: true });
    await repo.clearPendingSync('user-1');
    const loaded = await repo.load('user-1');
    expect(loaded?.pendingSync).toBe(false);
  });

  it('should_not_throw_when_marking_pending_sync_on_missing_entry', async () => {
    await expect(repo.markPendingSync('unknown-user')).resolves.not.toThrow();
  });
});
