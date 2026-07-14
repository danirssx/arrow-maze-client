/* global jest */
/**
 * Manual Jest mock for `expo-gl`.
 *
 * R3F/native uses expo-gl's GLView to obtain a WebGL context. In Jest there is
 * no native GL runtime, so we stub the surface with a minimal no-op object that
 * satisfies R3F's canvas duck-type (the Canvas mock already renders as a plain
 * View, so these stubs are never actually invoked — they exist to prevent
 * "Cannot find module" errors when the module is resolved transitively).
 */
module.exports = {
  __esModule: true,
  GLView: {
    createContextAsync: jest.fn().mockResolvedValue({}),
  },
  ExpoWebGLRenderingContext: {},
};
