# AI Log — MAZ-242: Raycast tap-picking → onArrowTap(arrowId)

**Date:** 2026-07-14
**Ticket:** MAZ-242 — [C7] Raycast tap-picking → onArrowTap(arrowId)
**Tool:** Claude Sonnet 4.6 (Claude Code)
**Branch:** feat/mobile-raycast-tap-MAZ-242

## Task / Problem

`BoardView3D` (C5/MAZ-240) renders a static 3D scene with no interaction. The player
could see the arrows but tapping them had no effect — the touch event landed on the
GL canvas and died. C7 adds the missing bridge: a tap on any arrow mesh calls
`onArrowTap(arrowId)`, which the existing `TapArrowUseCase` already handles.

## Prompt Used

Craftmanship pipeline (spec-partner → Gherkin → TDD):
1. Analysed existing `BoardView3D.tsx` and `buildTubeGroup` to confirm `userData.arrowId`
   was already set on every mesh child.
2. Wrote `specs/mobile-raycast-tap-MAZ-242.spec.md` (spec-partner role).
3. Wrote `specs/mobile-raycast-tap-MAZ-242.feature` — 5 Gherkin scenarios.
4. Human approved Gherkin contract.
5. TDD cycle: Red → Green → Refactor per scenario.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
|-------|--------|-----------------|----------|
| Spec Partner (`.agents/spec-partner.md`) | Referenced | Architecture placement and CA contract written following the role's checklist | `specs/mobile-raycast-tap-MAZ-242.spec.md` |
| Planner / Gherkin Author (`.agents/planner.md`) | Referenced | 5 scenarios written following the role's format, human approved before TDD | `specs/mobile-raycast-tap-MAZ-242.feature` |
| TDD Implementer (`.agents/tdd-implementer.md`) | Referenced | Three Laws applied: test written first, minimum production to pass | test files + source files |
| Judge (`.agents/judge.md`) | Not used | Pending human checkpoint |  |
| Mutation Tester (`.agents/mutation.md`) | Not used | Pending human checkpoint |  |

## @s → test map

| Scenario | Test |
|----------|------|
| @s1 — tap tube fires onArrowTap | `arrowTapHandler.test.ts` → `should_call_onArrowTap_when_mesh_userData_has_arrowId` |
| @s2 — tap cone head fires onArrowTap | `arrowTapHandler.test.ts` → `should_call_onArrowTap_with_correct_id_for_different_arrow` |
| @s3 — tap lattice ignored | `arrowTapHandler.test.ts` → `should_not_call_onArrowTap_when_mesh_has_no_arrowId` + empty string edge |
| @s4 — empty canvas ignored | Covered implicitly: `onClick` only on `<primitive>`, not on `<Canvas>` |
| @s5 — no crash without prop | `BoardView3D.test.tsx` → `should_not_throw_when_rendered_without_onArrowTap_prop` |

## Result Obtained

- New file: `src/presentation/components/board3d/arrowTapHandler.ts` — pure handler function, 0 framework deps
- Updated: `src/presentation/components/board3d/BoardView3D.tsx` — added `onArrowTap?` prop, wired `onClick` via `handleArrowTap`
- New test: `tests/presentation/components/board3d/arrowTapHandler.test.ts` — 7 tests
- Updated test: `tests/presentation/components/board3d/BoardView3D.test.tsx` — added @s5
- New spec: `specs/mobile-raycast-tap-MAZ-242.spec.md`
- New feature: `specs/mobile-raycast-tap-MAZ-242.feature`
- Full suite: 571 tests, 0 failures

## Team Modifications Pending Human Review

- Verify `onClick` on `<primitive>` fires correctly on device with real R3F (Jest mock drops canvas children)
- Confirm gesture conflict with C6 orbit controls is absent (C6 not yet implemented)

## Key Technical Decision

Extracted `handleArrowTap` as a pure framework-free function instead of writing an
inline arrow inside JSX. Rationale: R3F canvas mock in Jest drops all children, so
Three.js meshes are never rendered in tests. A pure function receives a plain event
shape `{ object: { userData }, stopPropagation }` and can be unit-tested without R3F.
This follows the AGENTS.md principle: "keep reusable framework-free logic in a plain
pure module so it can be unit-tested."

## Lessons / Limitations

- R3F Canvas mock (`__mocks__/@react-three/fiber/native.js`) drops children intentionally.
  Component tests can only assert the RN shell (View testIDs). Interaction logic must
  be extracted to pure modules to be testable.
- `onClick` on `<primitive>` requires `three` package installed — it was missing from
  `node_modules` because `npm install` had not been run after pulling the C5 branch.
