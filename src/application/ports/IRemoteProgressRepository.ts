import type { LocalProgress, CompletedLevelData } from './IProgressRepository';

export interface IRemoteProgressRepository {
  fetchRemote(accessToken: string): Promise<LocalProgress>;
  sync(accessToken: string, completedLevels: CompletedLevelData[]): Promise<LocalProgress>;
}
