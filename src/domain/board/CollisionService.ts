import type { Direction } from "../value-objects/Direction";
import type { Position } from "../value-objects/Position";
import type { BoardGroup } from "./BoardGroup";
import { ArrowNotFoundError } from "./errors";

/**
 * CollisionService — domain service (directional raycast).
 *
 * Decides whether an arrow can be extracted on an UNBOUNDED board: the straight
 * ray from the head, one step in the arrow's `direction` and onward to infinity,
 * must not meet any cell occupied by ANOTHER active arrow. The arrow's own body
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
    if (direction.colDelta === 0) {
      // vertical ray (Up/Down): same column, strictly forward along rows
      return cell.col === head.col && (cell.row - head.row) * direction.rowDelta > 0;
    }
    // horizontal ray (Left/Right): same row, strictly forward along columns
    return cell.row === head.row && (cell.col - head.col) * direction.colDelta > 0;
  }
}
