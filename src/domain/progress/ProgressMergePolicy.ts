import { CompletedLevel, type CompletedLevelSnapshot } from "./CompletedLevel";

export class ProgressMergePolicy {
  mergeCompletion(
    completedLevels: readonly CompletedLevelSnapshot[],
    incomingSnapshot: CompletedLevelSnapshot,
  ): CompletedLevelSnapshot[] {
    const incoming = CompletedLevel.fromSnapshot(incomingSnapshot);
    const existing = completedLevels
      .map((level) => CompletedLevel.fromSnapshot(level))
      .find((level) => level.sameLevelAs(incoming));

    if (existing && !incoming.isBetterThan(existing)) {
      return completedLevels.map((level) => ({ ...level }));
    }

    return [
      ...completedLevels.filter((level) => level.levelId !== incomingSnapshot.levelId),
      incoming.toSnapshot(),
    ];
  }
}
