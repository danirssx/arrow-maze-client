import type { AppSettings } from '@/application/ports/ISettingsRepository';
import type { LoadSettingsUseCase } from '@/application/settings/LoadSettingsUseCase';
import type { ChangeLanguageUseCase } from '@/application/settings/ChangeLanguageUseCase';
import type { ChangeMuteUseCase } from '@/application/settings/ChangeMuteUseCase';
import { ObservableViewModel } from './ObservableViewModel';

const DEFAULT_SETTINGS: AppSettings = { language: 'en', muted: false };

export class SettingsViewModel extends ObservableViewModel<AppSettings> {
  constructor(
    private readonly loadSettings: LoadSettingsUseCase,
    private readonly changeLanguage: ChangeLanguageUseCase,
    private readonly changeMute: ChangeMuteUseCase,
  ) {
    super({ ...DEFAULT_SETTINGS });
  }

  async load(): Promise<void> {
    const settings = await this.loadSettings.execute();
    this.setState(settings);
  }

  async setLanguage(language: AppSettings['language']): Promise<void> {
    const updated = await this.changeLanguage.execute(language);
    this.setState(updated);
  }

  async setMuted(muted: boolean): Promise<void> {
    const updated = await this.changeMute.execute(muted);
    this.setState(updated);
  }
}
