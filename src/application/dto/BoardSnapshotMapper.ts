import type { LevelDefinition } from "../level-build/LevelDefinition";
import { InvalidLevelDefinitionError } from "../level-build/errors";
import type { BoardArrowDto, BoardBoundingBoxDto, BoardSnapshotDto } from "./BoardSnapshotDto";

/**
 * Maps a `LevelDefinition` to a UI-neutral `BoardSnapshotDto`.
 *
 * This is the domain-to-UI-neutral board mapper: it flattens `ArrowSpec[]` into
 * plain DTO data so presentation renders the unbounded arrow canvas from DTOs,
 * never from domain entities or the collision board.
 */
export function mapBoardSnapshot(definition: LevelDefinition): BoardSnapshotDto {
  if (definition.arrows.length === 0) {
    throw new InvalidLevelDefinitionError(`Level ${definition.id} has no arrows to render.`);
  }

  const arrows: BoardArrowDto[] = definition.arrows.map((arrow) => ({
    id: arrow.id,
    color: arrow.color,
    path: arrow.path.map((position) => ({ row: position.row, column: position.col })),
    direction: arrow.direction.name
  }));

  return {
    levelId: definition.id,
    arrows,
    boundingBox: calculateBounds(arrows),
    attempts: definition.attempts ?? 5
  };
}

function calculateBounds(arrows: readonly BoardArrowDto[]): BoardBoundingBoxDto {
  const cells = arrows.flatMap((arrow) => arrow.path);
  return {
    minRow: Math.min(...cells.map((cell) => cell.row)),
    maxRow: Math.max(...cells.map((cell) => cell.row)),
    minColumn: Math.min(...cells.map((cell) => cell.column)),
    maxColumn: Math.max(...cells.map((cell) => cell.column))
  };
}
