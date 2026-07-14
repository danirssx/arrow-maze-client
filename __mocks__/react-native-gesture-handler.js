/**
 * Manual Jest mock for `react-native-gesture-handler`.
 *
 * GestureHandlerRootView and GestureDetector render their children as plain
 * Views. Gesture.Pan / Pinch / Simultaneous return chainable no-op builders so
 * component tests can mount BoardView3D without the native gesture runtime.
 */
const { View } = require("react-native");

const noopBuilder = () => builder;
const builder = {
  runOnJS: noopBuilder,
  onBegin: noopBuilder,
  onUpdate: noopBuilder,
  onEnd: noopBuilder,
  onFinalize: noopBuilder,
};

const Gesture = {
  Pan: () => ({ ...builder }),
  Pinch: () => ({ ...builder }),
  Simultaneous: () => ({ ...builder }),
  Race: () => ({ ...builder }),
  Exclusive: () => ({ ...builder }),
};

const GestureDetector = ({ children }) => children;
GestureDetector.displayName = "GestureDetector";

module.exports = {
  __esModule: true,
  GestureHandlerRootView: View,
  GestureDetector,
  Gesture,
};
