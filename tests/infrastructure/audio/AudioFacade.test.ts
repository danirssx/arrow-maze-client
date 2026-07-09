import { AudioFacade } from '@/infrastructure/audio/AudioFacade';
import type { AudioPlayback, IAudioPlayer, MusicTrackKey, SoundEffectKey } from '@/application/ports/IAudioPlayer';

class FakePlayer implements IAudioPlayer {
  played: SoundEffectKey[] = [];
  startedMusic: MusicTrackKey[] = [];
  stoppedMusic: MusicTrackKey[] = [];

  async playEffect(sound: SoundEffectKey): Promise<void> {
    this.played.push(sound);
  }

  async startMusic(track: MusicTrackKey): Promise<AudioPlayback> {
    this.startedMusic.push(track);
    return {
      stop: async () => {
        this.stoppedMusic.push(track);
      },
    };
  }
}

describe('AudioFacade', () => {
  let player: FakePlayer;
  let facade: AudioFacade;

  beforeEach(() => {
    AudioFacade.resetInstance();
    player = new FakePlayer();
    facade = AudioFacade.getInstance(player);
  });

  it('should_play_sound_when_not_muted', async () => {
    await facade.playEffect('victory');
    expect(player.played).toContain('victory');
  });

  it('should_not_play_sound_when_muted', async () => {
    facade.mute();
    await facade.playEffect('victory');
    expect(player.played).toHaveLength(0);
  });

  it('should_resume_playing_after_unmute', async () => {
    facade.mute();
    await facade.playEffect('move');
    facade.unmute();
    await facade.playEffect('victory');
    expect(player.played).toEqual(['victory']);
  });

  it('should_report_muted_state_correctly', () => {
    expect(facade.muted).toBe(false);
    facade.mute();
    expect(facade.muted).toBe(true);
    facade.unmute();
    expect(facade.muted).toBe(false);
  });

  it('should_return_same_instance_when_called_twice', () => {
    const a = AudioFacade.getInstance(player);
    const b = AudioFacade.getInstance(player);
    expect(a).toBe(b);
  });

  it('should_start_and_stop_looping_music_when_not_muted', async () => {
    await facade.startMusic('home');

    expect(player.startedMusic).toEqual(['home']);

    await facade.stopMusic('home');

    expect(player.stoppedMusic).toEqual(['home']);
  });

  it('should_stop_active_music_when_muted', async () => {
    await facade.startMusic('gameplay');

    facade.mute();

    expect(player.stoppedMusic).toEqual(['gameplay']);
  });

  it('should_not_start_music_when_muted', async () => {
    facade.mute();

    await facade.startMusic('home');

    expect(player.startedMusic).toHaveLength(0);
  });
});
