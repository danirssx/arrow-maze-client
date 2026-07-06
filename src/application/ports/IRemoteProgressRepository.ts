import type { LocalProgress, CompletedLevelData } from './IProgressRepository';

export interface IRemoteProgressRepository {
  fetchRemote(): Promise<LocalProgress>;
  completeLevel(completedLevel: CompletedLevelData): Promise<void>;
  sync(completedLevels: CompletedLevelData[]): Promise<LocalProgress>;
}
