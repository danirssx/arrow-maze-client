# AI Usage Log: MAZ-144 Animate arrow extraction with SVG + Reanimated

## Task / Problem

Resolve `MAZ-144`: replace the rigid "fly off in a straight line" extraction
(`ExitingArrow`, RN `Animated` + Views) with the reference exit animation seen in
`fotogramas-arrow-orig/` — when an arrow is tapped and clears, its snake body
**unspools along its own curve and streams off-board** in the head direction. The
plan (`Plan animación game.md`) prescribes `react-native-svg` + `react-native-reanimated`
and the `strokeDashoffset` trim trick. The product owner explicitly authorised
breaking the prior "no SVG / reanimated not wired" UI constraint. Based on `develop`.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to upgrade the game UI with smooth arrow exit movement/animations
per `Plan animación game.md` and the reference frames in `fotogramas-arrow-orig/`,
explicitly granting permission to break pre-established rules, and to follow the
full workflow (both repos' `AGENTS.md`, root `MEMORY.md`, `Linear_MCP_Guideline.md`,
a new worktree, AI logging + `compile-ai-usage.sh`, MEMORY/AGENTS review,
commit/push/PR, Linear).

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Used | Studied frames 013→019 to derive the exact mechanic (snake unspools and streams off as a straight line — not a rigid translate, not an in-place retract); turned the plan + frames into MAZ-144 with concrete acceptance criteria and the "extended path = body + off-board exit ray" model. | MAZ-144 |
| Planner/Slicer | Used | Sliced into: (1) deps/babel/jest wiring, (2) a pure tested geometry helper, (3) SVG `NeonArrow` + `BoardView` rewrite. Decided lattice stays Views (resilience), SVG only for arrows, Reanimated only for the extraction dash; tap `testID`s + RN `Animated` shake/press kept. | this log |
| TDD Implementer | Used | Wrote `arrowSvgGeometry.test.ts` (12 AAA cases) before the helper, then `BoardView.test.tsx` (5 cases: render, tap-up, extraction drops the active target, shake, empty board). | `tests/presentation/components/board/arrowSvgGeometry.test.ts`, `tests/presentation/components/BoardView.test.tsx` |
| Judge | Referenced | Pre-PR self-audit: full `npm run verify` green; confirmed Reanimated is auto-wired by `babel-preset-expo@54` (worklets), the broken v4 `/mock` is replaced by manual `__mocks__`, head stays `≤ CELL/2`, taps unchanged. | `npm run verify` |
| Mutation Tester | Not used | StrykerJS is not configured; the pure geometry helper is covered by explicit value assertions instead. | N/A |

## Result Obtained

- **Wiring (presentation-only):** added `react-native-svg@15.12.1` (expo-pinned).
  Discovered Reanimated was already installed (`4.1.7` + `react-native-worklets@0.5.1`,
  New Arch on) and is auto-wired by `babel-preset-expo@54` — so the app needed **no**
  babel plugin change. `babel.config.js` only disables the worklets transform under
  Jest (`api.env("test")` → `worklets:false`). `jest.config.ts` gains
  `setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"]`, which routes both libraries to
  deterministic manual mocks in `__mocks__/` (the published v4 `react-native-reanimated/mock`
  is broken — it points at a missing `./src/mock`).
- **Geometry helper** `src/presentation/components/board/arrowSvgGeometry.ts` (pure,
  framework-free): `polylinePath`, `polylineLength`, `directionUnit`,
  `headTrianglePoints`, and `buildArrowExtraction` (body polyline + a straight exit
  ray from the head, with `bodyLength`/`totalLength` for the dash window).
- **`NeonArrow.tsx`:** `NeonArrowBody` (static) and `ExitingNeonArrow` (extracting).
  Neon glow is faked with layered semi-transparent strokes (wide halo + core + bright
  inner highlight) — **no SVG blur** (the plan warns it tanks FPS). Extraction animates
  `strokeDashoffset` from `0 → -totalLength` (Reanimated `useAnimatedProps`) over a
  body-length dash on the extended path, so the body slides off along its own curve.
- **`BoardView.tsx`:** rewritten to render each arrow as an SVG snake inside a
  per-arrow `Svg` wrapped in the existing RN `Animated` shake/press view; transparent
  `Pressable` hit targets with `testID="arrow-<id>"` are preserved on top. Dotted
  lattice kept as Views. Exit tracking unchanged; `exitClearance = max(width,height)`.

## Verification

- `npx jest tests/presentation/components` → 17 passing (geometry 12 + BoardView 5).
- `npm run verify` (lint + typecheck + coverage) → **54 suites / 250 tests passing**.
  New files: `BoardView.tsx` 100% lines, `NeonArrow.tsx` / `arrowSvgGeometry.ts` ~97%.
- **Not verified here:** real-device FPS / visual smoothness — needs `expo start` on a
  simulator (Reanimated runs the dash on the UI thread; the human confirms feel).

## Team Modifications Pending Human Review

- New runtime dependency `react-native-svg` (presentation-only). Run `npm install`
  in each checkout/worktree (shared `node_modules` symlink already updated).
- Confirm exit feel on device and tune `EXIT_DURATION_MS` (420) / `Easing.in(cubic)` /
  `exitClearance` and the neon layer widths/opacities if needed.
- Confirm keeping the dotted lattice as Views (vs. moving it into the SVG canvas).

## Lessons / Limitations

The reference effect is the `strokeDashoffset` trim trick applied to an **extended**
path (snake body + an off-board straight ray): sliding a body-length dash window along
it makes each segment follow the path the head traced and then straighten out — exactly
the on-screen "unspool & stream off". `babel-preset-expo@54` already injects
`react-native-worklets/plugin` when the package is present, so "reanimated not wired"
was never true at the babel level; the only real gap was a Jest mock (and the shipped
v4 `/mock` is broken). Keeping Reanimated to just the extraction dash, and leaving
shake/press on RN `Animated`, kept the change small and the existing tap tests intact.
