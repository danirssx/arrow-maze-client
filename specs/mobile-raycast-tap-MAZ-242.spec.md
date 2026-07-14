Date: 2026-07-14
Ticket: `MAZ-242`
Source: 3D Extension Sprint — C7
Status: approved

## Purpose

`BoardView3D` renders a static 3D scene (C5/MAZ-240) but has no interaction layer.
This slice adds tap-picking via Three.js raycasting so that when the player taps any
visual part of an arrow (tube, halo, or cone head), `onArrowTap(arrowId)` is called —
the same contract the 2D `BoardView` already exposes to `GameScreen`. Tapping the
lattice or empty space must be ignored.

## In scope / Out of scope

- In scope:
  - `BoardView3D` accepts `onArrowTap: (arrowId: string) => void`
  - Tapping any mesh of arrow X (tube / halo / cone head) calls `onArrowTap(X.id)`
  - Tapping lattice wires or empty canvas space calls nothing
  - Only active arrows (included in `descriptors`) are tappable; extracted arrows
    are already excluded from the scene by `buildArrowTubeDescriptors`
- Out of scope:
  - Orbit / zoom gestures (C6 — MAZ-241)
  - Exit animation on tap (C8 — MAZ-243)
  - Renderer switching by `dimensions` (C9 — MAZ-244)
  - Visual highlight/shake feedback on tap (that belongs to C8)

## Behavior

When the player touches the canvas, R3F fires pointer events whose `event.object`
is the intersected Three.js mesh. Every mesh in an arrow group already carries
`userData.arrowId` (set by `buildTubeGroup`). The tap handler reads
`event.object.userData.arrowId`; if it is a non-empty string it calls
`onArrowTap(arrowId)` and stops propagation. If `userData.arrowId` is absent or
empty the tap is silently discarded.

The handler is attached via `onClick` on each `<primitive>` element (R3F event
system). R3F runs its own raycaster internally; no manual `THREE.Raycaster`
instantiation is needed.

## Architecture placement

- **Domain** — no change. The invariant "can this arrow be extracted?" is owned
  by `CollisionService` and handled downstream by `TapArrowUseCase`.
- **Application** — no change. `TapArrowUseCase` already exists and is called by
  `GameUIController.handleArrowTap(arrowId)`.
- **Infrastructure** — no change.
- **Presentation (MVVM)**:
  - `src/presentation/components/board3d/BoardView3D.tsx` — add `onArrowTap` prop
    and `onClick` on `<NeonTubeArrow>` / `<primitive>`.
  - `src/presentation/components/board3d/index.ts` — re-export type if needed.
- **Framework / composition root** — no change. `GameScreen` already passes
  `onArrowTap` down; it will start receiving it from `BoardView3D` the same way
  it does from `BoardView`.

## Clean Architecture contract

- [x] Regla de dependencia — tap handler lives in presentation, calls prop; no inward violation
- [x] Independencia del dominio — no RN/Expo/Three.js enters `src/domain`
- [x] Application solo orquesta — `TapArrowUseCase` is untouched
- [x] Repositorios: interfaz adentro — not applicable to this slice
- [x] DTOs simples en fronteras — `arrowId: string` is a primitive
- [x] Invariantes en VO/agregados — not applicable; no invariant changes
- [x] MVVM: View dumb, ViewModel solo presentación — `BoardView3D` only converts a
  pointer event to an `arrowId` string and delegates upward; no business rule

Layer impact:

- Domain: no change
- Application: no change
- Infrastructure/Adapters: no change
- Presentation (MVVM): `BoardView3D.tsx` — add prop + onClick handler; `arrowTapHandler.ts` — **New** pure handler module extracted for testability
- Framework (composition root): no change

Forbidden moves (must stay unchecked / not introduced):

- [ ] `src/domain` importing React/RN/Expo/storage/http/navigation
- [ ] `src/application` importing `infrastructure`/`framework`/`presentation`
- [ ] Views/screens containing business rules, framework side effects, or dependency composition
- [ ] ViewModels calculating scoring/progress/authorization/persistence or domain results
- [ ] DTOs to presentation re-exporting raw domain entities/types
- [ ] NativeWind/Zustand/svg/reanimated imported by `domain`/`application` or game-rule logic

Required tests:

- Domain: none (no domain change)
- Application: none (no application change)
- Presentation/UI:
  - `BoardView3D` renders without `onArrowTap` → no crash (prop is optional compat)
  - Simulated onClick on a mesh with `userData.arrowId = "arrow-1"` → `onArrowTap("arrow-1")` called once
  - Simulated onClick on a mesh without `userData.arrowId` → `onArrowTap` not called
  - `stopPropagation` is called so the Canvas root does not also fire

Architecture acceptance criteria:

- Given the touched layers, When imports are inspected, Then only `BoardView3D.tsx` changes and it imports nothing from `domain` or `application`.
- Given boundaries are crossed, When the prop type is inspected, Then `onArrowTap` receives a plain `string`.
- Given business invariants exist, When the implementation is inspected, Then no extraction/collision logic lives in `BoardView3D`.

## Edge cases

- Tap on lattice `<lineSegments>` / `<gridHelper>` — no `userData.arrowId` → ignored
- Tap on `<ambientLight>` / `<pointLight>` — not intersectable → ignored
- Tap on empty canvas (miss) — R3F fires no onClick → nothing happens
- Extracted arrow: already removed from `descriptors` before render → mesh does not exist in scene → no tap possible
- Rapid double-tap — two `onArrowTap` calls; domain deduplication is out of scope here

## Acceptance criteria (Given/When/Then)

- S1: Given BoardView3D is rendered with arrows and `onArrowTap`, When the player taps the tube mesh of arrow "arrow-1", Then `onArrowTap("arrow-1")` is called exactly once.
- S2: Given BoardView3D is rendered with arrows and `onArrowTap`, When the player taps the cone head mesh of arrow "arrow-2", Then `onArrowTap("arrow-2")` is called exactly once.
- S3: Given BoardView3D is rendered with arrows and `onArrowTap`, When the player taps a lattice mesh (no `userData.arrowId`), Then `onArrowTap` is not called.
- S4: Given BoardView3D is rendered with arrows and `onArrowTap`, When the player taps empty canvas space (no mesh hit), Then `onArrowTap` is not called.
- S5: Given BoardView3D is rendered without passing `onArrowTap`, When the player taps any arrow, Then no error is thrown.

## Decisions

- **R3F `onClick` on `<primitive>`** over manual `THREE.Raycaster`: R3F already maintains a raycaster per canvas; adding `onClick` to the primitive delegates event detection to R3F's internal system. Avoids reimplementing pointer math and keeps the component declarative.
- **`event.object.userData.arrowId`** over traversing parents: every child mesh already has `userData.arrowId` set by `buildTubeGroup`, so direct object inspection is sufficient and O(1). Climbing `event.object.parent` would be fragile if the group hierarchy changes.
- **`onArrowTap` optional** (`onArrowTap?: (id: string) => void`): the static scene from C5 had no prop; making it optional preserves backward compat with existing C5 tests and avoids forcing GameScreen changes in the same PR.

## Risks / OPEN QUESTIONS

- R3F `onClick` on `<primitive>` requires that R3F can raycast against imperatively-built Three.js objects. This is supported as long as the geometry has a bounding sphere (Three.js computes it automatically for `TubeGeometry` and `ConeGeometry`). Low risk.
- The halo mesh uses `depthWrite: false` and `AdditiveBlending`. R3F may or may not include it in raycast hits depending on whether the geometry is transparent. If the halo is never hit, tube and cone alone are sufficient for UX. No action needed — cone + core cover the tap area.
- `stopPropagation` in R3F prevents the event from bubbling to parent primitives but does NOT block native touch events from propagating to the React Native layer. If orbit controls (C6) add a native gesture handler, there may be gesture conflict. Owned by C6.
