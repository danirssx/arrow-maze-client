import type { ICell } from "../board/ICell";
import { CellDecorator } from "./CellDecorator";

/**
 * Decorator pattern — collectable cell behavior.
 *
 * Adds collectable state to a cell while preserving the wrapped cell movement
 * behavior. Collection is deterministic and idempotent.
 */
export class CollectableCellDecorator extends CellDecorator {
  private collected = false;

  constructor(
    cell: ICell,
    readonly collectableId: string
  ) {
    super(cell);
  }

  isCollectable(): boolean {
    return !this.collected;
  }

  collect(): void {
    this.collected = true;
  }

  isCollected(): boolean {
    return this.collected;
  }
}
