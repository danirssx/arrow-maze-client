import { manualLevels } from "@/application/level-build/fixtures";
import { LevelKind } from "@/application/level-build/LevelDefinition";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import type { DifficultyDto } from "@/application/dto/DifficultyDto";
import type { ILevelCatalogRepository, LevelCatalogSummary } from "@/application/ports/ILevelCatalogRepository";
import { lockedLevelIds } from "@/application/level-build/levelUnlock";

const DIFFICULTY_STARS: Record<DifficultyDto, number> = { EASY: 1, MEDIUM: 2, HARD: 3 };
const DIFFICULTY_LABEL: Record<DifficultyDto, string> = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };

export type LevelListItem = {
  readonly id: string;
  readonly name: string;
  readonly order: number;
  readonly difficultyStars: number;
  readonly difficultyLabel: string;
  readonly arrowCount: number;
  readonly timed: boolean;
  readonly locked: boolean;
};

type BaseLevelItem = Omit<LevelListItem, "locked">;

/**
 * MVVM — level select ViewModel.
 *
 * Exposes the ordered manual level catalog as plain list items for the
 * `LevelSelectScreen` and resolves a tapped level back to its `LevelDefinition`
 * for the gameplay ViewModel. It reads the application fixtures/port only; it
 * never builds boards, evaluates solvability, or holds a domain type — difficulty
 * reaches the view as ready-to-consume `difficultyStars`/`difficultyLabel`.
 */
export class LevelSelectViewModel {
  constructor(private readonly remote?: ILevelCatalogRepository) {}

  getLevels(completedLevelIds: readonly string[] = []): readonly LevelListItem[] {
    const base = manualLevels.map<BaseLevelItem>((level) => ({
      id: level.id,
      name: level.name,
      order: level.order,
      difficultyStars: LevelSelectViewModel.starsFor(level.difficulty),
      difficultyLabel: LevelSelectViewModel.labelFor(level.difficulty),
      arrowCount: level.arrowCount,
      timed: level.definition.kind === LevelKind.Timed
    }));
    return this.applyLocks(base, completedLevelIds);
  }

  getDefinition(levelId: string): LevelDefinition | undefined {
    return manualLevels.find((level) => level.id === levelId)?.definition;
  }

  async loadLevels(completedLevelIds: readonly string[] = []): Promise<readonly LevelListItem[]> {
    if (this.remote === undefined) return this.getLevels(completedLevelIds);
    const levels = await this.remote.getLevels();
    const base = levels.map((level, index) => LevelSelectViewModel.toBaseItem(level, index));
    return this.applyLocks(base, completedLevelIds);
  }

  async loadDefinition(levelId: string): Promise<LevelDefinition | undefined> {
    if (this.remote === undefined) return this.getDefinition(levelId);
    return this.remote.getLevelDefinition(levelId);
  }

  // Sequential progression (MAZ-191): the pure domain policy decides which levels are
  // locked from the ordered catalog + the completed level ids; the ViewModel only maps.
  private applyLocks(
    base: readonly BaseLevelItem[],
    completedLevelIds: readonly string[],
  ): readonly LevelListItem[] {
    const locked = lockedLevelIds(base, completedLevelIds);
    return base.map((item) => ({ ...item, locked: locked.has(item.id) }));
  }

  private static toBaseItem(level: LevelCatalogSummary, index: number): BaseLevelItem {
    return {
      id: level.levelId,
      name: level.name,
      order: index + 1,
      difficultyStars: LevelSelectViewModel.starsFor(level.difficulty),
      difficultyLabel: LevelSelectViewModel.labelFor(level.difficulty),
      arrowCount: level.arrowCount,
      timed: level.timeLimitSeconds !== undefined,
    };
  }

  private static starsFor(difficulty: DifficultyDto): number {
    return DIFFICULTY_STARS[difficulty] ?? 1;
  }

  private static labelFor(difficulty: DifficultyDto): string {
    return DIFFICULTY_LABEL[difficulty] ?? difficulty;
  }
}
