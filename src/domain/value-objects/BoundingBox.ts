import { InvalidBoundingBoxError } from "./errors";
import type { Position } from "./Position";

/**
 * BoundingBox value object (immutable).
 *
 * Smallest axis-aligned rectangle (in lattice coordinates) containing a set of
 * positions. Derived purely for camera/scroll framing on the unbounded board; it
 * is NEVER consulted by game rules. `fromPositions` rejects an empty set so a
 * box always describes a real region.
 */
export class BoundingBox {
  private constructor(
    readonly minRow: number,
    readonly minCol: number,
    readonly maxRow: number,
    readonly maxCol: number
  ) {}

  static fromPositions(positions: readonly Position[]): BoundingBox {
    if (positions.length === 0) {
      throw new InvalidBoundingBoxError("A bounding box requires at least one position.");
    }

    const first = positions[0];
    if (first === undefined) {
      throw new InvalidBoundingBoxError("A bounding box requires at least one position.");
    }
    let minRow = first.row;
    let maxRow = first.row;
    let minCol = first.col;
    let maxCol = first.col;
    for (const position of positions) {
      minRow = Math.min(minRow, position.row);
      maxRow = Math.max(maxRow, position.row);
      minCol = Math.min(minCol, position.col);
      maxCol = Math.max(maxCol, position.col);
    }

    return new BoundingBox(minRow, minCol, maxRow, maxCol);
  }

  get rows(): number {
    return this.maxRow - this.minRow + 1;
  }

  get cols(): number {
    return this.maxCol - this.minCol + 1;
  }

  contains(position: Position): boolean {
    return (
      position.row >= this.minRow &&
      position.row <= this.maxRow &&
      position.col >= this.minCol &&
      position.col <= this.maxCol
    );
  }
}
