# AI Log — Tap-picking bug fix (3D board)

## 1. Task / problem

Arrows in the 3-D board did not respond to taps: the cube rendered and rotated but pressing any arrow did nothing. All C-series tickets (C5–C9) were already merged to `develop`.

## 2. Tool and model

Claude Sonnet 4.6 via Claude Code CLI.

## 3. Prompt used

Paraphrase: "The cube renders and rotates but arrows don't respond to taps. All tickets are done. Figure out the root cause and fix it."

## 4. Agent Roles Used

| Role               | Status   |
|--------------------|----------|
| Spec Partner       | Not used |
| Planner            | Used     |
| TDD Implementer    | Not used |
| Judge              | Not used |
| Mutation Tester    | Not used |

Bug fix with limited scope — the logic was existing code; no new feature required a spec or new tests beyond mock fixes.

## 5. Result obtained

Root cause: `THREE.PerspectiveCamera.updateProjectionMatrix()` is never called on expo-gl + Fabric (New Architecture). R3F's resize observer does not fire in this environment, so the camera's `projectionMatrix` and `projectionMatrixInverse` remain at their initial values (wrong aspect ratio). `pickArrowId` → `raycaster.setFromCamera()` uses `projectionMatrixInverse` to build the ray, so every ray was aimed at the wrong location and missed all arrows.

Secondary issue: `TAP_MAX_DRIFT_PX = 5` was too tight — real device taps naturally drift 6–9 px between touch start and end, causing valid taps to be silently discarded.

Fixes applied:
- **Camera aspect sync in render loop**: every `setInterval` tick now checks `camera.aspect` against `layoutRef.current` and calls `camera.updateProjectionMatrix()` when they differ.
- **Relaxed tap threshold**: `TAP_MAX_DRIFT_PX` increased from 5 to 10.
- **Pre-existing type error fixed**: `ReturnType<typeof useThree>` resolved to `{}` because `@react-three/fiber/native`'s sub-path export lacks explicit typings → replaced with explicit `interface R3FState`.
- **Pre-existing lint/test issues fixed**: debug `console.log` calls in `BoardView3D`, `BoardRenderer`; missing `jest` global in `expo-gl.js` mock; missing `PerspectiveCamera` in `three.js` mock; mock camera stub lacked `position.set` / `lookAt`; `GameScreen.test.tsx` and `gameVictorySubmit.test.tsx` hardcoded `manualLevels[0]` which now points to the 3-D cube Daniella added — updated both to select the correct 2-D level fixture.

## 6. Team modifications pending human review

- Verify the camera aspect fix produces correct raycasting on a physical device running New Architecture (Fabric + expo-gl).
- Confirm `TAP_MAX_DRIFT_PX = 10` feels right on device — adjust up or down if needed.
- The 4 ESLint warnings (`ZOOM_MIN`, `ZOOM_MAX`, `ZOOM_SENSITIVITY`, `delta` unused) are pre-existing dead code from Daniella's C6/C9 implementation — tracked separately.

## 7. Lessons / limitations

- On expo-gl + Fabric, R3F's resize observer, `useFrame`, and `useEffect` inside Canvas do NOT run. Only the Canvas render function (synchronous) and effects registered outside Canvas work.
- `instanceof THREE.PerspectiveCamera` requires `PerspectiveCamera` to be exported by the `three` mock; omitting it silently made the guard no-op in tests, masking the missing export until the test crashed.
- When a 3-D level is added as `manualLevels[0]`, tests that assumed index-0 is always a 2-D level break silently (level-lock guard shows the board as locked, not an obvious 3-D/2-D mismatch).
