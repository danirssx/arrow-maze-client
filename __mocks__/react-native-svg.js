/**
 * Manual Jest mock for `react-native-svg`.
 *
 * Every primitive (Svg, Path, Circle, G, Polygon, Defs, ...) renders as a plain RN
 * View so presentation tests can mount the SVG board without the native renderer;
 * SVG-only props are simply ignored by View in the test renderer. There is no
 * JSX/`createElement` here on purpose — that keeps NativeWind's Babel transform out
 * of this file. The real library renders the actual vectors in the Expo app build.
 */
const { View } = require("react-native");

module.exports = new Proxy(
  { __esModule: true, default: View },
  { get: (target, prop) => (prop in target ? target[prop] : View) }
);
