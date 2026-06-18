export type SoundKey = 'level_complete' | 'move' | 'error' | 'win';

export interface IAudioPlayer {
  play(sound: SoundKey): Promise<void>;
}
