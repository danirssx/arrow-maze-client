import { CellType } from "../../domain/value-objects/CellType";
import type { LevelDefinition } from "../level-build/LevelDefinition";
import { InvalidLevelDefinitionError } from "../level-build/errors";
import type { BoardCellDto, BoardSnapshotDto } from "./BoardSnapshotDto";

/**
 * Maps a `LevelDefinition` to a UI-neutral `BoardSnapshotDto`.
 *
 * This is the domain-to-UI-neutral board mapper: it flattens the domain
 * `LevelTemplate`/`CellSpec`/`Position`/`Direction` into plain DTO data so
 * presentation renders the grid from DTOs, never from `BoardGraph` or the
 * Composite board.
 */
export function mapBoardSnapshot(definition: LevelDefinition): BoardSnapshotDto {
  const { template } = definition;

  const exit = template.cells.find((cell) => cell.type === CellType.Exit);
  if (exit === undefined) {
    throw new InvalidLevelDefinitionError(`Level ${template.id} has no exit cell to render.`);
  }

  const cells: BoardCellDto[] = template.cells.map((cell) => ({
    row: cell.position.row,
    column: cell.position.col,
    type: cell.type,
    ...(cell.direction === undefined ? {} : { direction: cell.direction.name })
  }));

  return {
    rows: template.rows,
    cols: template.cols,
    start: { row: definition.start.row, column: definition.start.col },
    exit: { row: exit.position.row, column: exit.position.col },
    cells
  };
}
