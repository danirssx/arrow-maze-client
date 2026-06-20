import type { ArrowSpec } from "../../domain/value-objects/ArrowSpec";
import { BoundingBox } from "../../domain/value-objects/BoundingBox";
import type { Position } from "../../domain/value-objects/Position";
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
 * board. `bounds` is derived from every arrow cell (for camera/scroll framing).
 */
export function mapBoardSnapshot(definition: LevelDefinition): BoardSnapshotDto {
  const arrows = definition.arrows.map(mapArrow);
  const cells = definition.arrows.flatMap((spec) => [...spec.cells]);

  let bounds: BoardBoundsDto | null = null;
  if (cells.length > 0) {
    const box = BoundingBox.fromPositions(cells);
    bounds = { minRow: box.minRow, minCol: box.minCol, maxRow: box.maxRow, maxCol: box.maxCol };
  }

  return { arrows, bounds };
}
