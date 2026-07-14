import type { ArrowSpec } from "../../domain/value-objects/ArrowSpec";
import { BoundingBox } from "../../domain/value-objects/BoundingBox";
import { Position } from "../../domain/value-objects/Position";
import type { LevelDefinition } from "../level-build/LevelDefinition";
import type { ArrowDto, BoardBoundsDto, BoardSnapshotDto, CoordinateDto } from "./BoardSnapshotDto";

function includesDepth(definition: LevelDefinition): boolean {
  return (
    definition.dimensions === 3 ||
    definition.arrows.some((spec) => spec.cells.some((cell) => cell.z !== 0)) ||
    definition.boardShape?.cells.some((cell) => (cell.z ?? 0) !== 0) === true
  );
}

function toCoordinate(position: Position, includeDepth: boolean): CoordinateDto {
  return includeDepth ? { row: position.row, column: position.col, z: position.z } : { row: position.row, column: position.col };
}

function mapArrow(spec: ArrowSpec, includeDepth: boolean): ArrowDto {
  return {
    id: spec.id,
    color: spec.color,
    direction: spec.direction.name,
    cells: spec.cells.map((cell) => toCoordinate(cell, includeDepth)),
    head: toCoordinate(spec.head, includeDepth)
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
  const includeDepth = includesDepth(definition);
  const arrows = definition.arrows.map((spec) => mapArrow(spec, includeDepth));
  const shapeCells = definition.boardShape?.cells;

  const cells: Position[] = definition.arrows.flatMap((spec) => [...spec.cells]);
  if (shapeCells) {
    for (const cell of shapeCells) {
      cells.push(Position.of(cell.row, cell.col, cell.z ?? 0));
    }
  }

  let bounds: BoardBoundsDto | null = null;
  if (cells.length > 0) {
    const box = BoundingBox.fromPositions(cells);
    const baseBounds = { minRow: box.minRow, minCol: box.minCol, maxRow: box.maxRow, maxCol: box.maxCol };
    if (includeDepth) {
      const zValues = cells.map((cell) => cell.z);
      bounds = { ...baseBounds, minZ: Math.min(...zValues), maxZ: Math.max(...zValues) };
    } else {
      bounds = baseBounds;
    }
  }

  return {
    arrows,
    bounds,
    ...(shapeCells
      ? {
          boardShape: shapeCells.map((cell): CoordinateDto =>
            includeDepth ? { row: cell.row, column: cell.col, z: cell.z ?? 0 } : { row: cell.row, column: cell.col }
          )
        }
      : {})
  };
}
