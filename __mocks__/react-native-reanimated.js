/**
 * Manual Jest mock for `react-native-reanimated`.
 *
 * The published v4 `/mock` entry is broken (it points at a missing `./src/mock`),
 * so we mock by hand: animated components render their base component and the
 * animation hooks resolve synchronously. Presentation tests therefore mount the
 * board and exit-animation components deterministically, without the UI-thread
 * worklet runtime. No JSX/`createElement` here on purpose (keeps NativeWind's Babel
 * transform out of this file). The real library animates in the Expo app build.
 */
const { View, ScrollView, Text } = require("react-native");

const createAnimatedComponent = (Component) => Component;
const useSharedValue = (initial) => ({ value: initial });
const runFn = (fn) => {
  try {
    return typeof fn === "function" ? fn() : {};
  } catch {
    return {};
  }
};
const useAnimatedProps = runFn;
const useAnimatedStyle = runFn;
const useDerivedValue = (fn) => ({ value: runFn(fn) });
const withTiming = (toValue, _config, callback) => {
  if (typeof callback === "function") callback(true);
  return toValue;
};
const withDelay = (_delay, animation) => animation;
const withSpring = (toValue, _config, callback) => {
  if (typeof callback === "function") callback(true);
  return toValue;
};
const runOnJS = (fn) => fn;
const runOnUI = (fn) => fn;
const cancelAnimation = () => undefined;
const interpolate = (value) => value;
const ease = (t) => t;
const Easing = new Proxy(ease, { get: () => ease });

const Animated = { createAnimatedComponent, View, ScrollView, Text };

module.exports = {
  __esModule: true,
  default: Animated,
  createAnimatedComponent,
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
  runOnUI,
  cancelAnimation,
  interpolate,
  Easing,
  Extrapolation: { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" }
};
