import { ChangeMuteUseCase } from '@/application/settings/ChangeMuteUseCase';
import type { AppSettings, ISettingsRepository } from '@/application/ports/ISettingsRepository';
import type { IAudioMuteService } from '@/application/ports/IAudioMuteService';

class FakeSettingsRepository implements ISettingsRepository {
  data: AppSettings = { language: 'en', muted: false };
  async load(): Promise<AppSettings> { return { ...this.data }; }
  async save(s: AppSettings): Promise<void> { this.data = { ...s }; }
}

class FakeAudioMuteService implements IAudioMuteService {
  calls: string[] = [];
  mute(): void { this.calls.push('mute'); }
  unmute(): void { this.calls.push('unmute'); }
}

describe('ChangeMuteUseCase', () => {
  it('should_mute_audio_and_persist_when_muted_is_true', async () => {
    const repo = new FakeSettingsRepository();
    const audio = new FakeAudioMuteService();

    const result = await new ChangeMuteUseCase(repo, audio).execute(true);

    expect(result.muted).toBe(true);
    expect(repo.data.muted).toBe(true);
    expect(audio.calls).toEqual(['mute']);
  });

  it('should_unmute_audio_and_persist_when_muted_is_false', async () => {
    const repo = new FakeSettingsRepository();
    repo.data = { language: 'en', muted: true };
    const audio = new FakeAudioMuteService();

    const result = await new ChangeMuteUseCase(repo, audio).execute(false);

    expect(result.muted).toBe(false);
    expect(audio.calls).toEqual(['unmute']);
  });
});
