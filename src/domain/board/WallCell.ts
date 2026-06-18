import { CellType } from "../value-objects/CellType";
import type { Position } from "../value-objects/Position";
import { Cell } from "./Cell";

/**
 * Composite pattern — Leaf. A wall cell that blocks movement.
 */
export class WallCell extends Cell {
  constructor(position: Position) {
    super(position, CellType.Wall);
  }

  override isBlocking(): boolean {
    return true;
  }
}
