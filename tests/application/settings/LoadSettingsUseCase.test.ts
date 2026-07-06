import { LoadSettingsUseCase } from '@/application/settings/LoadSettingsUseCase';
import type { AppSettings, ISettingsRepository } from '@/application/ports/ISettingsRepository';

const DEFAULT: AppSettings = { language: 'en', muted: false };

class FakeSettingsRepository implements ISettingsRepository {
  constructor(private data: AppSettings = { ...DEFAULT }) {}
  async load(): Promise<AppSettings> { return { ...this.data }; }
  async save(s: AppSettings): Promise<void> { this.data = { ...s }; }
}

describe('LoadSettingsUseCase', () => {
  it('should_return_saved_settings', async () => {
    const repo = new FakeSettingsRepository({ language: 'es', muted: true });
    const result = await new LoadSettingsUseCase(repo).execute();
    expect(result).toEqual({ language: 'es', muted: true });
  });

  it('should_return_defaults_when_no_settings_saved', async () => {
    const repo = new FakeSettingsRepository();
    const result = await new LoadSettingsUseCase(repo).execute();
    expect(result).toEqual({ language: 'en', muted: false });
  });
});
