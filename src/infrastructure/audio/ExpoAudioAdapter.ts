// Pattern: Adapter — wraps expo-av Sound for testable IAudioPlayer
import { Audio } from 'expo-av';
import type { IAudioPlayer, SoundKey } from '@/application/ports/IAudioPlayer';

const SOUND_ASSETS: Record<SoundKey, number> = {
  level_complete: require('../../assets/sounds/level_complete.wav') as number,
  move: require('../../assets/sounds/move.wav') as number,
  error: require('../../assets/sounds/error.wav') as number,
  win: require('../../assets/sounds/win.wav') as number,
};

export class ExpoAudioAdapter implements IAudioPlayer {
  async play(sound: SoundKey): Promise<void> {
    const { sound: audioObj } = await Audio.Sound.createAsync(SOUND_ASSETS[sound]);
    await audioObj.playAsync();
    audioObj.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void audioObj.unloadAsync();
      }
    });
  }
}
