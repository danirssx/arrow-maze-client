import type { CellSpec } from "./CellSpec";
import type { Difficulty } from "./Difficulty";
import { InvalidLevelTemplateError, PositionOutOfBoundsError } from "./errors";
import type { Position } from "./Position";

type LevelTemplateParams = {
  id: string;
  rows: number;
  cols: number;
  difficulty: Difficulty;
  cells: readonly CellSpec[];
};

/**
 * LevelTemplate value object (immutable).
 *
 * Pure blueprint of a level: its grid dimensions, difficulty, and the cell
 * specifications that populate it. `LevelTemplate.create` validates that the
 * grid is well-formed and that every cell falls inside the grid, so an
 * out-of-board cell fails on creation. `cellAt` rejects out-of-board queries,
 * satisfying controlled failure on both creation and lookup.
 */
export class LevelTemplate {
  private constructor(
    readonly id: string,
    readonly rows: number,
    readonly cols: number,
    readonly difficulty: Difficulty,
    readonly cells: readonly CellSpec[]
  ) {}

  static create(params: LevelTemplateParams): LevelTemplate {
    if (!Number.isInteger(params.rows) || !Number.isInteger(params.cols)) {
      throw new InvalidLevelTemplateError("Level dimensions must be integers.");
    }
    if (params.rows <= 0 || params.cols <= 0) {
      throw new InvalidLevelTemplateError("Level dimensions must be positive.");
    }

    const seen = new Set<string>();
    for (const cell of params.cells) {
      if (!LevelTemplate.isInside(params.rows, params.cols, cell.position)) {
        throw new InvalidLevelTemplateError(
          `Cell at ${cell.position.toKey()} is outside a ${params.rows}x${params.cols} board.`
        );
      }
      const key = cell.position.toKey();
      if (seen.has(key)) {
        throw new InvalidLevelTemplateError(`Duplicate cell at ${key}.`);
      }
      seen.add(key);
    }

    return new LevelTemplate(params.id, params.rows, params.cols, params.difficulty, [...params.cells]);
  }

  isWithinBounds(position: Position): boolean {
    return LevelTemplate.isInside(this.rows, this.cols, position);
  }

  cellAt(position: Position): CellSpec | undefined {
    if (!this.isWithinBounds(position)) {
      throw new PositionOutOfBoundsError(
        `Position ${position.toKey()} is outside a ${this.rows}x${this.cols} board.`
      );
    }
    return this.cells.find((cell) => cell.position.equals(position));
  }

  private static isInside(rows: number, cols: number, position: Position): boolean {
    return position.row < rows && position.col < cols;
  }
}
