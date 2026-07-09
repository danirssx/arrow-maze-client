// Pattern: Adapter — wraps expo-av Sound for testable IAudioPlayer
import { Audio } from 'expo-av';
import type { AudioPlayback, IAudioPlayer, MusicTrackKey, SoundEffectKey } from '@/application/ports/IAudioPlayer';

const EFFECT_ASSETS: Record<SoundEffectKey, number> = {
  move: require('../../../assets/sounds/move.wav') as number,
  undo: require('../../../assets/sounds/undo.wav') as number,
  victory: require('../../../assets/sounds/victory.wav') as number,
  defeat: require('../../../assets/sounds/defeat.wav') as number,
};

const MUSIC_ASSETS: Record<MusicTrackKey, number> = {
  home: require('../../../assets/sounds/home_music.wav') as number,
  gameplay: require('../../../assets/sounds/gameplay_music.wav') as number,
};

export class ExpoAudioAdapter implements IAudioPlayer {
  async playEffect(sound: SoundEffectKey): Promise<void> {
    const { sound: audioObj } = await Audio.Sound.createAsync(EFFECT_ASSETS[sound]);
    await audioObj.playAsync();
    audioObj.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void audioObj.unloadAsync();
      }
    });
  }

  async startMusic(track: MusicTrackKey): Promise<AudioPlayback> {
    const { sound: audioObj } = await Audio.Sound.createAsync(MUSIC_ASSETS[track]);
    await audioObj.setIsLoopingAsync(true);
    await audioObj.playAsync();
    return {
      stop: async () => {
        await audioObj.stopAsync();
        await audioObj.unloadAsync();
      },
    };
  }
}
