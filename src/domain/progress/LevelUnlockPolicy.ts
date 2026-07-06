/**
 * Domain policy — sequential level progression (MAZ-191).
 *
 * A level is playable only when the player has completed the level immediately
 * before it in catalog order. The first level is always unlocked, and a level the
 * player has already completed stays unlocked (so a replay is always allowed, even
 * if an offline/legacy progress gap left a predecessor unrecorded).
 *
 * Pure: it decides from an ordered level reference list and the set of completed
 * level ids only — no UI, storage, HTTP, or navigation.
 */
export interface LevelOrderRef {
  readonly id: string;
  readonly order: number;
}

export class LevelUnlockPolicy {
  lockedLevelIds(
    levels: readonly LevelOrderRef[],
    completedLevelIds: Iterable<string>,
  ): ReadonlySet<string> {
    const completed = new Set(completedLevelIds);
    const ordered = LevelUnlockPolicy.sortByOrder(levels);
    const locked = new Set<string>();
    ordered.forEach((level, index) => {
      if (!LevelUnlockPolicy.isUnlockedAt(ordered, index, completed)) {
        locked.add(level.id);
      }
    });
    return locked;
  }

  isUnlocked(
    levels: readonly LevelOrderRef[],
    completedLevelIds: Iterable<string>,
    levelId: string,
  ): boolean {
    const completed = new Set(completedLevelIds);
    const ordered = LevelUnlockPolicy.sortByOrder(levels);
    const index = ordered.findIndex((level) => level.id === levelId);
    if (index === -1) return false;
    return LevelUnlockPolicy.isUnlockedAt(ordered, index, completed);
  }

  private static sortByOrder(levels: readonly LevelOrderRef[]): readonly LevelOrderRef[] {
    return [...levels].sort((a, b) => a.order - b.order);
  }

  private static isUnlockedAt(
    ordered: readonly LevelOrderRef[],
    index: number,
    completed: Set<string>,
  ): boolean {
    if (index === 0) return true;
    const self = ordered[index]!;
    if (completed.has(self.id)) return true;
    const predecessor = ordered[index - 1]!;
    return completed.has(predecessor.id);
  }
}
