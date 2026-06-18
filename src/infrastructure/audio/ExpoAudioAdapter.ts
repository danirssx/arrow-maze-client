// Pattern: Adapter — wraps expo-av Sound for testable IAudioPlayer
import { Audio } from 'expo-av';
import type { IAudioPlayer, SoundKey } from '@/application/ports/IAudioPlayer';

const SOUND_ASSETS: Record<SoundKey, number> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  level_complete: require('../../../assets/sounds/level_complete.mp3') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  move: require('../../../assets/sounds/move.mp3') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  error: require('../../../assets/sounds/error.mp3') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  win: require('../../../assets/sounds/win.mp3') as number,
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
