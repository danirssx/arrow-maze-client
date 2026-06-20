# AI Usage Log: MAZ-142 Polish board UI (spacing + tap & exit animations)

## Task / Problem

Resolve `MAZ-142`: improve `BoardView` UX — (1) arrowheads poked past their cell and sat on neighbouring arrows; (2) tapping an arrow gave no immediate feedback; (3) make the extraction "fly off the screen in the head direction" read clearly. Constraint (MEMORY): reanimated is **not** wired and there is **no react-native-svg** — use RN `Animated` + plain Views only. Based on `develop`.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to improve the board UI in `BoardView.tsx` on three points (spacing/overlap, tap feedback, exit animation), following both repos' `AGENTS.md`, `MEMORY.md`, `Linear_MCP_Guideline.md`, AI logging, validation, MEMORY/AGENTS update check, commit/push/PR, Linear.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Used | Turned the three asks into MAZ-142 with concrete acceptance criteria; diagnosed the overlap as `HEAD (17) > CELL/2 (15)` → 2px spill into the neighbour cell. | MAZ-142 |
| Planner/Slicer | Used | Scoped to `BoardView.tsx` only (presentation); no domain/application/test-contract change; keep `testID="arrow-<id>"`. | this log |
| TDD Implementer | Referenced | No direct BoardView test exists; relied on `GameScreen` tap tests (`arrow-a`/`arrow-b`) staying green to prove the hit targets/testIDs are intact. | `tests/presentation/screens/GameScreen.test.tsx` |
| Judge | Referenced | Pre-PR self-audit: full `npm run verify`; verified the head now fits its cell (`HEAD=15 ≤ CELL/2=17`), pulse calls `onTap` synchronously so taps are unaffected, animations stay native-driven. | `npm run verify` |
| Mutation Tester | Not used | StrykerJS is not configured; change is visual/animation. | N/A |

## Result Obtained

- **Spacing/overlap:** `CELL 30→34`, `HEAD 17→15` (kept `≤ CELL/2`, so a head tip lands ~2px inside its own cell instead of spilling into the neighbour) and wider gaps between parallel bodies. Crossings still overlap as a legible knot.
- **Tap feedback:** added a `pulse` `Animated.Value` per arrow; on every tap the arrow instantly **dims (opacity → 0.5) and lurches `PRESS_NUDGE` px toward its head direction**, then settles. `onTap` fires synchronously so gameplay timing is unchanged. Blocked taps still shake (combined via `Animated.add`).
- **Exit animation:** kept/polished `ExitingArrow` — flies `FLY 720→900` px off-board in the head direction with accelerate-out easing and a longer opacity hold (`0.85`), so an extracted arrow clearly escapes the screen before unmounting.

## Verification

- `npx jest tests/presentation/screens/GameScreen.test.tsx` → 2 passing (tap + win flow intact).
- `npm run verify` (lint + typecheck + coverage) → **50 suites / 231 tests passing**.

## Team Modifications Pending Human Review

- Pure presentation change (`BoardView.tsx`); no API/domain/test-contract impact.
- Animations use RN `Animated` + native driver (no new deps), per the client UI constraint.

## Lessons / Limitations

The overlap was purely geometric: the triangular head length must stay `≤ CELL/2` or it renders into the adjacent lattice cell. Driving the press pulse from a one-shot `Animated.sequence` (in→out) while still calling `onTap` synchronously gives immediate feedback without changing the extract/block decision or breaking the snapshot round-trip — and naturally hands off to the fly-off when the arrow is extractable.
