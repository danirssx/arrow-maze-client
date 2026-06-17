import type { CellType } from "../value-objects/CellType";
import type { Direction } from "../value-objects/Direction";
import type { Position } from "../value-objects/Position";
import type { IBoardComponent } from "./IBoardComponent";

/**
 * Composite pattern — Leaf contract.
 *
 * A single board cell. Extends `IBoardComponent` so a cell can be treated
 * uniformly with a `BoardGroup`. Exposes pure domain behavior only (`isExit`,
 * `isBlocking`); rendering belongs to the presentation layer.
 */
export interface ICell extends IBoardComponent {
  readonly position: Position;
  readonly type: CellType;
  /** Present only for arrow cells. */
  readonly direction?: Direction;

  isExit(): boolean;
  isBlocking(): boolean;
}
