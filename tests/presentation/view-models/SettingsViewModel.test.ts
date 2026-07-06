import { SettingsViewModel } from '@/presentation/view-models/SettingsViewModel';
import { LoadSettingsUseCase } from '@/application/settings/LoadSettingsUseCase';
import { ChangeLanguageUseCase } from '@/application/settings/ChangeLanguageUseCase';
import { ChangeMuteUseCase } from '@/application/settings/ChangeMuteUseCase';
import type { AppSettings, ISettingsRepository } from '@/application/ports/ISettingsRepository';
import type { ILanguageService } from '@/application/ports/ILanguageService';
import type { IAudioMuteService } from '@/application/ports/IAudioMuteService';

class FakeRepo implements ISettingsRepository {
  data: AppSettings = { language: 'en', muted: false };
  async load(): Promise<AppSettings> { return { ...this.data }; }
  async save(s: AppSettings): Promise<void> { this.data = { ...s }; }
}

class FakeLang implements ILanguageService {
  async changeLanguage(_lang: 'en' | 'es'): Promise<void> {}
}

class FakeAudio implements IAudioMuteService {
  mute(): void {}
  unmute(): void {}
}

function makeViewModel(repo: FakeRepo) {
  return new SettingsViewModel(
    new LoadSettingsUseCase(repo),
    new ChangeLanguageUseCase(repo, new FakeLang()),
    new ChangeMuteUseCase(repo, new FakeAudio()),
  );
}

describe('SettingsViewModel', () => {
  it('should_start_with_default_settings', () => {
    const vm = makeViewModel(new FakeRepo());
    expect(vm.getState()).toEqual({ language: 'en', muted: false });
  });

  it('should_update_state_after_load', async () => {
    const repo = new FakeRepo();
    repo.data = { language: 'es', muted: true };
    const vm = makeViewModel(repo);

    await vm.load();

    expect(vm.getState()).toEqual({ language: 'es', muted: true });
  });

  it('should_update_state_after_setLanguage', async () => {
    const vm = makeViewModel(new FakeRepo());
    await vm.setLanguage('es');
    expect(vm.getState().language).toBe('es');
  });

  it('should_update_state_after_setMuted', async () => {
    const vm = makeViewModel(new FakeRepo());
    await vm.setMuted(true);
    expect(vm.getState().muted).toBe(true);
  });

  it('should_notify_subscribers_when_state_changes', async () => {
    const vm = makeViewModel(new FakeRepo());
    let notified = 0;
    vm.subscribe(() => { notified++; });

    await vm.setLanguage('es');

    expect(notified).toBe(1);
  });
});
