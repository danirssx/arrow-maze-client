import { ProgressFacade } from '@/application/facades/ProgressFacade';
import type { CompletedLevelData, IProgressRepository, LocalProgress } from '@/application/ports/IProgressRepository';
import type { IRemoteProgressRepository } from '@/application/ports/IRemoteProgressRepository';

const REMOTE_PROGRESS: LocalProgress = {
  progressId: 'p-remote', userId: 'user-1', version: 2,
  updatedAt: '2026-06-18T00:00:00.000Z',
  completedLevels: [{ levelId: 'level-1', score: 200, timeSeconds: 25, movesCount: 8, completedAt: '2026-06-18T00:00:00.000Z' }],
  pendingSync: false,
};

const LOCAL_PROGRESS: LocalProgress = {
  progressId: 'p-local', userId: 'user-1', version: 1,
  updatedAt: '2026-06-17T00:00:00.000Z',
  completedLevels: [],
  pendingSync: false,
};

class FakeLocalRepo implements IProgressRepository {
  private store = new Map<string, LocalProgress>();
  readonly saved: LocalProgress[] = [];
  async load(userId: string): Promise<LocalProgress | null> { return this.store.get(userId) ?? null; }
  async save(progress: LocalProgress): Promise<void> {
    this.saved.push(progress);
    this.store.set(progress.userId, progress);
  }
  async markPendingSync(userId: string): Promise<void> {
    const p = this.store.get(userId);
    if (p) this.store.set(userId, { ...p, pendingSync: true });
  }
  async clearPendingSync(userId: string): Promise<void> {
    const p = this.store.get(userId);
    if (p) this.store.set(userId, { ...p, pendingSync: false });
  }
}

class FakeHttpProgressRepo implements IRemoteProgressRepository {
  fetchResult = REMOTE_PROGRESS;
  syncResult = REMOTE_PROGRESS;
  completed: CompletedLevelData | null = null;
  syncedLevels: CompletedLevelData[] | null = null;
  async fetchRemote(_token: string): Promise<LocalProgress> { return this.fetchResult; }
  async completeLevel(_token: string, completedLevel: CompletedLevelData): Promise<void> {
    this.completed = completedLevel;
  }
  async sync(_token: string, levels: CompletedLevelData[]): Promise<LocalProgress> {
    this.syncedLevels = levels;
    return this.syncResult;
  }
}

describe('ProgressFacade', () => {
  let local: FakeLocalRepo;
  let remote: FakeHttpProgressRepo;
  let facade: ProgressFacade;

  beforeEach(() => {
    local = new FakeLocalRepo();
    remote = new FakeHttpProgressRepo();
    facade = new ProgressFacade(local, remote);
  });

  it('should_return_cached_progress_without_fetching_remote', async () => {
    await local.save(LOCAL_PROGRESS);
    const result = await facade.load('user-1', 'token-placeholder');
    expect(result.progressId).toBe('p-local');
  });

  it('should_fetch_remote_and_cache_when_no_local_exists', async () => {
    const result = await facade.load('user-1', 'token-placeholder');
    expect(result.progressId).toBe('p-remote');
    const cached = await local.load('user-1');
    expect(cached).not.toBeNull();
  });

  it('should_mark_pending_sync_when_saving_offline', async () => {
    await facade.saveOffline(LOCAL_PROGRESS);
    const loaded = await local.load('user-1');
    expect(loaded?.pendingSync).toBe(true);
  });

  it('should_clear_pending_sync_after_successful_sync', async () => {
    await local.save({ ...LOCAL_PROGRESS, pendingSync: true });
    const merged = await facade.sync('user-1', 'token-placeholder');
    expect(merged.pendingSync).toBe(false);
    const stored = await local.load('user-1');
    expect(stored?.pendingSync).toBe(false);
  });

  it('should_send_local_completed_levels_when_syncing_pending_progress', async () => {
    const completedLevel = REMOTE_PROGRESS.completedLevels[0]!;
    await local.save({ ...LOCAL_PROGRESS, completedLevels: [completedLevel], pendingSync: true });

    await facade.sync('user-1', 'token-placeholder');

    expect(remote.syncedLevels).toEqual([completedLevel]);
  });

  it('should_sync_empty_completed_levels_when_no_local_progress_exists', async () => {
    await facade.sync('user-1', 'token-placeholder');

    expect(remote.syncedLevels).toEqual([]);
  });

  it('should_complete_level_remotely_and_cache_latest_progress', async () => {
    const completedLevel: CompletedLevelData = {
      levelId: 'level-2',
      score: 900,
      timeSeconds: 10,
      movesCount: 2,
      completedAt: '2026-06-18T00:00:00.000Z',
    };
    const result = await facade.completeLevel('user-1', 'token-placeholder', completedLevel);
    expect(remote.completed).toEqual(completedLevel);
    expect(result.progressId).toBe('p-remote');
    const stored = await local.load('user-1');
    expect(stored?.pendingSync).toBe(false);
  });

  it('should_keep_existing_best_completion_when_saving_pending_local_completion', async () => {
    const existingBest: CompletedLevelData = {
      levelId: 'level-1',
      score: 500,
      timeSeconds: 20,
      movesCount: 8,
      completedAt: '2026-06-17T00:00:00.000Z',
    };
    await local.save({ ...LOCAL_PROGRESS, completedLevels: [existingBest] });
    local.saved.length = 0;

    await facade.completeLevel('user-1', 'token-placeholder', {
      levelId: 'level-1',
      score: 100,
      timeSeconds: 10,
      movesCount: 2,
      completedAt: '2026-06-18T00:00:00.000Z',
    });

    expect(local.saved[0]?.pendingSync).toBe(true);
    expect(local.saved[0]?.completedLevels).toEqual([existingBest]);
  });

  it('should_create_pending_local_progress_when_completing_without_cached_progress', async () => {
    const completedLevel: CompletedLevelData = {
      levelId: 'level-1',
      score: 500,
      timeSeconds: 10,
      movesCount: 2,
      completedAt: '2026-06-18T00:00:00.000Z',
    };

    await facade.completeLevel('user-1', 'token-placeholder', completedLevel);

    expect(local.saved[0]).toMatchObject({
      progressId: 'local-user-1',
      userId: 'user-1',
      pendingSync: true,
      completedLevels: [completedLevel],
    });
  });

  it('should_report_pending_sync_true_when_flagged', async () => {
    await local.save({ ...LOCAL_PROGRESS, pendingSync: true });
    expect(await facade.hasPendingSync('user-1')).toBe(true);
  });

  it('should_report_pending_sync_false_when_no_progress', async () => {
    expect(await facade.hasPendingSync('user-1')).toBe(false);
  });
});
