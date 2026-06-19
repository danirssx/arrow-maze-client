import type { LocalProgress, CompletedLevelData } from './IProgressRepository';

export interface IRemoteProgressRepository {
  fetchRemote(accessToken: string): Promise<LocalProgress>;
  completeLevel(accessToken: string, completedLevel: CompletedLevelData): Promise<void>;
  sync(accessToken: string, completedLevels: CompletedLevelData[]): Promise<LocalProgress>;
}
