import { Audio } from "expo-av";

import { ExpoAudioAdapter } from "@/infrastructure/audio/ExpoAudioAdapter";

type ExpoAvMock = typeof Audio & {
  __playback: {
    playAsync: jest.Mock;
    setIsLoopingAsync: jest.Mock;
    stopAsync: jest.Mock;
    unloadAsync: jest.Mock;
    setOnPlaybackStatusUpdate: jest.Mock;
  };
  __reset: () => void;
};

describe("ExpoAudioAdapter", () => {
  let adapter: ExpoAudioAdapter;
  let audio: ExpoAvMock;

  beforeEach(() => {
    audio = Audio as ExpoAvMock;
    audio.__reset();
    adapter = new ExpoAudioAdapter();
  });

  it("should_play_and_unload_one_shot_effect_when_effect_finishes", async () => {
    await adapter.playEffect("move");

    expect(audio.Sound.createAsync).toHaveBeenCalledTimes(1);
    expect(audio.__playback.playAsync).toHaveBeenCalledTimes(1);

    const statusListener = audio.__playback.setOnPlaybackStatusUpdate.mock.calls[0]?.[0];
    statusListener({ isLoaded: true, didJustFinish: true });

    expect(audio.__playback.unloadAsync).toHaveBeenCalledTimes(1);
  });

  it("should_start_looping_music_and_stop_the_returned_playback", async () => {
    const playback = await adapter.startMusic("home");

    expect(audio.Sound.createAsync).toHaveBeenCalledTimes(1);
    expect(audio.__playback.setIsLoopingAsync).toHaveBeenCalledWith(true);
    expect(audio.__playback.playAsync).toHaveBeenCalledTimes(1);

    await playback.stop();

    expect(audio.__playback.stopAsync).toHaveBeenCalledTimes(1);
    expect(audio.__playback.unloadAsync).toHaveBeenCalledTimes(1);
  });
});
