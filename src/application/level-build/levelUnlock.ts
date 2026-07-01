// Application seam for sequential level progression (MAZ-191).
//
// The progression rule itself lives in the pure domain `LevelUnlockPolicy`. This
// thin application module exposes it to the presentation/framework layers so they
// consume an application entry point instead of importing a domain type directly
// (mirrors how `ProgressFacade` wraps `ProgressMergePolicy`).
import { LevelUnlockPolicy, type LevelOrderRef } from "@/domain/progress/LevelUnlockPolicy";

const policy = new LevelUnlockPolicy();

export function lockedLevelIds(
  levels: readonly LevelOrderRef[],
  completedLevelIds: Iterable<string>,
): ReadonlySet<string> {
  return policy.lockedLevelIds(levels, completedLevelIds);
}

export function isLevelUnlocked(
  levels: readonly LevelOrderRef[],
  completedLevelIds: Iterable<string>,
  levelId: string,
): boolean {
  return policy.isUnlocked(levels, completedLevelIds, levelId);
}

export type { LevelOrderRef };
