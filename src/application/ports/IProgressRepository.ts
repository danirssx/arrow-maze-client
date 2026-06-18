export interface CompletedLevelData {
  levelId: string;
  score: number;
  timeSeconds: number;
  movesCount: number;
  completedAt: string;
}

export interface LocalProgress {
  progressId: string;
  userId: string;
  version: number;
  updatedAt: string;
  completedLevels: CompletedLevelData[];
  pendingSync: boolean;
}

export interface IProgressRepository {
  load(userId: string): Promise<LocalProgress | null>;
  save(progress: LocalProgress): Promise<void>;
  markPendingSync(userId: string): Promise<void>;
  clearPendingSync(userId: string): Promise<void>;
}
