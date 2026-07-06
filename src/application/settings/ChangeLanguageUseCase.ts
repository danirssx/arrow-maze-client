import type { AppSettings, ISettingsRepository } from '@/application/ports/ISettingsRepository';
import type { ILanguageService } from '@/application/ports/ILanguageService';

export class ChangeLanguageUseCase {
  constructor(
    private readonly repo: ISettingsRepository,
    private readonly languageService: ILanguageService,
  ) {}

  async execute(language: AppSettings['language']): Promise<AppSettings> {
    const current = await this.repo.load();
    const updated = { ...current, language };
    await this.repo.save(updated);
    await this.languageService.changeLanguage(language);
    return updated;
  }
}
