import type { Direction } from "./Direction";
import { InvalidPositionError } from "./errors";

/**
 * Position value object (immutable).
 *
 * A board coordinate as non-negative integer `row`/`col`. Construction is
 * validated through `Position.of`, so an out-of-range or non-integer coordinate
 * fails in a controlled way (`InvalidPositionError`). Translating past the
 * board origin (negative result) fails the same way.
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
    if (row < 0 || col < 0) {
      throw new InvalidPositionError(`Position coordinates must be non-negative, received (${row}, ${col}).`);
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
