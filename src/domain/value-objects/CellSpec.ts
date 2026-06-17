import { CellType } from "./CellType";
import type { Direction } from "./Direction";
import { InvalidCellSpecError } from "./errors";
import type { Position } from "./Position";

/**
 * CellSpec value object (immutable).
 *
 * Declarative description of a single cell inside a `LevelTemplate`: its
 * position, its type, and (only for arrow cells) the direction it points to.
 * `CellSpec.of` enforces the invariant that a direction is present exactly when
 * the cell is an arrow, so malformed specifications fail in a controlled way.
 */
export class CellSpec {
  private constructor(
    readonly position: Position,
    readonly type: CellType,
    readonly direction?: Direction
  ) {}

  static of(position: Position, type: CellType, direction?: Direction): CellSpec {
    if (type === CellType.Arrow && direction === undefined) {
      throw new InvalidCellSpecError("An arrow cell requires a direction.");
    }
    if (type !== CellType.Arrow && direction !== undefined) {
      throw new InvalidCellSpecError("Only arrow cells may define a direction.");
    }
    return new CellSpec(position, type, direction);
  }

  equals(other: CellSpec): boolean {
    const sameDirection =
      this.direction === undefined
        ? other.direction === undefined
        : other.direction !== undefined && this.direction.equals(other.direction);
    return this.position.equals(other.position) && this.type === other.type && sameDirection;
  }
}
