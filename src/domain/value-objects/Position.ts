import type { Direction } from "./Direction";
import { InvalidPositionError } from "./errors";

/**
 * Position value object (immutable).
 *
 * A lattice coordinate as integer `row`/`col` on an UNBOUNDED board: negative
 * coordinates are valid because the untangle board has no fixed origin or edges.
 * Construction is validated through `Position.of`, so a non-integer coordinate
 * fails in a controlled way (`InvalidPositionError`). `translate` may cross into
 * negative space.
 */
export class Position {
  private constructor(
    readonly row: number,
    readonly col: number
  ) {}

  static of(row: number, col: number): Position {
    if (!Number.isInteger(row) || !Number.isInteger(col)) {
      throw new InvalidPositionError(`Position coordinates must be integers, received (${row}, ${col}).`);
    }
    return new Position(row, col);
  }

  translate(direction: Direction): Position {
    return Position.of(this.row + direction.rowDelta, this.col + direction.colDelta);
  }

  equals(other: Position): boolean {
    return this.row === other.row && this.col === other.col;
  }

  toKey(): string {
    return `${this.row},${this.col}`;
  }
}
