# AI Usage Log: MAZ-144 fix — exit animation didn't run on device

## Task / Problem

After the initial MAZ-144 implementation, on a real device the board rendered and
taps registered (a blocked tap still consumed an attempt), but tapping an
extractable arrow showed **no movement** — the arrow neither streamed off nor left
the board. The engine/ViewModel were proven correct (the `GameScreen` victory test
extracts both fixture arrows and wins), so the regression was isolated to the new
extraction **rendering**: the Reanimated-driven `strokeDashoffset` was not animating
on device (react-native-svg `Path` + Reanimated v4 `useAnimatedProps`), leaving the
extracted arrow rendered frozen at progress 0 (full body) and never retiring.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user reported: "pressing an arrow does nothing, it doesn't move, nothing
happens — but pressing them does work because a wrong press deducts from the score."

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Referenced | Reframed the bug from the symptom: UI renders + taps register (attempts drop) + engine extracts fixtures (victory test green) ⇒ only the animated extraction render is broken. | this log |
| Planner/Slicer | Used | Smallest reliable fix: drive the SVG `strokeDashoffset` exit with RN `Animated` (proven on device, dependable completion callback) instead of Reanimated; keep the SVG neon look and geometry. | `NeonArrow.tsx` |
| TDD Implementer | Referenced | Existing `BoardView`/`GameScreen` tests already assert the active tap target drops on extraction and victory shows; kept them green. | `tests/presentation/components/BoardView.test.tsx` |
| Judge | Referenced | `npm run verify` green; confirmed `strokeDashoffset` needs `useNativeDriver:false` and the `Animated.timing(...).start(cb)` completion reliably calls `onDone` (retires the arrow). | `npm run verify` |
| Mutation Tester | Not used | Visual/animation change; geometry already unit-tested. | N/A |

## Result Obtained

- Rewrote `ExitingNeonArrow` in `src/presentation/components/board/NeonArrow.tsx` to
  use **RN `Animated`** (`Animated.createAnimatedComponent(Path)` from
  react-native-svg) instead of Reanimated: an `Animated.Value` 0→1 over 420ms
  (`Easing.in(cubic)`, `useNativeDriver:false`) drives `strokeDashoffset` via
  `interpolate([0,1] → [0, -totalLength])`. The completion callback calls `onDone`,
  so the exiting arrow always unmounts.
- The mechanic is unchanged (dash window slides along body + off-board exit ray →
  unspool & stream off). The static neon body, geometry helper, and SVG neon look
  are untouched. Reanimated is no longer used by the board (it stays a transitive
  dep via react-navigation; the jest mock + babel test-env guard stay, harmless).

## Verification

- `npm run verify` (lint + typecheck + coverage) → **54 suites / 250 tests passing**.
- **Pending device confirmation:** the user must reload the app and verify an
  extractable tap now visibly streams the arrow off-board. If the slide still does
  not show, the next suspect is the SVG static/native render path rather than the
  animation driver.

## Team Modifications Pending Human Review

- Confirm on device that extraction now animates and the arrow leaves.
- If preferred, the Reanimated dependency/wiring can be fully removed later since the
  board no longer uses it (left in place to avoid churn; react-navigation needs it).

## Lessons / Limitations

RN `Animated` + react-native-svg is the long-proven way to animate `strokeDashoffset`
(progress/trim effects) and is reliable on device with a dependable completion
callback, whereas the react-native-svg + Reanimated-v4 `animatedProps` pairing was
not animating here. When an effect can't be verified on a simulator from the agent
environment, prefer the device-proven animation driver over the newer one.
