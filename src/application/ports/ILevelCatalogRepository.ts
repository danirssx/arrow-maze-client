import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import type { DifficultyDto } from "@/application/dto/DifficultyDto";

export type LevelCatalogSummary = {
  readonly levelId: string;
  readonly name: string;
  readonly difficulty: DifficultyDto;
  readonly arrowCount: number;
  readonly attempts: number;
  readonly timeLimitSeconds?: number;
};

export interface ILevelCatalogRepository {
  getLevels(): Promise<readonly LevelCatalogSummary[]>;
  getLevelDefinition(levelId: string): Promise<LevelDefinition>;
}
