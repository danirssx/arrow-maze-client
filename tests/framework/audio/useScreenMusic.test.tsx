import { Text } from "react-native";

import type { MusicTrackKey } from "@/application/ports/IAudioPlayer";
import { useScreenMusic } from "@/framework/audio/useScreenMusic";
import { renderWithProviders } from "../../presentation/testUtils";

jest.mock("expo-router", () => {
  const React = jest.requireActual("react");
  return {
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(effect, [effect]);
    },
  };
});

const mockMusic = {
  started: [] as MusicTrackKey[],
  stopped: [] as MusicTrackKey[],
  startMusic: jest.fn(async (track: MusicTrackKey) => {
    mockMusic.started.push(track);
  }),
  stopMusic: jest.fn(async (track: MusicTrackKey) => {
    mockMusic.stopped.push(track);
  }),
};

jest.mock("@/framework/config/audio", () => ({
  createAudioFacade: () => mockMusic,
}));

function MusicProbe({ track }: { track: MusicTrackKey }) {
  useScreenMusic(track);
  return <Text testID="music-probe">ready</Text>;
}

describe("useScreenMusic", () => {
  beforeEach(() => {
    mockMusic.started = [];
    mockMusic.stopped = [];
    mockMusic.startMusic.mockClear();
    mockMusic.stopMusic.mockClear();
  });

  it("should_start_and_stop_home_music_with_screen_lifecycle", () => {
    const screen = renderWithProviders(<MusicProbe track="home" />);

    expect(mockMusic.started).toEqual(["home"]);

    screen.unmount();

    expect(mockMusic.stopped).toEqual(["home"]);
  });

  it("should_start_and_stop_gameplay_music_with_screen_lifecycle", () => {
    const screen = renderWithProviders(<MusicProbe track="gameplay" />);

    expect(mockMusic.started).toEqual(["gameplay"]);

    screen.unmount();

    expect(mockMusic.stopped).toEqual(["gameplay"]);
  });
});
