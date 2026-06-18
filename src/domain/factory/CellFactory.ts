import { ArrowCell } from "../board/ArrowCell";
import { EmptyCell } from "../board/EmptyCell";
import { ExitCell } from "../board/ExitCell";
import type { ICell } from "../board/ICell";
import { WallCell } from "../board/WallCell";
import { CellType } from "../value-objects/CellType";
import type { CellSpec } from "../value-objects/CellSpec";
import { InvalidCellSpecError } from "../value-objects/errors";
import type { ICellFactory } from "./ICellFactory";

/**
 * Factory Method pattern — concrete cell factory.
 *
 * Centralizes the mapping from `CellSpec` data to concrete board cells so the
 * rest of the domain does not duplicate cell-type switches.
 */
export class CellFactory implements ICellFactory {
  create(spec: CellSpec): ICell {
    switch (spec.type) {
      case CellType.Arrow:
        if (spec.direction === undefined) {
          throw new InvalidCellSpecError("Arrow cell specs must include a direction.");
        }
        return new ArrowCell(spec.position, spec.direction);
      case CellType.Wall:
        return new WallCell(spec.position);
      case CellType.Empty:
        return new EmptyCell(spec.position);
      case CellType.Exit:
        return new ExitCell(spec.position);
      default:
        throw new InvalidCellSpecError(`Unknown cell type: ${JSON.stringify(spec.type)}.`);
    }
  }
}
