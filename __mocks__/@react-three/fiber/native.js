/**
 * Manual Jest mock for `@react-three/fiber/native`.
 *
 * Canvas renders as a plain RN View and intentionally drops its R3F children:
 * component tests assert the React Native shell, while pure geometry tests cover
 * the scene descriptors. The real R3F renderer runs unchanged in Expo.
 */
const { View } = require("react-native");

module.exports = {
  __esModule: true,
  Canvas: View,
  useFrame: () => undefined,
  useThree: () => ({
    camera: {
      position: { set: () => {} },
      lookAt: () => {},
    },
    scene: { position: { x: 0 } },
    gl: {
      render: () => {},
      getContext: () => null,
    },
    size: { width: 1, height: 1 },
  }),
};
