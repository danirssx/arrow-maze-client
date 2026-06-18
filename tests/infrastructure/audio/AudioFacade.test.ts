import { AudioFacade } from '@/infrastructure/audio/AudioFacade';
import type { IAudioPlayer, SoundKey } from '@/application/ports/IAudioPlayer';

class FakePlayer implements IAudioPlayer {
  played: SoundKey[] = [];
  async play(sound: SoundKey): Promise<void> { this.played.push(sound); }
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
    await facade.play('level_complete');
    expect(player.played).toContain('level_complete');
  });

  it('should_not_play_sound_when_muted', async () => {
    facade.mute();
    await facade.play('level_complete');
    expect(player.played).toHaveLength(0);
  });

  it('should_resume_playing_after_unmute', async () => {
    facade.mute();
    await facade.play('move');
    facade.unmute();
    await facade.play('win');
    expect(player.played).toEqual(['win']);
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
});
