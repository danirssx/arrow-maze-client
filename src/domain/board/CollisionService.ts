import type { Direction } from "../value-objects/Direction";
import type { Position } from "../value-objects/Position";
import type { BoardGroup } from "./BoardGroup";
import { ArrowNotFoundError } from "./errors";

/**
 * CollisionService — domain service (directional raycast).
 *
 * Decides whether an arrow can be extracted on an UNBOUNDED 3D board: the
 * straight ray from the head along the arrow's `direction` world axis, onward to
 * infinity, must not meet any cell occupied by ANOTHER active arrow. The own body
 * is transparent, and overlaps are respected (any other active arrow on the ray
 * blocks). Because there is no board edge, the ray is tested against the finite
 * set of other active cells instead of being walked cell by cell.
 */
export class CollisionService {
  canExtract(board: BoardGroup, arrowId: string): boolean {
    const arrow = board.get(arrowId);
    if (arrow === undefined) {
      throw new ArrowNotFoundError(`No arrow with id ${arrowId} on the board.`);
    }
    if (!arrow.isActive) {
      return false;
    }

    const head = arrow.head;
    const direction = arrow.direction;
    for (const other of board.activeArrows()) {
      if (other.id === arrow.id) {
        continue; // own body never blocks
      }
      for (const cell of other.cells) {
        if (CollisionService.isStrictlyAhead(head, direction, cell)) {
          return false;
        }
      }
    }
    return true;
  }

  private static isStrictlyAhead(head: Position, direction: Direction, cell: Position): boolean {
    // Each direction moves along exactly one world axis. A cell is strictly ahead
    // when it shares the two perpendicular coordinates and is forward on that axis.
    if (direction.rowDelta !== 0) {
      // row ray (Up/Down): same column and depth, strictly forward along rows
      return cell.col === head.col && cell.z === head.z && (cell.row - head.row) * direction.rowDelta > 0;
    }
    if (direction.colDelta !== 0) {
      // column ray (Left/Right): same row and depth, strictly forward along columns
      return cell.row === head.row && cell.z === head.z && (cell.col - head.col) * direction.colDelta > 0;
    }
    // depth ray (Forward/Back): same row and column, strictly forward along depth
    return cell.row === head.row && cell.col === head.col && (cell.z - head.z) * direction.zDelta > 0;
  }
}
