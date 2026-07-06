import { LevelKind } from "@/application/level-build/LevelDefinition";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import type { LevelCatalogSummary } from "@/application/ports/ILevelCatalogRepository";
import type { DifficultyDto } from "@/application/dto/DifficultyDto";
import { ArrowSpec } from "@/domain/value-objects/ArrowSpec";
import { Direction } from "@/domain/value-objects/Direction";
import type { Difficulty } from "@/domain/value-objects/Difficulty";
import { Position } from "@/domain/value-objects/Position";
import type { LevelDetailDto, LevelSummaryDto } from "./LevelCatalogDtos";

export class LevelCatalogMapper {
  static toSummary(dto: LevelSummaryDto): LevelCatalogSummary {
    const summary: LevelCatalogSummary = {
      levelId: dto.levelId,
      name: dto.name,
      difficulty: dto.difficulty as DifficultyDto,
      arrowCount: dto.arrowCount,
      attempts: dto.attempts,
      ...(dto.timeLimitSeconds !== undefined ? { timeLimitSeconds: dto.timeLimitSeconds } : {}),
    };
    return summary;
  }

  static toDefinition(dto: LevelDetailDto): LevelDefinition {
    return {
      id: dto.levelId,
      difficulty: dto.difficulty as Difficulty,
      arrows: dto.definition.arrows.map((arrow) =>
        ArrowSpec.of(
          arrow.id,
          arrow.color,
          arrow.path.map((position) => Position.of(position.row, position.col)),
          Direction.fromName(arrow.direction),
        )
      ),
      attempts: dto.definition.attempts,
      kind: dto.timeLimitSeconds === undefined ? LevelKind.Normal : LevelKind.Timed,
      ...(dto.timeLimitSeconds !== undefined ? { timeLimitSeconds: dto.timeLimitSeconds } : {}),
      ...(dto.definition.boardShape !== undefined
        ? {
            boardShape: {
              type: "CELL_MASK" as const,
              cells: dto.definition.boardShape.cells.map((cell) => ({
                row: cell.row,
                col: cell.col,
              })),
            },
          }
        : {}),
    };
  }
}
