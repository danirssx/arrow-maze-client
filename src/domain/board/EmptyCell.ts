import { CellType } from "../value-objects/CellType";
import type { Position } from "../value-objects/Position";
import { Cell } from "./Cell";

/**
 * Composite pattern — Leaf. An empty, walkable cell.
 */
export class EmptyCell extends Cell {
  constructor(position: Position) {
    super(position, CellType.Empty);
  }
}
