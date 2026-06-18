export interface CompletedLevelDto {
  levelId: string;
  score: number;
  timeSeconds: number;
  movesCount: number;
  completedAt: string;
}

export interface ProgressResponseDto {
  status: 'success';
  data: {
    progressId: string;
    userId: string;
    version: number;
    updatedAt: string;
    completedLevels: CompletedLevelDto[];
  };
}

export interface SyncProgressRequestDto {
  completedLevels: CompletedLevelDto[];
}
