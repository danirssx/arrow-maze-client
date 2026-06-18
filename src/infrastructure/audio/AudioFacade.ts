// Pattern: Facade, Singleton — single audio control surface; mute blocks all playback
import type { IAudioPlayer, SoundKey } from '@/application/ports/IAudioPlayer';

export class AudioFacade {
  private static instance: AudioFacade | null = null;
  private _muted = false;

  private constructor(private readonly player: IAudioPlayer) {}

  static getInstance(player: IAudioPlayer): AudioFacade {
    if (AudioFacade.instance === null) {
      AudioFacade.instance = new AudioFacade(player);
    }
    return AudioFacade.instance;
  }

  static resetInstance(): void {
    AudioFacade.instance = null;
  }

  get muted(): boolean {
    return this._muted;
  }

  mute(): void {
    this._muted = true;
  }

  unmute(): void {
    this._muted = false;
  }

  async play(sound: SoundKey): Promise<void> {
    if (this._muted) return;
    await this.player.play(sound);
  }
}
