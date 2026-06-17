import type { ICell } from "../board/ICell";
import type { CellSpec } from "../value-objects/CellSpec";

/**
 * Factory Method pattern — cell factory contract.
 *
 * Converts declarative cell specs into concrete domain cells without leaking
 * switch statements throughout the board model.
 */
export interface ICellFactory {
  create(spec: CellSpec): ICell;
}
