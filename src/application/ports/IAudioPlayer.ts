export type SoundEffectKey = 'move' | 'undo' | 'victory' | 'defeat';
export type MusicTrackKey = 'home' | 'gameplay';

export interface AudioPlayback {
  stop(): Promise<void>;
}

export interface IAudioPlayer {
  playEffect(sound: SoundEffectKey): Promise<void>;
  startMusic(track: MusicTrackKey): Promise<AudioPlayback>;
}
