import { CellType } from "../value-objects/CellType";
import type { Position } from "../value-objects/Position";
import { Cell } from "./Cell";

/**
 * Composite pattern — Leaf. The exit cell that completes a level.
 */
export class ExitCell extends Cell {
  constructor(position: Position) {
    super(position, CellType.Exit);
  }

  override isExit(): boolean {
    return true;
  }
}
