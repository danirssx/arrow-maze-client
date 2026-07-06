import { manualLevels } from "@/application/level-build/fixtures";
import { LevelKind } from "@/application/level-build/LevelDefinition";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import type { DifficultyDto } from "@/application/dto/DifficultyDto";
import type { ILevelCatalogRepository, LevelCatalogSummary } from "@/application/ports/ILevelCatalogRepository";
import type { UserRole } from "@/application/auth/AuthSession";
import { lockedLevelIds } from "@/application/level-build/levelUnlock";
import { AsyncStatus } from "@/presentation/state/AsyncUiState";
import { ObservableViewModel } from "./ObservableViewModel";

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

export type LevelAccessContext = {
  readonly role?: UserRole;
};

export type LevelSelectUiState = {
  readonly status: AsyncStatus;
  readonly levels: readonly LevelListItem[];
  readonly error: boolean;
};

const initialLevelSelectUiState: LevelSelectUiState = {
  status: AsyncStatus.Loading,
  levels: [],
  error: false,
};

/**
 * MVVM — level select ViewModel.
 *
 * Extends ObservableViewModel so the LevelSelectScreen can react to state
 * changes without manual useState in the route. Call `load()` to trigger the
 * async fetch; the state transitions Loading → Loaded / Empty / Error.
 * `getLevels` and `getDefinition` remain available for synchronous access.
 */
export class LevelSelectViewModel extends ObservableViewModel<LevelSelectUiState> {
  constructor(private readonly remote?: ILevelCatalogRepository) {
    super(initialLevelSelectUiState);
  }

  getLevels(
    completedLevelIds: readonly string[] = [],
    access: LevelAccessContext = {},
  ): readonly LevelListItem[] {
    const base = manualLevels.map<BaseLevelItem>((level) => ({
      id: level.id,
      name: level.name,
      order: level.order,
      difficultyStars: LevelSelectViewModel.starsFor(level.difficulty),
      difficultyLabel: LevelSelectViewModel.labelFor(level.difficulty),
      arrowCount: level.arrowCount,
      timed: level.definition.kind === LevelKind.Timed
    }));
    return this.applyLocks(base, completedLevelIds, access);
  }

  getDefinition(levelId: string): LevelDefinition | undefined {
    return manualLevels.find((level) => level.id === levelId)?.definition;
  }

  async load(
    completedLevelIds: readonly string[] = [],
    access: LevelAccessContext = {},
  ): Promise<void> {
    this.setState({ status: AsyncStatus.Loading, levels: [], error: false });
    try {
      const levels = await this.loadLevels(completedLevelIds, access);
      this.setState({
        status: levels.length === 0 ? AsyncStatus.Empty : AsyncStatus.Loaded,
        levels,
        error: false,
      });
    } catch {
      const fallback = this.getLevels(completedLevelIds, access);
      this.setState({ status: AsyncStatus.Loaded, levels: fallback, error: true });
    }
  }

  async loadLevels(
    completedLevelIds: readonly string[] = [],
    access: LevelAccessContext = {},
  ): Promise<readonly LevelListItem[]> {
    if (this.remote === undefined) return this.getLevels(completedLevelIds, access);
    const levels = await this.remote.getLevels();
    const base = levels.map((level, index) => LevelSelectViewModel.toBaseItem(level, index));
    return this.applyLocks(base, completedLevelIds, access);
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
    access: LevelAccessContext,
  ): readonly LevelListItem[] {
    if (access.role === "ADMIN") {
      return base.map((item) => ({ ...item, locked: false }));
    }
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
