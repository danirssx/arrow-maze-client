import { CellSpec } from "../../../domain/value-objects/CellSpec";
import { CellType } from "../../../domain/value-objects/CellType";
import { Difficulty } from "../../../domain/value-objects/Difficulty";
import { Direction } from "../../../domain/value-objects/Direction";
import { LevelTemplate } from "../../../domain/value-objects/LevelTemplate";
import { Position } from "../../../domain/value-objects/Position";
import type { LevelDefinition } from "../LevelDefinition";
import { LevelKind } from "../LevelDefinition";
import { InvalidLevelDefinitionError } from "../errors";

type Coordinate = readonly [row: number, col: number];

type ManualLevelParams = {
  readonly id: string;
  readonly order: number;
  readonly version: number;
  readonly rows: number;
  readonly cols: number;
  readonly difficulty: Difficulty;
  readonly path: readonly Coordinate[];
  readonly walls?: readonly Coordinate[];
  readonly timeLimitSeconds?: number;
};

export type ManualLevelFixture = {
  readonly id: string;
  readonly order: number;
  readonly version: number;
  readonly expectedOptimalMoves: number;
  readonly definition: LevelDefinition;
};

function position([row, col]: Coordinate): Position {
  return Position.of(row, col);
}

function directionBetween(from: Coordinate, to: Coordinate): Direction {
  const rowDelta = to[0] - from[0];
  const colDelta = to[1] - from[1];

  if (rowDelta === -1 && colDelta === 0) {
    return Direction.Up;
  }
  if (rowDelta === 1 && colDelta === 0) {
    return Direction.Down;
  }
  if (rowDelta === 0 && colDelta === -1) {
    return Direction.Left;
  }
  if (rowDelta === 0 && colDelta === 1) {
    return Direction.Right;
  }

  throw new InvalidLevelDefinitionError(`Manual level path has non-adjacent step ${from.join(",")} -> ${to.join(",")}.`);
}

function makeLevel(params: ManualLevelParams): ManualLevelFixture {
  if (params.path.length < 2) {
    throw new InvalidLevelDefinitionError(`Manual level ${params.id} must include at least start and exit.`);
  }
  const start = params.path[0];
  if (start === undefined) {
    throw new InvalidLevelDefinitionError(`Manual level ${params.id} must include a start position.`);
  }

  const pathCells = params.path.map((cell, index) => {
    const next = params.path[index + 1];
    if (next === undefined) {
      return CellSpec.of(position(cell), CellType.Exit);
    }
    return CellSpec.of(position(cell), CellType.Arrow, directionBetween(cell, next));
  });

  const wallCells = (params.walls ?? []).map((cell) => CellSpec.of(position(cell), CellType.Wall));
  const template = LevelTemplate.create({
    id: params.id,
    rows: params.rows,
    cols: params.cols,
    difficulty: params.difficulty,
    cells: [...pathCells, ...wallCells]
  });

  const baseDefinition = {
    template,
    start: position(start),
    kind: params.timeLimitSeconds === undefined ? LevelKind.Normal : LevelKind.Timed
  };

  return {
    id: params.id,
    order: params.order,
    version: params.version,
    expectedOptimalMoves: params.path.length - 1,
    definition:
      params.timeLimitSeconds === undefined
        ? baseDefinition
        : { ...baseDefinition, timeLimitSeconds: params.timeLimitSeconds }
  };
}

/**
 * Builder-compatible manual level fixtures.
 *
 * These definitions are local application data, not UI assets. Each path is a
 * directed solution route made of arrow cells ending in one exit cell; walls add
 * visible obstacle complexity for future rendering while `LevelDirector`
 * remains the source of truth for solvability and `optimalMoves`.
 */
export const manualLevels: readonly ManualLevelFixture[] = [
  makeLevel({
    id: "manual-001-first-turn",
    order: 1,
    version: 1,
    rows: 2,
    cols: 3,
    difficulty: Difficulty.Easy,
    path: [
      [0, 0],
      [0, 1],
      [0, 2]
    ]
  }),
  makeLevel({
    id: "manual-002-corner-drop",
    order: 2,
    version: 1,
    rows: 2,
    cols: 4,
    difficulty: Difficulty.Easy,
    path: [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
      [1, 3]
    ],
    walls: [
      [1, 0],
      [0, 2]
    ]
  }),
  makeLevel({
    id: "manual-003-bottom-run",
    order: 3,
    version: 1,
    rows: 3,
    cols: 4,
    difficulty: Difficulty.Easy,
    path: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3]
    ],
    walls: [
      [0, 1],
      [1, 1],
      [1, 2]
    ]
  }),
  makeLevel({
    id: "manual-004-center-bend",
    order: 4,
    version: 1,
    rows: 3,
    cols: 5,
    difficulty: Difficulty.Easy,
    path: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 2],
      [2, 3],
      [2, 4]
    ],
    walls: [
      [1, 0],
      [1, 1],
      [1, 3],
      [0, 4]
    ]
  }),
  makeLevel({
    id: "manual-005-wide-intro",
    order: 5,
    version: 1,
    rows: 4,
    cols: 5,
    difficulty: Difficulty.Easy,
    path: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
      [1, 2],
      [1, 3],
      [1, 4]
    ],
    walls: [
      [0, 1],
      [0, 2],
      [3, 0],
      [3, 2],
      [2, 4]
    ]
  }),
  makeLevel({
    id: "manual-006-medium-switchback",
    order: 6,
    version: 1,
    rows: 4,
    cols: 5,
    difficulty: Difficulty.Medium,
    path: [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [2, 2],
      [2, 3],
      [3, 3],
      [3, 4]
    ],
    walls: [
      [1, 0],
      [1, 2],
      [0, 3],
      [3, 1],
      [2, 4],
      [0, 4]
    ]
  }),
  makeLevel({
    id: "manual-007-medium-timer",
    order: 7,
    version: 1,
    rows: 4,
    cols: 6,
    difficulty: Difficulty.Medium,
    path: [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 2],
      [3, 2],
      [3, 3],
      [3, 4],
      [3, 5]
    ],
    walls: [
      [0, 1],
      [0, 2],
      [2, 0],
      [2, 1],
      [2, 4],
      [1, 5],
      [0, 5]
    ],
    timeLimitSeconds: 70
  }),
  makeLevel({
    id: "manual-008-medium-lane",
    order: 8,
    version: 1,
    rows: 5,
    cols: 6,
    difficulty: Difficulty.Medium,
    path: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 2],
      [2, 3],
      [2, 4],
      [3, 4],
      [4, 4],
      [4, 5]
    ],
    walls: [
      [1, 0],
      [1, 1],
      [1, 3],
      [3, 1],
      [3, 2],
      [3, 3],
      [4, 0],
      [0, 5]
    ]
  }),
  makeLevel({
    id: "manual-009-medium-pressure",
    order: 9,
    version: 1,
    rows: 5,
    cols: 7,
    difficulty: Difficulty.Medium,
    path: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
      [3, 2],
      [4, 2],
      [4, 3],
      [4, 4],
      [3, 4],
      [3, 5],
      [3, 6]
    ],
    walls: [
      [0, 1],
      [1, 1],
      [1, 3],
      [2, 4],
      [2, 5],
      [4, 0],
      [4, 1],
      [0, 6],
      [1, 6]
    ],
    timeLimitSeconds: 65
  }),
  makeLevel({
    id: "manual-010-medium-finale",
    order: 10,
    version: 1,
    rows: 5,
    cols: 8,
    difficulty: Difficulty.Medium,
    path: [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [2, 2],
      [2, 3],
      [1, 3],
      [1, 4],
      [1, 5],
      [2, 5],
      [3, 5],
      [4, 5],
      [4, 6],
      [4, 7]
    ],
    walls: [
      [1, 0],
      [3, 0],
      [3, 1],
      [0, 3],
      [0, 4],
      [2, 4],
      [3, 3],
      [3, 4],
      [0, 7],
      [2, 7]
    ],
    timeLimitSeconds: 60
  }),
  makeLevel({
    id: "manual-011-hard-crossing",
    order: 11,
    version: 1,
    rows: 6,
    cols: 8,
    difficulty: Difficulty.Hard,
    path: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 2],
      [2, 3],
      [2, 4],
      [3, 4],
      [4, 4],
      [4, 5],
      [4, 6],
      [5, 6],
      [5, 7]
    ],
    walls: [
      [1, 0],
      [1, 1],
      [2, 0],
      [3, 0],
      [3, 2],
      [3, 3],
      [5, 0],
      [5, 1],
      [0, 5],
      [1, 5],
      [2, 7],
      [4, 7]
    ]
  }),
  makeLevel({
    id: "manual-012-hard-timer",
    order: 12,
    version: 1,
    rows: 6,
    cols: 9,
    difficulty: Difficulty.Hard,
    path: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
      [3, 2],
      [4, 2],
      [4, 3],
      [4, 4],
      [4, 5],
      [3, 5],
      [3, 6],
      [4, 6],
      [5, 6],
      [5, 7],
      [5, 8]
    ],
    walls: [
      [0, 1],
      [1, 1],
      [3, 0],
      [4, 0],
      [0, 3],
      [1, 3],
      [2, 4],
      [2, 5],
      [1, 7],
      [2, 7],
      [4, 8],
      [0, 8],
      [5, 0]
    ],
    timeLimitSeconds: 70
  }),
  makeLevel({
    id: "manual-013-hard-ridge",
    order: 13,
    version: 1,
    rows: 7,
    cols: 9,
    difficulty: Difficulty.Hard,
    path: [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
      [3, 2],
      [3, 3],
      [2, 3],
      [2, 4],
      [2, 5],
      [3, 5],
      [4, 5],
      [5, 5],
      [5, 6],
      [5, 7],
      [6, 7],
      [6, 8]
    ],
    walls: [
      [1, 0],
      [2, 0],
      [4, 0],
      [4, 1],
      [0, 3],
      [1, 3],
      [4, 3],
      [5, 3],
      [0, 6],
      [1, 6],
      [2, 7],
      [3, 7],
      [4, 8],
      [6, 0]
    ],
    timeLimitSeconds: 65
  }),
  makeLevel({
    id: "manual-014-hard-maze",
    order: 14,
    version: 1,
    rows: 7,
    cols: 10,
    difficulty: Difficulty.Hard,
    path: [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 2],
      [3, 2],
      [3, 3],
      [3, 4],
      [4, 4],
      [5, 4],
      [5, 5],
      [5, 6],
      [4, 6],
      [4, 7],
      [4, 8],
      [5, 8],
      [6, 8],
      [6, 9]
    ],
    walls: [
      [0, 1],
      [0, 2],
      [2, 0],
      [3, 0],
      [4, 0],
      [0, 4],
      [1, 4],
      [2, 4],
      [2, 6],
      [3, 6],
      [6, 4],
      [6, 5],
      [1, 8],
      [2, 8],
      [3, 9]
    ],
    timeLimitSeconds: 60
  }),
  makeLevel({
    id: "manual-015-hard-finale",
    order: 15,
    version: 1,
    rows: 8,
    cols: 10,
    difficulty: Difficulty.Hard,
    path: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 2],
      [2, 3],
      [2, 4],
      [3, 4],
      [4, 4],
      [4, 5],
      [4, 6],
      [3, 6],
      [2, 6],
      [2, 7],
      [2, 8],
      [3, 8],
      [4, 8],
      [5, 8],
      [6, 8],
      [6, 9],
      [7, 9]
    ],
    walls: [
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 0],
      [1, 4],
      [5, 4],
      [6, 4],
      [7, 4],
      [0, 5],
      [1, 5],
      [5, 6],
      [6, 6],
      [7, 6],
      [0, 8],
      [1, 8],
      [4, 9]
    ],
    timeLimitSeconds: 55
  })
];

export const manualLevelDefinitions: readonly LevelDefinition[] = manualLevels.map((level) => level.definition);
