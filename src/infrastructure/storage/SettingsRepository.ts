// Pattern: Adapter, Repository
import type { ISettingsRepository, AppSettings } from '@/application/ports/ISettingsRepository';
import type { ILocalStorage } from '@/application/ports/ILocalStorage';

const SETTINGS_KEY = 'arrow_maze_settings';
const DEFAULTS: AppSettings = { language: 'en', muted: false };

export class SettingsRepository implements ISettingsRepository {
  constructor(private readonly storage: ILocalStorage) {}

  async load(): Promise<AppSettings> {
    const raw = await this.storage.getItem(SETTINGS_KEY);
    if (raw === null) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  }

  async save(settings: AppSettings): Promise<void> {
    await this.storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}
