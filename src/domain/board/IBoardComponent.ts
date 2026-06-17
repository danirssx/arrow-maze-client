import type { Position } from "../value-objects/Position";
import type { ICell } from "./ICell";

/**
 * Composite pattern — Component.
 *
 * Uniform contract shared by board leaves (`ICell`) and composites
 * (`BoardGroup`). Callers can iterate and query a whole board without knowing
 * whether a node is a single cell or a group, and without any UI knowledge.
 */
export interface IBoardComponent {
  /** Number of leaf cells contained by this component. */
  readonly size: number;

  /** Whether a cell exists at the given position within this component. */
  has(position: Position): boolean;

  /** The cell at the given position, or `undefined` if none exists here. */
  find(position: Position): ICell | undefined;

  /** Flattened, read-only view of every leaf cell in this component. */
  toCells(): readonly ICell[];
}
