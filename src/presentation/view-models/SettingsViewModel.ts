import type { AppSettings, ISettingsRepository } from "@/application/ports/ISettingsRepository";
import { ObservableViewModel } from "./ObservableViewModel";

const DEFAULT_SETTINGS: AppSettings = { language: "en", muted: false };

type AudioMuteControls = {
  mute(): void;
  unmute(): void;
};

/**
 * MVVM — settings ViewModel.
 *
 * Owns the persisted `AppSettings` and keeps the audio mute flag in sync through
 * the `AudioFacade`. The settings screen reads state and dispatches intents
 * here; it never touches storage or the audio player directly.
 */
export class SettingsViewModel extends ObservableViewModel<AppSettings> {
  constructor(
    private readonly repository: ISettingsRepository,
    private readonly audio: AudioMuteControls
  ) {
    super({ ...DEFAULT_SETTINGS });
  }

  async load(): Promise<void> {
    const settings = await this.repository.load();
    this.applyMute(settings.muted);
    this.setState(settings);
  }

  async setLanguage(language: AppSettings["language"]): Promise<void> {
    await this.persist({ ...this.getState(), language });
  }

  async setMuted(muted: boolean): Promise<void> {
    this.applyMute(muted);
    await this.persist({ ...this.getState(), muted });
  }

  private applyMute(muted: boolean): void {
    if (muted) {
      this.audio.mute();
    } else {
      this.audio.unmute();
    }
  }

  private async persist(settings: AppSettings): Promise<void> {
    this.setState(settings);
    await this.repository.save(settings);
  }
}
