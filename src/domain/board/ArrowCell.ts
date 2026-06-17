import { CellType } from "../value-objects/CellType";
import type { Direction } from "../value-objects/Direction";
import type { Position } from "../value-objects/Position";
import { Cell } from "./Cell";

/**
 * Composite pattern — Leaf. An arrow cell that points in a fixed direction.
 */
export class ArrowCell extends Cell {
  constructor(
    position: Position,
    readonly direction: Direction
  ) {
    super(position, CellType.Arrow);
  }
}
