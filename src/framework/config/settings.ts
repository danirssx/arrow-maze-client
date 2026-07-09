import { AsyncStorageAdapter } from '@/infrastructure/storage/AsyncStorageAdapter';
import { SettingsRepository } from '@/infrastructure/storage/SettingsRepository';
import { ChangeLanguageUseCase } from '@/application/settings/ChangeLanguageUseCase';
import { ChangeMuteUseCase } from '@/application/settings/ChangeMuteUseCase';
import { LoadSettingsUseCase } from '@/application/settings/LoadSettingsUseCase';
import { I18nLanguageService } from '@/framework/i18n/I18nLanguageService';
import { SettingsViewModel } from '@/presentation/view-models/SettingsViewModel';
import { createAudioFacade } from './audio';

export function createSettingsViewModel(): SettingsViewModel {
  const repo = new SettingsRepository(new AsyncStorageAdapter());
  const audio = createAudioFacade();
  const languageService = new I18nLanguageService();

  return new SettingsViewModel(
    new LoadSettingsUseCase(repo),
    new ChangeLanguageUseCase(repo, languageService),
    new ChangeMuteUseCase(repo, audio),
  );
}
