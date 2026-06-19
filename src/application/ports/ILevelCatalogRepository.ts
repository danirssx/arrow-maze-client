import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import type { Difficulty } from "@/domain/value-objects/Difficulty";

export type LevelCatalogSummary = {
  readonly levelId: string;
  readonly name: string;
  readonly difficulty: Difficulty;
  readonly arrowCount: number;
  readonly attempts: number;
  readonly timeLimitSeconds?: number;
};

export interface ILevelCatalogRepository {
  getLevels(): Promise<readonly LevelCatalogSummary[]>;
  getLevelDefinition(levelId: string): Promise<LevelDefinition>;
}
