import { SettingsRepository } from '@/infrastructure/storage/SettingsRepository';
import type { ILocalStorage } from '@/application/ports/ILocalStorage';

class FakeStorage implements ILocalStorage {
  private store = new Map<string, string>();
  async getItem(key: string): Promise<string | null> { return this.store.get(key) ?? null; }
  async setItem(key: string, value: string): Promise<void> { this.store.set(key, value); }
  async removeItem(key: string): Promise<void> { this.store.delete(key); }
  async clear(): Promise<void> { this.store.clear(); }
}

describe('SettingsRepository', () => {
  let storage: FakeStorage;
  let repo: SettingsRepository;

  beforeEach(() => {
    storage = new FakeStorage();
    repo = new SettingsRepository(storage);
  });

  it('should_return_defaults_when_no_settings_saved', async () => {
    const settings = await repo.load();
    expect(settings.language).toBe('en');
    expect(settings.muted).toBe(false);
  });

  it('should_persist_and_reload_settings', async () => {
    await repo.save({ language: 'es', muted: true });
    const loaded = await repo.load();
    expect(loaded.language).toBe('es');
    expect(loaded.muted).toBe(true);
  });

  it('should_merge_with_defaults_for_partial_stored_data', async () => {
    await storage.setItem('arrow_maze_settings', JSON.stringify({ language: 'es' }));
    const loaded = await repo.load();
    expect(loaded.language).toBe('es');
    expect(loaded.muted).toBe(false);
  });
});
