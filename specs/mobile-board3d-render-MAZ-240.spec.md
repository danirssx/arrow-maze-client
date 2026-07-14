# Mobile BoardView3D render spec (MAZ-240)

Source: `M13_3D_Boards_Plan.md`, ticket `MAZ-240` / C5.

## Purpose

Add a production 3D board renderer shell for volumetric Arrow Untangle levels: a static GL scene with neon tube arrows, ready for later orbit, picking, exit animation, and renderer switching tickets.

## In Scope

- Preserve 3D `z` coordinates from the application board snapshot boundary.
- Add a presentation-only `BoardView3D` component under `src/presentation/components/board3d/`.
- Render active arrows as Three.js/R3F neon tube descriptors from plain DTOs.
- Provide deterministic Jest mocks and pure geometry tests.
- Keep the existing 2D `BoardView` behavior unchanged.

## Out Of Scope

- Renderer selection inside `GameScreen` (`MAZ-244`).
- Orbit and zoom gestures (`MAZ-241`).
- Tap raycast picking (`MAZ-242`).
- Exit fly/fade and shake animation in the GL loop (`MAZ-243`).
- 3D daily challenge, admin editor, slicing/peel tools, and post-process bloom.

## Behavior

The application `BoardSnapshotDto` remains UI-neutral but can now carry optional depth. A 2D level continues to omit depth fields. A 3D level, or any level with non-zero `z` in arrows or board shape cells, emits coordinates with `z` and depth bounds.

`BoardView3D` consumes `GameUiState` and draws a static R3F scene when bounds exist. It filters extracted arrows out of the active descriptor list. When bounds are null, it renders an empty dark 3D board shell. The component does not own game rules, scoring, persistence, gestures, or tap-picking.

## Clean Architecture contract

### Impact by layer

- Domain: no production changes.
- Application: `BoardSnapshotDto`/`BoardSnapshotMapper` expose optional depth as plain serializable DTO data.
- Infrastructure: no production changes.
- Presentation: new `board3d` renderer and pure geometry helpers. R3F/Three.js stay in presentation only.
- Framework: Jest setup and manual mock only.

### Rules

- `src/domain` must stay free of React Native, Expo, R3F, Three.js, storage, HTTP, and presentation imports.
- `src/application` must not import presentation/framework/infrastructure. DTOs must remain plain objects.
- `src/presentation/components/board3d` may import `@react-three/fiber/native` and `three`.
- The existing 2D renderer must not be switched or removed in this ticket.
- Geometry that can be tested without native GL must live in a pure module.

### Tests required

- Application mapper tests for explicit 3D levels, inferred depth, 3D zero slabs, shape depth, and empty boards.
- Pure presentation geometry tests for coordinate centering, depth defaults, direction vectors, active-arrow filtering, and volume size.
- Presentation component test for mounting the 3D canvas shell and the empty state.
- Scoped mutation for `src/application/dto/BoardSnapshotMapper.ts`.

## Acceptance criteria

- S1: A volumetric board snapshot preserves `z` coordinates and exposes depth bounds.
- S2: A planar board snapshot remains backward-compatible with existing 2D DTO consumers.
- S3: The 3D geometry helpers center coordinates in a volume and resolve the six world-axis directions.
- S4: `BoardView3D` mounts a GL canvas shell for bounded boards and does not mount one for empty boards.
- S5: Interaction and renderer switching remain deferred to `MAZ-241`..`MAZ-244`.

## Risks / Limitations

- Device rendering must still be exercised once `MAZ-244` wires the renderer into gameplay.
- Jest only validates the RN shell and pure geometry; it does not execute a native GL context.
