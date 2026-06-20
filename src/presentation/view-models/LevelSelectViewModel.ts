import { manualLevels } from "@/application/level-build/fixtures";
import { LevelKind } from "@/application/level-build/LevelDefinition";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import type { ILevelCatalogRepository, LevelCatalogSummary } from "@/application/ports/ILevelCatalogRepository";
import type { Difficulty } from "@/domain/value-objects/Difficulty";

export type LevelListItem = {
  readonly id: string;
  readonly order: number;
  readonly difficulty: Difficulty;
  readonly arrowCount: number;
  readonly timed: boolean;
};

/**
 * MVVM — level select ViewModel.
 *
 * Exposes the ordered manual level catalog as plain list items for the
 * `LevelSelectScreen` and resolves a tapped level back to its `LevelDefinition`
 * for the gameplay ViewModel. It reads the application fixtures only; it never
 * builds boards or evaluates solvability itself.
 */
export class LevelSelectViewModel {
  constructor(private readonly remote?: ILevelCatalogRepository) {}

  getLevels(): readonly LevelListItem[] {
    return manualLevels.map((level) => ({
      id: level.id,
      order: level.order,
      difficulty: level.difficulty,
      arrowCount: level.arrowCount,
      timed: level.definition.kind === LevelKind.Timed
    }));
  }

  getDefinition(levelId: string): LevelDefinition | undefined {
    return manualLevels.find((level) => level.id === levelId)?.definition;
  }

  async loadLevels(): Promise<readonly LevelListItem[]> {
    if (this.remote === undefined) return this.getLevels();
    const levels = await this.remote.getLevels();
    return levels.map((level, index) => LevelSelectViewModel.toListItem(level, index));
  }

  async loadDefinition(levelId: string): Promise<LevelDefinition | undefined> {
    if (this.remote === undefined) return this.getDefinition(levelId);
    return this.remote.getLevelDefinition(levelId);
  }

  private static toListItem(level: LevelCatalogSummary, index: number): LevelListItem {
    return {
      id: level.levelId,
      order: index + 1,
      difficulty: level.difficulty,
      arrowCount: level.arrowCount,
      timed: level.timeLimitSeconds !== undefined,
    };
  }
}
