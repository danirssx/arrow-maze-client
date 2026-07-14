# AI Usage Log: MAZ-225 — 3D render spike (T0, throwaway)

## Task / Problem

Resolve `MAZ-225` (T0) of the M13 "3D Volumetric Boards" milestone: the **blocking spike** that decides whether a volumetric neon-cube renderer is viable on device before committing the render tickets (MAZ-240..244). Build a runnable harness that renders ~20 neon tube arrows in a cube with orbit/zoom and tap-raycast, plus an on-screen FPS counter, so a human can run it on a real iPhone and record the go/no-go verdict + the `@react-three/fiber` vs raw `expo-gl` stack decision.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user approved implementing `MAZ-225` following both repos' `AGENTS.md`, the team `MEMORY.md`, `Linear_MCP_Guideline.md`, prior ticket/plan context, AI-usage logging, MEMORY/AGENTS review, and Linear updates — and, on being told this is a device spike I cannot device-validate from here, chose "(a) real dependency install + branch-only close".

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Referenced | M13 grill-me spec sealed the spike criteria: sparse volumetric, orbit/zoom + raycast pick, emissive glow without bloom, R3F with fallback to raw expo-gl, ≥50fps on device. | `../M13_3D_Boards_Plan.md`, `MAZ-225` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | Milestone pre-sliced into MAZ-225..244; T0 is the blocking root of the render chain. | `MAZ-225` |
| TDD Implementer (`.agents/tdd-implementer.md`) | Referenced | A spike is exploratory, not TDD production code (a GL frame has no meaningful unit test; the verification IS device FPS). Only the one pure piece — the arrow generator — is unit-tested. | `tests/presentation/spike/spikeArrows.test.ts` |
| Judge (`.agents/judge.md`) | Referenced | Kept the spike isolated (its own `src/presentation/spike/` + a dev-only `/spike-3d` route, not linked from the app), typechecked clean, and scoped the R3F `react/no-unknown-property` lint false-positive to the spike files only. | `npx tsc --noEmit` (0 errors), scoped eslint |
| Mutation Tester (`.agents/mutation.md`) | Not used | No production logic to mutate; throwaway spike. | N/A |

## Result Obtained

Added an isolated, runnable spike harness (all throwaway, not wired into the game):

- Dependencies installed (via `expo install`, SDK-54-compatible): `three@^0.185`, `@react-three/fiber@^9.6` (React 19 compatible), `expo-gl@~16.0`, `react-native-gesture-handler@~2.28`, `@types/three` (dev).
- `src/presentation/spike/spikeArrows.ts` — deterministic (seeded LCG) generator of ~20 axis-aligned bent arrow paths in a cube.
- `src/presentation/spike/Spike3DScene.tsx` — neon tube arrows (emissive core + additive halo, **no bloom**), an orbit rig driving the camera on a sphere from external gesture state, an FPS sampler, and an imperative raycast picker resolving a tap to an arrow id.
- `src/presentation/spike/Spike3DScreen.tsx` — `@react-three/fiber/native` `Canvas` + composed gesture-handler gestures (pan=orbit, pinch=zoom, tap=pick) + FPS/last-picked HUD.
- `app/spike-3d.tsx` — dev-only route `/spike-3d`.
- `src/presentation/spike/README.md` — build/run (EAS dev-client, since expo-gl cannot run in Expo Go) + the go/no-go protocol to record on the ticket.

## Verification

- **What I could verify from here:** `npx tsc --noEmit` → 0 errors (the R3F v9 three intrinsics `<group>`/`<primitive>`/`<color>`/`<ambientLight>` resolve on React 19 / Expo 54 — a positive early signal for the R3F path). Scoped eslint on the spike → 0 errors. `jest tests/presentation/spike/spikeArrows.test.ts` → 3 passing.
- **What I could NOT verify (device step, human):** the actual FPS, gesture fluidity, tap-pick reliability, and R3F-vs-expo-gl stability on the New Architecture. These require an EAS dev-client build on a real iPhone — not runnable from this environment. The verdict is pending a human device run (protocol in the spike README).

## Team Modifications Pending Human Review

- **Device run required to close T0.** Someone must run the EAS dev-client build, open `/spike-3d`, and record on MAZ-225: FPS with 20 arrows, gesture feel, tap-pick correctness, and the R3F-vs-raw-expo-gl decision. Only then does T0 (and its unblocking of MAZ-240) resolve.
- **Branch-only, do NOT merge to `develop`.** This is a throwaway; the deps and `/spike-3d` route must not land in the shipped app. If the render tickets adopt R3F, they will re-introduce the deps deliberately in production code.
- Left the issue in **In Progress** (harness built, device verdict pending) rather than In Review, per `Linear_MCP_Guideline.md` (no production PR).

## Device Results (2026-07-13) — VERDICT: **GO**

Run on a physical iPhone via a dev-client build (Metro `expo start --dev-client`). Two screen captures recorded on the ticket:

- **FPS: 60 (capped), stable** while orbiting with ~20 neon tube arrows — comfortably above the ≥50 target.
- **Orbit + zoom:** fluid, no jank (the two captures are different camera angles).
- **Tap → raycast → arrow id:** correct and reliable (`tap → arrow-7`, `tap → arrow-18` shown in the HUD).
- **Neon look:** emissive core + additive halo reads as neon on the dark background without post-process bloom, as designed.
- **Stack decision:** `@react-three/fiber/native` (R3F v9) + `expo-gl` + `three` **behaved on the New Architecture** — no crashes, no blank GL, gesture-handler and R3F composed cleanly. **Adopt R3F; the raw expo-gl fallback is NOT needed.**

Conclusion: the volumetric renderer is viable. **MAZ-240 (C5) is unblocked and should build on the R3F stack** (three@^0.185, @react-three/fiber@^9.6, expo-gl@~16, react-native-gesture-handler@~2.28). Density (~20 arrows in a 4³ cube) rendered legibly with room to spare — the low-density cap decision from the spec holds.

## Lessons / Limitations

The biggest early signal is free: the R3F v9 + three + expo-gl stack **typechecks cleanly on Expo SDK 54 / React 19 / RN 0.81**, which was the first thing likely to break — and the device run confirmed it also *runs* cleanly at 60fps. The scene math (orbit sphere, tube geometry, raycast NDC) is written so it transfers unchanged to a raw `expo-gl` + `three` implementation if R3F ever misbehaves, but on this hardware R3F held 60fps so the fallback stays in reserve. Remaining unknowns for C5 (not spike-blocking): behaviour at the real per-level arrow count under the density cap, and the exit fly+fade animation cost — both cheap to measure once C5 renders real board data.
