# Abstract Shaped Boards Plan

Date: 2026-06-20

Status: draft for human debate. This is not an approved Gherkin contract and
not an implementation ticket yet.

## Purpose

Allow Arrow Untangle levels to render and load boards with abstract finite
shapes, similar to the reference frames in `fotogramas-arrow-orig/`, while
keeping the current ArrowSpec extraction rules testable and backend-driven.

## Context Read

- Client rules: `AGENTS.md`, `docs/workflow.md`, `docs/architecture.md`,
  `docs/tdd.md`.
- Backend rules: `AGENTS.md`, `docs/workflow.md`, `docs/architecture.md`.
- Coordination: root `MEMORY.md`, `Linear_MCP_Guideline.md`.
- Visual reference: `fotogramas-arrow-orig/` shows a dark board with a dotted
  grid that is not necessarily a full rectangle; the visible play area can look
  like an abstract mask while arrows still exit off-screen.

## Current System

Client:

- `JsonLevelStrategy` already parses a level from JSON into `LevelDefinition`.
- Current JSON fields are `id`, `difficulty`, `kind`, `attempts`,
  `timeLimitSeconds`, and `arrows`.
- A targeted verification passed:
  `npm test -- --runInBand tests/application/level-build/JsonLevelStrategy.test.ts`
  with 5 tests green.
- `LevelDefinition` currently has no field for board shape or visual mask.
- `BoardSnapshotDto` currently exposes only `arrows` and arrow-derived `bounds`.
- `BoardView` renders a rectangular dotted lattice derived from arrow bounds.
- `CollisionService` treats the board as unbounded: only other active arrows on
  the forward ray block extraction.

Backend:

- The current level catalog stores level arrows as JSON/JSONB and returns
  `definition.arrows` + `definition.attempts`.
- Prisma-backed branch notes in `MEMORY.md` show the intended persistence path:
  `levels.arrows` JSONB, `levels.attempts`, Prisma migrations, and seed data.
- `LevelSolvabilityPolicy` checks acyclicity of the blocking graph built from
  ArrowSpecs. It does not know about finite board boundaries or shape masks.

## Main Design Decision

### Option A: Shape as visual and authoring mask

Add an optional `boardShape` to the level definition. The shape describes which
lattice cells should be visible as the board background. All arrow cells must
fit inside the shape when the shape exists. Extraction physics remains
unbounded: once an arrow's forward ray is clear of other arrows, it can exit
through the shape boundary.

Recommended for MVP.

Reason:

- It matches the current game rule: arrows leave the board once unblocked.
- It keeps `CollisionService` and `LevelSolvabilityPolicy` mostly stable.
- It gives the UI the abstract board look from the reference frames.
- It avoids introducing walls/borders as a new game mechanic.

Tradeoff:

- The shape is not a physical blocker. It is a valid placement mask plus visual
  framing.

### Option B: Shape as physical board boundary

Treat `boardShape` as the actual board. Arrows can only occupy and move through
shape cells, and extraction may need explicit exits or boundary rules.

Not recommended for the first ticket.

Reason:

- It changes the core invariant from "unbounded raycast" to "finite board".
- It requires a new solvability model, new failure cases, and likely new level
  authoring rules.
- It risks invalidating current levels and MAZ-130/MAZ-131..136 assumptions.

### Option C: No persisted shape, derive background from arrows

Keep using arrow bounds and only make the dotted background less rectangular.

Not recommended.

Reason:

- It cannot represent empty abstract areas visible in the reference.
- It gives no canonical shape for JSON levels, random generation, or future
  user-uploaded shapes.

## Recommended Data Contract

Add an optional field:

```json
{
  "boardShape": {
    "type": "CELL_MASK",
    "cells": [
      { "row": 0, "col": 0 },
      { "row": 0, "col": 1 }
    ]
  }
}
```

Rules:

- `boardShape` is optional for backward compatibility.
- `boardShape.type` starts with only `CELL_MASK`.
- `boardShape.cells` is a finite, non-empty list when present.
- Each cell coordinate is integer-based and uses the same `row`/`col` lattice as
  arrows.
- Duplicate shape cells are invalid.
- A level with `boardShape` is invalid if any arrow cell lies outside the mask.
- Shape cells should have a maximum count to protect mobile rendering and API
  payload size. Proposed initial limit: 600 cells.
- Shape connectivity should be required for authored/published levels unless the
  team explicitly wants disconnected abstract islands.

Open decision:

- Should shape connectivity be mandatory for every level, or only a warning in
  authoring tools?

## JSON Level Storage

### Can levels be stored in the database?

Yes. The backend already stores level structure as JSON/JSONB for arrows. The
same pattern can store `boardShape` as JSONB on the `levels` table.

Recommended DB path:

- Add nullable `levels.board_shape` JSONB.
- Map it in Prisma as `boardShape Json? @map("board_shape")`.
- Validate in infrastructure mapper before reconstituting a domain level.
- Include `definition.boardShape` in `GET /levels/:levelId`.
- Include optional summary metadata in `GET /levels` if useful later:
  `shapeCellCount`, not the full mask.

### Where should authored JSON live?

Recommended:

- Canonical authored seed JSON should live in the backend near seeding:
  `arrow-maze-backend/prisma/seed-data/level-json/`.
- The seed script should read those JSON files, validate them through the
  domain/application path, and upsert them.
- The client should consume published levels through the backend. The client may
  keep a tiny fallback fixture, but not a second canonical catalog.

Alternative:

- Keep TS fixtures in client and generate backend seed data from them.

Reason to avoid it:

- It makes the mobile repo the source of truth for backend data and increases
  contract drift risk.

## JsonLevelStrategy Plan

Current behavior is green for the existing schema. To support shapes:

- Extend `LevelDefinition` with optional `boardShape`.
- Add plain DTO/value types for shape coordinates in `src/application`.
- Extend `JsonLevelStrategy` to parse and validate optional `boardShape`.
- Keep `JsonLevelStrategy` pure: no file system, no HTTP, no DB.
- Add tests:
  - parses a valid JSON level with `boardShape`;
  - rejects duplicate mask cells;
  - rejects arrow cells outside mask;
  - keeps current no-shape JSON backward compatible;
  - builds a playable level from a shaped JSON definition.

Design note:

- `JsonLevelStrategy` should not own generation. It should parse and validate a
  supplied JSON string. Generation belongs in a separate strategy or backend
  service.

## Client Rendering Plan

Application/DTO:

- `BoardSnapshotDto` should include optional `boardShape`.
- `BoardSnapshotMapper` should pass shape cells through as plain DTOs.
- `bounds` should be derived from the union of arrow cells and shape cells, so
  empty visible shape cells are framed.

Presentation:

- `BoardView` should render dotted cells only for `boardShape.cells` when a
  shape exists.
- Without `boardShape`, it should keep the current rectangular fallback.
- Arrow visuals and hit targets stay unchanged.
- Extraction animation still travels outside the visible shape boundary.

Tests:

- `BoardSnapshotMapper` includes shape and bounds from shape cells.
- `BoardView` renders mask-only dots for a shaped board.
- Existing tap targets still work.
- Empty/extracted board with shape still renders the shape background if the
  design wants a cleared-board visual.

Open decision:

- After victory, should the cleared board keep rendering the empty shape or fade
  to the existing empty board state?

## Backend Plan

Domain:

- Introduce a `BoardShape` value object only if approved by the team.
- Validate non-empty cell mask, duplicate coordinates, max size, and arrow
  containment.
- Keep `LevelSolvabilityPolicy` based on arrow blocking graph for the MVP.

Application:

- Extend create/update level inputs with optional `boardShape`.
- Extend `LevelDefinitionDto` output with optional `boardShape`.
- Reject invalid shape payloads as controlled validation errors.

Infrastructure:

- Add Prisma migration for `levels.board_shape`.
- Map JSONB to/from domain safely.
- Preserve backward compatibility for existing rows with `null` shape.

Framework:

- Update OpenAPI schemas for create, update, and get level.
- Keep admin auth requirements unchanged for create/update/publish/archive.

Database:

- Yes, store the shape JSON in the DB.
- Keep generated/user-uploaded source images out of the DB for MVP.
- If image upload is added later, store original images in object storage and
  only store derived `boardShape` JSON in Postgres.

## RandomLevelStrategy Proposal

Goal:

- Generate deterministic playable levels from constraints instead of hand-writing
  every JSON file.

Recommended first version:

```ts
type RandomLevelOptions = {
  seed: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  shape: BoardShape;
  arrowCount: number;
  maxArrowLength: number;
  attempts: number;
};
```

Rules:

- Implements or mirrors `ILevelStrategy`.
- Uses a seeded PRNG so the same seed produces the same level.
- Generates arrows only inside `boardShape`.
- Generates orthogonally connected, non-self-intersecting paths.
- Ensures unique arrow IDs and valid directions.
- Validates generated output through the same domain rules as JSON-authored
  levels.
- Ensures solvability by construction or by solver rejection.

Preferred algorithm:

1. Pick a shape mask.
2. Generate a target extraction order.
3. Place arrows in reverse dependency order so blockers form a DAG.
4. Reject and retry if an arrow path is invalid, outside the mask, too short, or
   creates a cycle.
5. Stop after a bounded number of attempts and return a controlled generation
   failure.

Daily challenge path:

- Backend should own daily challenge generation and persistence.
- A date-based seed can create one candidate per day.
- The accepted generated level should be stored as a normal level row, so every
  player receives the same puzzle and leaderboard/progress IDs remain stable.

Open decision:

- Should `RandomLevelStrategy` live first in the client application layer for
  offline/demo generation, or in the backend for daily challenge persistence?

Recommendation:

- Build the deterministic generator in backend first if the feature is tied to
  daily challenge, DB storage, or shared leaderboards.
- Build it in client first only if the need is local prototyping without network.

## Gemini / AI Evaluation

Official Gemini API docs currently support structured outputs with JSON Schema,
which is useful for type-shaped JSON candidates. The docs also support image
understanding and object detection style outputs over uploaded images.

References:

- Structured output:
  https://ai.google.dev/gemini-api/docs/structured-output
- Image understanding:
  https://ai.google.dev/gemini-api/docs/image-understanding

Practical assessment:

- Gemini can plausibly generate candidate JSON that follows a schema.
- Gemini cannot be trusted as the authority for game validity.
- Every AI-produced candidate must be parsed by `JsonLevelStrategy` and
  validated by backend domain rules before it is saved or published.
- Gemini keys must never go into the mobile app. Any Gemini integration belongs
  on the backend or an admin-only local tool using environment variables.

Recommended AI scope:

- Phase 1: no Gemini in production path.
- Phase 2: admin/dev tool: prompt -> structured JSON candidate -> validation ->
  save as draft level.
- Phase 3: optional daily challenge assistant, only after deterministic random
  generation exists and can validate/reject candidates.

Not recommended:

- Letting the mobile app call Gemini directly.
- Publishing AI-generated levels without deterministic validation.
- Using Gemini as the only solver.

## Image/User Shape Upload Evaluation

User story:

- User uploads an image or draws a shape, and the system converts it into a board
  shape for a level.

Technical feasibility:

- Possible in a controlled form.
- Hard if the input can be arbitrary photos, complex logos, or low-contrast
  images.

Recommended limited version:

- Accept a simple high-contrast silhouette or a drawn grid shape.
- Convert image -> binary mask -> downsample to lattice -> `boardShape.cells`.
- Then use deterministic `RandomLevelStrategy` to place arrows inside that mask.
- Validate and preview before publishing.

Not recommended for MVP:

- Arbitrary image upload that directly creates a playable level.
- Asking Gemini to infer both shape and playable arrow layout from any image in
  one step.

Reason:

- Shape extraction and puzzle generation are separate problems.
- The hard part is not JSON syntax; it is producing a solvable, balanced level
  that matches the game rules.

## Affected Tickets / Areas

Existing work touched by this feature:

- `MAZ-130`: backend ArrowSpec level catalog and solvability policy.
- `MAZ-131`: client domain BoardGroup, ArrowSpec, CollisionService.
- `MAZ-133`: client JsonLevelStrategy, LevelDefinition, Builder/Director.
- `MAZ-134`: manual level fixtures and seed assumptions.
- `MAZ-135`: BoardView / GameViewModel / UI canvas.
- `MAZ-136`: domain/application test hardening.
- `MAZ-141`: backend-driven mobile integration and contract sync.
- `MAZ-143`: backend Prisma persistence path.
- `MAZ-144`: SVG neon arrow rendering and extraction animation.

Expected new ticket split:

1. Backend shaped level contract and persistence.
2. Client shaped JSON parsing and board snapshot.
3. Client shaped board rendering.
4. Seed level JSON migration / authored abstract levels.
5. Random level generation spike or implementation.
6. Optional AI/image authoring spike, not part of MVP.

## MVP Acceptance Criteria Draft

S1 - Parse shaped JSON

Given a JSON level with a valid `boardShape.cells` mask
When the client parses it with `JsonLevelStrategy`
Then the resulting `LevelDefinition` includes the shape and builds a playable
level.

S2 - Preserve backward compatibility

Given an existing JSON level without `boardShape`
When the client parses and starts it
Then the current rectangular board rendering path still works.

S3 - Reject invalid shape

Given a JSON level with duplicate shape cells or an arrow cell outside the mask
When it is parsed or persisted
Then a controlled validation error is returned.

S4 - Persist shape in backend

Given an admin creates or updates a level with `boardShape`
When the backend saves the level
Then the shape is stored in the database and returned by `GET /levels/:levelId`.

S5 - Render abstract board

Given a level with a shape mask
When the game screen renders the board
Then only mask cells render as the dotted board background and arrow taps still
work.

S6 - Keep extraction rules stable

Given an arrow whose forward ray has no active arrow blockers
When the board shape boundary lies ahead of the arrow
Then the arrow can still extract, because the shape is not a physical wall in
MVP.

S7 - Validate generated levels

Given a randomly generated level candidate
When it is produced by `RandomLevelStrategy`
Then it must pass the same ArrowSpec, board shape, and solvability validation as
authored JSON.

S8 - Keep AI behind validation

Given a Gemini-generated JSON candidate
When the candidate is submitted for use
Then the backend must validate it before saving or publishing it.

## Linear Ticket Draft

Title:

`AM-XXX - Support abstract shaped Arrow Untangle boards`

Description:

Implement optional shaped board masks for Arrow Untangle levels. Extend the
level JSON contract with a finite cell mask, store it in the backend level
catalog, expose it through the API, parse it in the client through
`JsonLevelStrategy`, and render the board background using the mask while
preserving current unbounded extraction physics.

Out of scope:

- Arbitrary image upload.
- Runtime Gemini generation in mobile.
- Shape boundaries as physical blockers.
- Automatic daily challenge publishing.

Acceptance criteria:

- Use S1-S6 from this plan for MVP.
- Track S7-S8 only if random/AI work is included in the same milestone; otherwise
  create follow-up tickets.

Implementation notes:

- Use existing Strategy pattern: extend `JsonLevelStrategy`; add
  `RandomLevelStrategy` only after MVP contract is stable.
- Store `boardShape` in backend DB as JSONB.
- Update OpenAPI, contract tests, backend mapper, client DTOs, and BoardView.
- Maintain Clean Architecture boundaries.

## Open Questions For Team Approval

1. Do we approve Option A: shape is visual + placement mask, not a physical
   blocker?
2. Should shape connectivity be mandatory?
3. Should canonical authored JSON live in backend `prisma/seed-data/level-json/`?
4. Should `RandomLevelStrategy` be backend-first for daily challenge, or
   client-first for local prototyping?
5. Should image upload be explicitly deferred to a later spike?
6. Should Gemini be limited to an admin/dev authoring assistant, never direct
   mobile runtime?
