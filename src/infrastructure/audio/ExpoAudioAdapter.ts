// Pattern: Adapter — wraps expo-av Sound for testable IAudioPlayer
import { Audio } from 'expo-av';
import type { IAudioPlayer, SoundKey } from '@/application/ports/IAudioPlayer';

type SoundAssetMap = Partial<Record<SoundKey, number>>;

export class ExpoAudioAdapter implements IAudioPlayer {
  constructor(private readonly soundAssets: SoundAssetMap = {}) {}

  async play(sound: SoundKey): Promise<void> {
    const asset = this.soundAssets[sound];
    if (asset === undefined) return;

    const { sound: audioObj } = await Audio.Sound.createAsync(asset);
    await audioObj.playAsync();
    audioObj.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void audioObj.unloadAsync();
      }
    });
  }
}
