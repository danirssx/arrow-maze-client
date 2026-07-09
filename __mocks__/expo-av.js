/* global jest */
const playback = {
  playAsync: jest.fn(() => Promise.resolve()),
  setIsLoopingAsync: jest.fn(() => Promise.resolve()),
  stopAsync: jest.fn(() => Promise.resolve()),
  unloadAsync: jest.fn(() => Promise.resolve()),
  setOnPlaybackStatusUpdate: jest.fn(),
};

const Audio = {
  Sound: {
    createAsync: jest.fn(() => Promise.resolve({ sound: playback })),
  },
  __playback: playback,
  __reset: () => {
    playback.playAsync.mockClear();
    playback.setIsLoopingAsync.mockClear();
    playback.stopAsync.mockClear();
    playback.unloadAsync.mockClear();
    playback.setOnPlaybackStatusUpdate.mockClear();
    Audio.Sound.createAsync.mockClear();
  },
};

module.exports = { Audio };
