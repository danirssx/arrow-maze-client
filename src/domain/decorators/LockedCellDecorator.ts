import { CellDecorator } from "./CellDecorator";

/**
 * Decorator pattern — locked cell behavior.
 *
 * Adds a blocking rule to an existing cell without changing the wrapped cell's
 * class. Later application/domain rules can replace this with unlock policies
 * without touching base cell implementations.
 */
export class LockedCellDecorator extends CellDecorator {
  override isBlocking(): boolean {
    return true;
  }
}
