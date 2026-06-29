/**
 * Jest setup — route the native-backed graphics libraries used only by the
 * presentation layer to deterministic manual mocks in `__mocks__/`. Tests assert
 * observable structure (tap targets, overlays), not animation frames: SVG
 * primitives render as plain Views and Reanimated hooks resolve synchronously.
 * The real libraries run unchanged in the Expo app build.
 *
 * The mocks live in `__mocks__/*.js` (not inline factories) on purpose: an inline
 * `jest.mock` factory that touched `createElement` would trip the NativeWind Babel
 * transform's out-of-scope guard (`_ReactNativeCSSInterop`).
 */
jest.mock("react-native-svg");
jest.mock("react-native-reanimated");

// AsyncStorage is a native module; route it to an in-memory mock so any module
// that transitively imports the session/storage layer (e.g. the http client's
// token provider) can be unit-tested without the native binding.
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));
