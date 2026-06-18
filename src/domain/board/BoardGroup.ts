import { BoundingBox } from "../value-objects/BoundingBox";
import type { Position } from "../value-objects/Position";
import type { ArrowEntity } from "./ArrowEntity";
import { DuplicateArrowError } from "./errors";

/**
 * BoardGroup — domain aggregate / occupancy index.
 *
 * Holds every arrow placed on the (unbounded) board plus a coordinate index
 * (`Map<coordKey, Set<arrowId>>`) answering "which arrows occupy this cell?".
 * Overlaps are allowed — a cell may belong to several arrows, which is exactly
 * the "knot". The index is built once from each arrow's full path. Arrow removal
 * is modeled by flipping `ArrowEntity` state (active/extracted), so queries
 * filter by `isActive` and the index itself never mutates, keeping undo trivial.
 */
export class BoardGroup {
  private readonly byId = new Map<string, ArrowEntity>();
  private readonly cellIndex = new Map<string, Set<string>>();

  constructor(arrows: readonly ArrowEntity[] = []) {
    for (const arrow of arrows) {
      this.place(arrow);
    }
  }

  private place(arrow: ArrowEntity): void {
    if (this.byId.has(arrow.id)) {
      throw new DuplicateArrowError(`An arrow with id ${arrow.id} already exists on the board.`);
    }
    this.byId.set(arrow.id, arrow);
    for (const cell of arrow.cells) {
      const key = cell.toKey();
      const occupants = this.cellIndex.get(key) ?? new Set<string>();
      occupants.add(arrow.id);
      this.cellIndex.set(key, occupants);
    }
  }

  get(id: string): ArrowEntity | undefined {
    return this.byId.get(id);
  }

  allArrows(): readonly ArrowEntity[] {
    return [...this.byId.values()];
  }

  activeArrows(): readonly ArrowEntity[] {
    return this.allArrows().filter((arrow) => arrow.isActive);
  }

  activeArrowCount(): number {
    return this.activeArrows().length;
  }

  /** Active arrows occupying a given cell — used to resolve a tap to an arrow. */
  activeArrowsAt(position: Position): readonly ArrowEntity[] {
    const occupants = this.cellIndex.get(position.toKey());
    if (occupants === undefined) {
      return [];
    }

    const result: ArrowEntity[] = [];
    for (const id of occupants) {
      const arrow = this.byId.get(id);
      if (arrow !== undefined && arrow.isActive) {
        result.push(arrow);
      }
    }
    return result;
  }

  /** Camera/scroll framing over active arrows; `undefined` when the board is empty. */
  activeBounds(): BoundingBox | undefined {
    const cells = this.activeArrows().flatMap((arrow) => [...arrow.cells]);
    if (cells.length === 0) {
      return undefined;
    }
    return BoundingBox.fromPositions(cells);
  }
}
