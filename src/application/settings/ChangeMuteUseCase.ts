import type { AppSettings, ISettingsRepository } from '@/application/ports/ISettingsRepository';
import type { IAudioMuteService } from '@/application/ports/IAudioMuteService';

export class ChangeMuteUseCase {
  constructor(
    private readonly repo: ISettingsRepository,
    private readonly audioService: IAudioMuteService,
  ) {}

  async execute(muted: boolean): Promise<AppSettings> {
    const current = await this.repo.load();
    const updated = { ...current, muted };
    await this.repo.save(updated);
    if (muted) {
      this.audioService.mute();
    } else {
      this.audioService.unmute();
    }
    return updated;
  }
}
