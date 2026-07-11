import { LevelKind } from "@/application/level-build/LevelDefinition";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import type { DailyChallenge } from "@/application/ports/IDailyChallengeRepository";
import type { DifficultyDto } from "@/application/dto/DifficultyDto";
import { ArrowSpec } from "@/domain/value-objects/ArrowSpec";
import { Direction } from "@/domain/value-objects/Direction";
import type { Difficulty } from "@/domain/value-objects/Difficulty";
import { Position } from "@/domain/value-objects/Position";
import type { DailyChallengeDto } from "./DailyChallengeDtos";

/**
 * Maps the backend daily-challenge payload into the client `DailyChallenge`.
 *
 * Reuses the same arrow/board-shape mapping as `LevelCatalogMapper`, but the
 * daily `level` carries no id, so the definition id is synthesized from the
 * deterministic `seed` (e.g. "daily-2026-07-10"). That id is intentionally NOT a
 * v4 UUID, which keeps the daily level out of the leaderboard/progress writes.
 */
export class DailyChallengeMapper {
  static toDailyChallenge(dto: DailyChallengeDto): DailyChallenge {
    const level = dto.level;
    const definition: LevelDefinition = {
      id: dto.seed,
      difficulty: level.difficulty as Difficulty,
      arrows: level.definition.arrows.map((arrow) =>
        ArrowSpec.of(
          arrow.id,
          arrow.color,
          arrow.path.map((position) => Position.of(position.row, position.col)),
          Direction.fromName(arrow.direction),
        )
      ),
      attempts: level.definition.attempts,
      kind: level.timeLimitSeconds === undefined ? LevelKind.Normal : LevelKind.Timed,
      ...(level.timeLimitSeconds !== undefined ? { timeLimitSeconds: level.timeLimitSeconds } : {}),
      ...(level.definition.boardShape !== undefined
        ? {
            boardShape: {
              type: "CELL_MASK" as const,
              cells: level.definition.boardShape.cells.map((cell) => ({
                row: cell.row,
                col: cell.col,
              })),
            },
          }
        : {}),
    };

    return {
      definition,
      meta: {
        date: dto.date,
        difficulty: level.difficulty as DifficultyDto,
        source: dto.source,
        fallbackUsed: dto.validation.fallbackUsed,
      },
    };
  }
}
