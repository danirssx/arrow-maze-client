// Pattern: Facade, Singleton — single audio control surface; mute blocks all playback
import type { AudioPlayback, IAudioPlayer, MusicTrackKey, SoundEffectKey } from '@/application/ports/IAudioPlayer';

export class AudioFacade {
  private static instance: AudioFacade | null = null;
  private _muted = false;
  private readonly music = new Map<MusicTrackKey, AudioPlayback>();

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
    void this.stopAllMusic();
  }

  unmute(): void {
    this._muted = false;
  }

  async playEffect(sound: SoundEffectKey): Promise<void> {
    if (this._muted) return;
    await this.player.playEffect(sound);
  }

  async startMusic(track: MusicTrackKey): Promise<void> {
    if (this._muted || this.music.has(track)) return;
    const playback = await this.player.startMusic(track);
    if (this._muted) {
      await playback.stop();
      return;
    }
    this.music.set(track, playback);
  }

  async stopMusic(track: MusicTrackKey): Promise<void> {
    const playback = this.music.get(track);
    if (playback === undefined) return;
    this.music.delete(track);
    await playback.stop();
  }

  private async stopAllMusic(): Promise<void> {
    await Promise.all([...this.music.keys()].map((track) => this.stopMusic(track)));
  }
}
