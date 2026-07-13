# MAZ-225 · T0 — 3D render spike (THROWAWAY)

Proof-of-concept for the M13 volumetric board renderer. **Not production code, not
wired into the game, not meant to merge to `develop`.** The branch + this doc +
the `ai-log/` entry are the deliverable; the actual **go/no-go verdict is measured
on a real device** and recorded on the Linear ticket by a human.

## What it proves

A dev-only route `/spike-3d` that renders ~20 neon tube "arrows" scattered through
a 4³ cube with `@react-three/fiber` + `expo-gl` + `three`, plus:

- **FPS overlay** (top-left) — the primary signal. Target **≥ 50 fps**.
- **Orbit** (one-finger drag) + **zoom** (pinch) via `react-native-gesture-handler`.
- **Tap → raycast → arrow id** (shown as `tap → arrow-N` in the HUD).
- Neon look via emissive core tube + additive halo tube — **no post-process bloom**.

## Why a custom dev client (not Expo Go)

`expo-gl` ships native code, so **Expo Go cannot run this** — you need a dev-client
build (EAS or local prebuild).

```bash
# from arrow-maze-client, on this branch (chore/mobile-3d-render-spike-MAZ-225)
npm install                       # picks up three / @react-three/fiber / expo-gl / gesture-handler
npx expo install expo-dev-client  # if not already present

# device build (pick one)
eas build --profile development --platform ios      # cloud, needs an Apple device profile
# or local:
npx expo run:ios --device                           # local prebuild + install on a plugged-in iPhone
```

Then open the dev client and navigate to **`/spike-3d`** (deep link `arrowmaze://spike-3d`,
or add a temporary `<Link href="/spike-3d">` in `app/index.tsx` while testing).

## Go / no-go protocol (record on MAZ-225)

1. **FPS** with 20 arrows, while orbiting: **≥ 50 → GO**, 30–50 → borderline (reduce
   fidelity: drop the halo tube, lower `emissiveIntensity`, fewer tube segments),
   **< 30 → investigate before committing the render tickets**.
2. **Gestures** feel fluid (no jank on orbit/pinch)? y/n.
3. **Tap picking** returns the correct arrow id reliably? y/n.
4. **Stack decision:** did `@react-three/fiber/native` behave on the New
   Architecture? If it fought (crashes, blank GL, event issues), the fallback is
   raw `expo-gl` + `three` (same scene, imperative) — the scene math in
   `Spike3DScene.tsx` transfers directly.

Write the numbers + the R3F-vs-expo-gl decision into the ticket; that closes T0 and
unblocks MAZ-240 (C5).

## Files (all throwaway)

- `spikeArrows.ts` — synthetic arrow generator (the only unit-tested piece).
- `Spike3DScene.tsx` — tubes, orbit rig, FPS meter, imperative raycast picker.
- `Spike3DScreen.tsx` — Canvas + gestures + HUD.
- `app/spike-3d.tsx` — the dev route.
