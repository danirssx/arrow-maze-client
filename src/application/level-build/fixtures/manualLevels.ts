import { ArrowSpec } from "../../../domain/value-objects/ArrowSpec";
import { Difficulty } from "../../../domain/value-objects/Difficulty";
import { Direction } from "../../../domain/value-objects/Direction";
import { Position } from "../../../domain/value-objects/Position";
import type { LevelDefinition } from "../LevelDefinition";
import { LevelKind } from "../LevelDefinition";

/**
 * Builder-compatible manual level fixtures (Arrow Untangle puzzle).
 *
 * Each level is a set of straight 1-cell-wide arrows that point only UP or RIGHT
 * and cross each other to form a "knot". This family is provably solvable: with
 * only UP/RIGHT straight arrows the blocking graph is always acyclic (a blocker
 * always has a strictly smaller `row - col` than the arrow it blocks), so a valid
 * removal order always exists — guaranteed by the solvability test, not assumed.
 * Difficulty scales with arrow count, body length, and the number of crossings.
 * These are baseline layouts; visual art-direction (curved bodies) can refine
 * them later without changing the contract.
 */

type Axis = "UP" | "RIGHT";

type ArrowDraft = {
  readonly id: string;
  readonly color: string;
  readonly headRow: number;
  readonly headCol: number;
  readonly axis: Axis;
  readonly length: number;
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

/** Build a straight arrow (head points outward along its single axis). */
function straight(draft: ArrowDraft): ArrowSpec {
  const cells: Position[] = [];
  if (draft.axis === "UP") {
    // Body hangs below the head; path runs tail (bottom) -> head (top).
    for (let i = draft.length - 1; i >= 0; i -= 1) {
      cells.push(Position.of(draft.headRow + i, draft.headCol));
    }
    return ArrowSpec.of(draft.id, draft.color, cells, Direction.Up);
  }
  // RIGHT: body extends left; path runs tail (left) -> head (right).
  for (let i = draft.length - 1; i >= 0; i -= 1) {
    cells.push(Position.of(draft.headRow, draft.headCol - i));
  }
  return ArrowSpec.of(draft.id, draft.color, cells, Direction.Right);
}

/**
 * Deterministically lay out `n` crossing arrows: one RIGHT "top bar" on row 0
 * plus UP arrows hanging under it (blocked by the bar until it leaves) and a few
 * extra RIGHT arrows on lower rows. Every arrow points UP or RIGHT, so the set
 * is always solvable while still requiring the player to find the order.
 */
function knot(n: number): ArrowDraft[] {
  const width = Math.max(4, Math.ceil(n / 2) + 2);
  const arrows: ArrowDraft[] = [
    { id: letter(0), color: color(0), headRow: 0, headCol: width, axis: "RIGHT", length: width + 1 }
  ];

  for (let i = 1; i < n; i += 1) {
    if (i % 2 === 1) {
      arrows.push({
        id: letter(i),
        color: color(i),
        headRow: 1 + (i % 3),
        headCol: (i * 2) % width,
        axis: "UP",
        length: 2 + (i % 3)
      });
    } else {
      arrows.push({
        id: letter(i),
        color: color(i),
        headRow: 1 + (i % 4),
        headCol: width + 1 + (i % 3),
        axis: "RIGHT",
        length: 2 + (i % 3)
      });
    }
  }

  return arrows;
}

function toDefinition(draft: LevelDraft): LevelDefinition {
  const arrows = knot(draft.arrowCount).map(straight);
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
