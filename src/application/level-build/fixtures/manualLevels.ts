import { ArrowSpec } from "../../../domain/value-objects/ArrowSpec";
import { Difficulty } from "../../../domain/value-objects/Difficulty";
import { Direction } from "../../../domain/value-objects/Direction";
import { Position } from "../../../domain/value-objects/Position";
import type { LevelDefinition } from "../LevelDefinition";
import { LevelKind } from "../LevelDefinition";

/**
 * Builder-compatible manual level fixtures (Arrow Untangle puzzle).
 *
 * Each level is a set of 1-cell-wide arrows whose BODIES can bend — "snakes" in
 * L, zigzag and staircase shapes — that cross each other to form a "knot". Only
 * the straight ray in front of each head decides blocking (see CollisionService),
 * so a curved body is free to weave through the knot without changing the puzzle
 * contract.
 *
 * The family is provably solvable by construction, regardless of how the bodies
 * bend, because every fixture obeys two rules:
 *   1. every head points UP or RIGHT, and
 *   2. every body extends only DOWN and/or LEFT away from its head.
 * Under those rules an arrow's head has a strictly smaller `row - col` than any
 * cell that could block it, so a blocker's head always has a smaller `row - col`
 * than the arrow it blocks. The blocking graph is therefore acyclic (a DAG) and a
 * valid removal order always exists — verified by the solvability test, not
 * assumed. Difficulty scales with arrow count, body length, and crossings.
 */

type Axis = "UP" | "RIGHT";

/** A body step taken AWAY from the head (tail-ward). Only DOWN/LEFT keep the set solvable. */
type BodyStep = "DOWN" | "LEFT";

type ArrowDraft = {
  readonly id: string;
  readonly color: string;
  readonly headRow: number;
  readonly headCol: number;
  readonly axis: Axis;
  /** Body cells described from the head outward; empty means a single-cell arrow. */
  readonly body: readonly BodyStep[];
};

type LevelDraft = {
  readonly id: string;
  readonly difficulty: Difficulty;
  readonly arrowCount: number;
  readonly attempts?: number;
  readonly timeLimitSeconds?: number;
};

export type ManualLevelFixture = {
  readonly id: string;
  readonly order: number;
  readonly difficulty: Difficulty;
  readonly arrowCount: number;
  readonly definition: LevelDefinition;
};

const COLORS = ["blue", "green", "yellow", "pink", "cyan", "purple", "crimson", "white", "orange", "teal"] as const;

function color(index: number): string {
  return COLORS[index % COLORS.length] ?? "blue";
}

function letter(index: number): string {
  return String.fromCharCode(97 + index); // a, b, c, ...
}

/** Straight run of `length` body cells in one direction. */
function run(length: number, step: BodyStep): BodyStep[] {
  return Array.from({ length: Math.max(0, length) }, () => step);
}

/** One-bend "L" body: `first` for the first half, the other axis for the rest. */
function lShape(length: number, first: BodyStep): BodyStep[] {
  const second: BodyStep = first === "DOWN" ? "LEFT" : "DOWN";
  const head = Math.ceil(length / 2);
  return [...run(head, first), ...run(length - head, second)];
}

/** Staircase / zigzag body: alternate axes starting with `first`. */
function zigzag(length: number, first: BodyStep): BodyStep[] {
  const second: BodyStep = first === "DOWN" ? "LEFT" : "DOWN";
  return Array.from({ length: Math.max(0, length) }, (_, i) => (i % 2 === 0 ? first : second));
}

/**
 * Build an arrow whose head sits at (headRow, headCol) and whose body bends away
 * from the head using only DOWN/LEFT steps. Path runs tail -> head (head last).
 */
function snake(draft: ArrowDraft): ArrowSpec {
  let row = draft.headRow;
  let col = draft.headCol;
  const fromHead: Position[] = [Position.of(row, col)];
  for (const step of draft.body) {
    if (step === "DOWN") {
      row += 1;
    } else {
      col -= 1;
    }
    fromHead.push(Position.of(row, col));
  }
  const path = [...fromHead].reverse(); // tail (last body cell) -> head
  const direction = draft.axis === "UP" ? Direction.Up : Direction.Right;
  return ArrowSpec.of(draft.id, draft.color, path, direction);
}

/**
 * Deterministically lay out `n` crossing snake-arrows: one straight RIGHT "top
 * bar" on row 0 plus UP snakes hanging under it (blocked by the bar until it
 * leaves) and a few RIGHT snakes on lower rows. Every head points UP or RIGHT and
 * every body bends only DOWN/LEFT, so the set is always solvable while still
 * requiring the player to find the order.
 */
function knot(n: number): ArrowDraft[] {
  const width = Math.max(4, Math.ceil(n / 2) + 2);
  // Top bar stays straight so it blocks every UP head hanging beneath it.
  const arrows: ArrowDraft[] = [
    { id: letter(0), color: color(0), headRow: 0, headCol: width, axis: "RIGHT", body: run(width, "LEFT") }
  ];

  for (let i = 1; i < n; i += 1) {
    const bodyLength = 2 + (i % 3); // 2..4 body cells
    if (i % 2 === 1) {
      // UP snake: hangs down from under the bar, then curls left.
      arrows.push({
        id: letter(i),
        color: color(i),
        headRow: 1,
        headCol: (i * 2) % width,
        axis: "UP",
        body: (i % 3 === 0 ? zigzag : lShape)(bodyLength, "DOWN")
      });
    } else {
      // RIGHT snake: reaches left across the lower rows, then steps down.
      arrows.push({
        id: letter(i),
        color: color(i),
        headRow: 1 + (i % 4),
        headCol: width + 1 + (i % 3),
        axis: "RIGHT",
        body: (i % 3 === 0 ? zigzag : lShape)(bodyLength, "LEFT")
      });
    }
  }

  return arrows;
}

function toDefinition(draft: LevelDraft): LevelDefinition {
  const arrows = knot(draft.arrowCount).map(snake);
  const timed = draft.timeLimitSeconds !== undefined;

  return {
    id: draft.id,
    difficulty: draft.difficulty,
    arrows,
    kind: timed ? LevelKind.Timed : LevelKind.Normal,
    ...(draft.attempts !== undefined ? { attempts: draft.attempts } : {}),
    ...(timed ? { timeLimitSeconds: draft.timeLimitSeconds } : {})
  };
}

const LEVEL_DRAFTS: readonly LevelDraft[] = [
  { id: "manual-001-first-knot", difficulty: Difficulty.Easy, arrowCount: 2 },
  { id: "manual-002-warm-up", difficulty: Difficulty.Easy, arrowCount: 3 },
  { id: "manual-003-cross", difficulty: Difficulty.Easy, arrowCount: 3 },
  { id: "manual-004-tangle", difficulty: Difficulty.Easy, arrowCount: 4 },
  { id: "manual-005-weave", difficulty: Difficulty.Easy, arrowCount: 4 },
  { id: "manual-006-stack", difficulty: Difficulty.Medium, arrowCount: 5 },
  { id: "manual-007-rush", difficulty: Difficulty.Medium, arrowCount: 5, timeLimitSeconds: 75 },
  { id: "manual-008-lattice", difficulty: Difficulty.Medium, arrowCount: 6 },
  { id: "manual-009-pressure", difficulty: Difficulty.Medium, arrowCount: 6, timeLimitSeconds: 70 },
  { id: "manual-010-medium-finale", difficulty: Difficulty.Medium, arrowCount: 7, timeLimitSeconds: 65 },
  { id: "manual-011-hard-knot", difficulty: Difficulty.Hard, arrowCount: 7, attempts: 4 },
  { id: "manual-012-hard-timer", difficulty: Difficulty.Hard, arrowCount: 8, attempts: 4, timeLimitSeconds: 70 },
  { id: "manual-013-hard-mesh", difficulty: Difficulty.Hard, arrowCount: 8, attempts: 4, timeLimitSeconds: 65 },
  { id: "manual-014-hard-snarl", difficulty: Difficulty.Hard, arrowCount: 9, attempts: 4, timeLimitSeconds: 60 },
  { id: "manual-015-hard-finale", difficulty: Difficulty.Hard, arrowCount: 10, attempts: 3, timeLimitSeconds: 55 }
];

export const manualLevels: readonly ManualLevelFixture[] = LEVEL_DRAFTS.map((draft, index) => ({
  id: draft.id,
  order: index + 1,
  difficulty: draft.difficulty,
  arrowCount: draft.arrowCount,
  definition: toDefinition(draft)
}));

export const manualLevelDefinitions: readonly LevelDefinition[] = manualLevels.map((level) => level.definition);
