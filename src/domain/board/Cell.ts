import type { CellType } from "../value-objects/CellType";
import type { Direction } from "../value-objects/Direction";
import type { Position } from "../value-objects/Position";
import type { ICell } from "./ICell";

/**
 * Composite pattern — Leaf base.
 *
 * Shared leaf behavior for every concrete cell: a leaf has size 1, matches only
 * its own position, and flattens to itself. Concrete cells override domain
 * behavior (`isExit`, `isBlocking`) as needed.
 */
export abstract class Cell implements ICell {
  readonly size = 1;

  protected constructor(
    readonly position: Position,
    readonly type: CellType
  ) {}

  has(position: Position): boolean {
    return this.position.equals(position);
  }

  find(position: Position): ICell | undefined {
    return this.has(position) ? this : undefined;
  }

  toCells(): readonly ICell[] {
    return [this];
  }

  get direction(): Direction | undefined {
    return undefined;
  }

  isExit(): boolean {
    return false;
  }

  isBlocking(): boolean {
    return false;
  }
}
