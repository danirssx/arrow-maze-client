import { ChangeLanguageUseCase } from '@/application/settings/ChangeLanguageUseCase';
import type { AppSettings, ISettingsRepository } from '@/application/ports/ISettingsRepository';
import type { ILanguageService } from '@/application/ports/ILanguageService';

class FakeSettingsRepository implements ISettingsRepository {
  data: AppSettings = { language: 'en', muted: false };
  async load(): Promise<AppSettings> { return { ...this.data }; }
  async save(s: AppSettings): Promise<void> { this.data = { ...s }; }
}

class FakeLanguageService implements ILanguageService {
  changed: string[] = [];
  async changeLanguage(lang: 'en' | 'es'): Promise<void> { this.changed.push(lang); }
}

describe('ChangeLanguageUseCase', () => {
  it('should_persist_the_new_language_and_notify_the_service', async () => {
    const repo = new FakeSettingsRepository();
    const svc = new FakeLanguageService();

    const result = await new ChangeLanguageUseCase(repo, svc).execute('es');

    expect(result.language).toBe('es');
    expect(repo.data.language).toBe('es');
    expect(svc.changed).toEqual(['es']);
  });

  it('should_preserve_existing_mute_state', async () => {
    const repo = new FakeSettingsRepository();
    repo.data = { language: 'en', muted: true };
    const svc = new FakeLanguageService();

    const result = await new ChangeLanguageUseCase(repo, svc).execute('es');

    expect(result.muted).toBe(true);
  });
});
