import type { ArrowSpec } from "../../domain/value-objects/ArrowSpec";
import { BoundingBox } from "../../domain/value-objects/BoundingBox";
import { Position } from "../../domain/value-objects/Position";
import type { LevelDefinition } from "../level-build/LevelDefinition";
import type { ArrowDto, BoardBoundsDto, BoardSnapshotDto, CoordinateDto } from "./BoardSnapshotDto";

function toCoordinate(position: Position): CoordinateDto {
  return { row: position.row, column: position.col };
}

function mapArrow(spec: ArrowSpec): ArrowDto {
  return {
    id: spec.id,
    color: spec.color,
    direction: spec.direction.name,
    cells: spec.cells.map(toCoordinate),
    head: toCoordinate(spec.head)
  };
}

/**
 * Maps a `LevelDefinition` to a UI-neutral `BoardSnapshotDto`.
 *
 * Flattens the domain `ArrowSpec`/`Position`/`Direction` into plain DTO data so
 * presentation renders arrows from DTOs, never from `BoardGroup` or the domain
 * board. `bounds` frames the union of arrow cells and (when present) the
 * `boardShape` mask cells, so empty visible shape cells are still framed.
 */
export function mapBoardSnapshot(definition: LevelDefinition): BoardSnapshotDto {
  const arrows = definition.arrows.map(mapArrow);
  const shapeCells = definition.boardShape?.cells;

  const cells: Position[] = definition.arrows.flatMap((spec) => [...spec.cells]);
  if (shapeCells) {
    for (const cell of shapeCells) {
      cells.push(Position.of(cell.row, cell.col));
    }
  }

  let bounds: BoardBoundsDto | null = null;
  if (cells.length > 0) {
    const box = BoundingBox.fromPositions(cells);
    bounds = { minRow: box.minRow, minCol: box.minCol, maxRow: box.maxRow, maxCol: box.maxCol };
  }

  return {
    arrows,
    bounds,
    ...(shapeCells
      ? { boardShape: shapeCells.map((cell): CoordinateDto => ({ row: cell.row, column: cell.col })) }
      : {})
  };
}
