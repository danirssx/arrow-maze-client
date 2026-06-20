module.exports = function (api) {
  // Cache by environment so the Jest (`test`) variant below stays separate from
  // the app build. `api.env()` already keys the Babel cache on the env name.
  const isTest = api.env("test");

  const expoPreset = { jsxImportSource: "nativewind" };
  if (isTest) {
    // Under Jest, Reanimated is mocked (see `jest.setup.ts`), so the worklets
    // transform that `babel-preset-expo` auto-adds (it detects the installed
    // `react-native-worklets`) is unnecessary and only makes the test runtime
    // depend on the UI-thread worklet runtime. Disable it for deterministic tests.
    // The real app build keeps worklets enabled (this branch is not taken).
    expoPreset.worklets = false;
  }

  return {
    presets: [["babel-preset-expo", expoPreset], "nativewind/babel"]
  };
};
