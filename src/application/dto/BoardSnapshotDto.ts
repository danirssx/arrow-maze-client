import type { CellType } from "../../domain/value-objects/CellType";
import type { PositionDto } from "../use-cases/game/GameSnapshotDto";

/**
 * UI-neutral board cell DTO.
 *
 * Plain, serializable description of a single cell for rendering: its position,
 * its `CellType` (a shared serializable string), and, only for arrow cells, the
 * direction name (`UP`/`DOWN`/`LEFT`/`RIGHT`). It exposes no domain cell class.
 */
export type BoardCellDto = {
  readonly row: number;
  readonly column: number;
  readonly type: CellType;
  readonly direction?: string;
};

/**
 * UI-neutral board snapshot (domain → presentation boundary).
 *
 * The full static board layout a screen needs to draw the grid — dimensions,
 * start and exit positions, and every cell — without ever importing or reading
 * `BoardGraph`, `BoardGroup`, or any domain cell class.
 */
export type BoardSnapshotDto = {
  readonly rows: number;
  readonly cols: number;
  readonly start: PositionDto;
  readonly exit: PositionDto;
  readonly cells: readonly BoardCellDto[];
};
