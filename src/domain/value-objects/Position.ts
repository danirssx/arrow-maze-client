import type { Direction } from "./Direction";
import { InvalidPositionError } from "./errors";

/**
 * Position value object (immutable).
 *
 * A lattice coordinate as integer `row`/`col`/`z` on an UNBOUNDED 3D board:
 * negative coordinates are valid because the untangle board has no fixed origin
 * or edges. `z` is the depth axis; it defaults to `0`, so a planar (2D) level is
 * simply the `z = 0` slab and existing 2D call sites keep working unchanged.
 * Construction is validated through `Position.of`, so a non-integer coordinate
 * fails in a controlled way (`InvalidPositionError`). `translate` may cross into
 * negative space and preserves depth for planar directions (the depth-axis
 * directions are introduced with `Direction`'s `zDelta`).
 */
export class Position {
  private constructor(
    readonly row: number,
    readonly col: number,
    readonly z: number
  ) {}

  static of(row: number, col: number, z = 0): Position {
    if (!Number.isInteger(row) || !Number.isInteger(col) || !Number.isInteger(z)) {
      throw new InvalidPositionError(`Position coordinates must be integers, received (${row}, ${col}, ${z}).`);
    }
    return new Position(row, col, z);
  }

  translate(direction: Direction): Position {
    return Position.of(this.row + direction.rowDelta, this.col + direction.colDelta, this.z);
  }

  equals(other: Position): boolean {
    return this.row === other.row && this.col === other.col && this.z === other.z;
  }

  toKey(): string {
    return `${this.row},${this.col},${this.z}`;
  }
}
